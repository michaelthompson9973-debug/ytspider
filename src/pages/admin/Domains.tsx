import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Globe, Star } from 'lucide-react';
import { z } from 'zod';

// Type for domain mapping since it's not in generated types yet
interface DomainMapping {
  id: string;
  landing_page_id: string;
  domain: string;
  is_primary: boolean;
  created_at: string;
  landing_pages?: { slug: string } | null;
}

interface LandingPageSelect {
  id: string;
  slug: string;
}

const domainSchema = z.object({
  landing_page_id: z.string().min(1, 'Landing page is required'),
  domain: z.string().min(1, 'Domain is required').regex(/^[a-z0-9.-]+\.[a-z]{2,}$/, 'Invalid domain format'),
  is_primary: z.boolean(),
});

type DomainForm = z.infer<typeof domainSchema>;

const defaultForm: DomainForm = {
  landing_page_id: '',
  domain: '',
  is_primary: false,
};

export default function Domains() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<DomainForm>(defaultForm);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: domains, isLoading } = useQuery({
    queryKey: ['domain-mappings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('domain_mappings' as never)
        .select(`
          *,
          landing_pages (slug)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as DomainMapping[];
    },
  });

  const { data: landingPages } = useQuery({
    queryKey: ['landing-pages-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_pages')
        .select('id, slug')
        .eq('published', true)
        .order('slug');
      if (error) throw error;
      return data as LandingPageSelect[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: DomainForm) => {
      const payload = {
        landing_page_id: data.landing_page_id,
        domain: data.domain.toLowerCase(),
        is_primary: data.is_primary,
      };
      const { error } = await supabase.from('domain_mappings' as never).insert([payload] as never);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domain-mappings'] });
      setDialogOpen(false);
      setForm(defaultForm);
      toast({ title: 'Domain added' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('domain_mappings' as never).delete().eq('id' as never, id as never);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domain-mappings'] });
      toast({ title: 'Domain removed' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async ({ id, landingPageId }: { id: string; landingPageId: string }) => {
      // First, unset all primaries for this landing page
      await supabase
        .from('domain_mappings' as never)
        .update({ is_primary: false } as never)
        .eq('landing_page_id' as never, landingPageId as never);
      
      // Then set the new primary
      const { error } = await supabase
        .from('domain_mappings' as never)
        .update({ is_primary: true } as never)
        .eq('id' as never, id as never);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domain-mappings'] });
      toast({ title: 'Primary domain updated' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = domainSchema.safeParse(form);
    if (!validation.success) {
      toast({
        title: 'Validation Error',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }
    saveMutation.mutate(form);
  };

  // Group domains by landing page
  const groupedDomains = domains?.reduce((acc, domain) => {
    const key = domain.landing_page_id;
    if (!acc[key]) {
      acc[key] = {
        slug: domain.landing_pages?.slug ?? 'Unknown',
        domains: [] as DomainMapping[],
      };
    }
    acc[key].domains.push(domain);
    return acc;
  }, {} as Record<string, { slug: string; domains: DomainMapping[] }>);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Custom Domains</h1>
            <p className="text-muted-foreground">Map domains to landing pages</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Domain
          </Button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Loading...</div>
        ) : !groupedDomains || Object.keys(groupedDomains).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No custom domains configured. Add one to serve landing pages on your own domains.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedDomains).map(([pageId, { slug, domains: pageDomains }]) => (
              <Card key={pageId}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    /{slug}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {pageDomains.map((domain) => (
                      <div
                        key={domain.id}
                        className="flex items-center justify-between py-2 px-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{domain.domain}</span>
                          {domain.is_primary && (
                            <Badge variant="secondary" className="gap-1">
                              <Star className="h-3 w-3" /> Primary
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {!domain.is_primary && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPrimaryMutation.mutate({
                                id: domain.id,
                                landingPageId: domain.landing_page_id,
                              })}
                            >
                              Set Primary
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteMutation.mutate(domain.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Domain</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="landing_page">Landing Page</Label>
                <Select
                  value={form.landing_page_id}
                  onValueChange={(val) => setForm({ ...form, landing_page_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a page" />
                  </SelectTrigger>
                  <SelectContent>
                    {landingPages?.map((page) => (
                      <SelectItem key={page.id} value={page.id}>/{page.slug}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={form.domain}
                  onChange={(e) => setForm({ ...form, domain: e.target.value.toLowerCase() })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Point your domain's A record to 185.158.133.1
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_primary"
                  checked={form.is_primary}
                  onCheckedChange={(checked) => setForm({ ...form, is_primary: checked })}
                />
                <Label htmlFor="is_primary">Set as primary domain</Label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Adding...' : 'Add Domain'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
