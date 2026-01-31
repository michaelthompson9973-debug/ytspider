import { useState } from 'react';
import { DeleteConfirmDialog } from '@/components/admin/landing-page-editor/DeleteConfirmDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Copy, ExternalLink, Layers, Target } from 'lucide-react';
import { z } from 'zod';
import { SectionBuilder } from '@/components/admin/landing-page-editor';
import { useTrackingProfilesSelect } from '@/hooks/useTrackingProfiles';

const pageSchema = z.object({
  slug: z.string().min(1, 'Slug is required').max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes'),
  product_id: z.string().nullable(),
  gtm_id: z.string().max(50).optional(),
  tracking_profile_id: z.string().nullable(),
  published: z.boolean(),
});

type PageForm = z.infer<typeof pageSchema>;

const defaultForm: PageForm = {
  slug: '',
  product_id: null,
  gtm_id: '',
  tracking_profile_id: null,
  published: false,
};

interface LandingPage {
  id: string;
  slug: string;
  product_id: string | null;
  gtm_id: string | null;
  tracking_profile_id: string | null;
  published: boolean;
  html_content: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  products: { name: string } | null;
  tracking_profiles: { name: string } | null;
}

export default function LandingPages() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PageForm>(defaultForm);
  const [builderPageId, setBuilderPageId] = useState<string | null>(null);
  const [builderGtmId, setBuilderGtmId] = useState<string | undefined>();
  const [builderSlug, setBuilderSlug] = useState<string | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPageId, setDeletingPageId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { profiles: trackingProfiles } = useTrackingProfilesSelect();

  const { data: pages, isLoading } = useQuery({
    queryKey: ['landing-pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_pages')
        .select(`
          *,
          products (name),
          tracking_profiles (name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as LandingPage[];
    },
  });

  const { data: products } = useQuery({
    queryKey: ['products-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: PageForm) => {
      if (editingId) {
        const { error } = await supabase
          .from('landing_pages')
          .update({
            slug: data.slug,
            product_id: data.product_id || null,
            gtm_id: data.gtm_id || null,
            tracking_profile_id: data.tracking_profile_id || null,
            published: data.published,
          })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('landing_pages').insert([{
          slug: data.slug,
          product_id: data.product_id || null,
          gtm_id: data.gtm_id || null,
          tracking_profile_id: data.tracking_profile_id || null,
          published: data.published,
          html_content: '',
          created_by: user?.id,
        }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      setDialogOpen(false);
      resetForm();
      toast({ title: editingId ? 'Page updated' : 'Page created' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('landing_pages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      toast({ title: 'Page deleted' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (page: LandingPage) => {
      // Create the new page
      const { data: newPage, error: pageError } = await supabase
        .from('landing_pages')
        .insert({
          slug: `${page.slug}-copy-${Date.now()}`,
          product_id: page.product_id,
          gtm_id: page.gtm_id,
          published: false,
          html_content: page.html_content,
          created_by: user?.id,
        })
        .select()
        .single();
      if (pageError) throw pageError;

      // Duplicate sections
      const { data: sections } = await supabase
        .from('landing_page_sections')
        .select('*')
        .eq('landing_page_id', page.id)
        .order('sort_order');

      if (sections && sections.length > 0) {
        const newSections = sections.map((s) => ({
          landing_page_id: newPage.id,
          name: s.name,
          html: s.html,
          sort_order: s.sort_order,
        }));
        await supabase.from('landing_page_sections').insert(newSections);
      }

      // Duplicate theme
      const { data: theme } = await supabase
        .from('landing_page_theme')
        .select('*')
        .eq('landing_page_id', page.id)
        .maybeSingle();

      if (theme) {
        await supabase.from('landing_page_theme').insert({
          landing_page_id: newPage.id,
          config: theme.config,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      toast({ title: 'Page duplicated with sections and theme' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const openEdit = (page: LandingPage) => {
    setForm({
      slug: page.slug,
      product_id: page.product_id,
      gtm_id: page.gtm_id ?? '',
      tracking_profile_id: page.tracking_profile_id,
      published: page.published,
    });
    setEditingId(page.id);
    setDialogOpen(true);
  };

  const openBuilder = (page: LandingPage) => {
    setBuilderPageId(page.id);
    setBuilderGtmId(page.gtm_id ?? undefined);
    setBuilderSlug(page.slug);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = pageSchema.safeParse(form);
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

  // If we're in builder mode, show the section builder
  if (builderPageId) {
    return (
      <AdminLayout>
        <SectionBuilder
          landingPageId={builderPageId}
          gtmId={builderGtmId}
          slug={builderSlug}
          onBack={() => setBuilderPageId(null)}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Landing Pages</h1>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            New Page
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Slug</th>
                    <th className="px-4 py-3 text-left font-medium">Product</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        Loading...
                      </td>
                    </tr>
                  ) : pages?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        No landing pages yet
                      </td>
                    </tr>
                  ) : (
                    pages?.map((page) => (
                      <tr key={page.id} className="border-b">
                        <td className="px-4 py-3 font-medium">/{page.slug}</td>
                        <td className="px-4 py-3">{page.products?.name ?? '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                            page.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {page.published ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1">
                          {page.published && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <a href={`/p/${page.slug}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openBuilder(page)}
                            title="Edit Sections"
                          >
                            <Layers className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(page)}
                            title="Page Settings"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => duplicateMutation.mutate(page)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeletingPageId(page.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Page Settings' : 'New Landing Page'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL path)</Label>
                <Input
                  id="slug"
                  placeholder="my-product-page"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product">Product</Label>
                <Select
                  value={form.product_id ?? 'none'}
                  onValueChange={(val) => setForm({ ...form, product_id: val === 'none' ? null : val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No product</SelectItem>
                    {products?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tracking_profile" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Tracking Profile
                </Label>
                <Select
                  value={form.tracking_profile_id ?? 'none'}
                  onValueChange={(val) => setForm({ ...form, tracking_profile_id: val === 'none' ? null : val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tracking profile" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No tracking profile</SelectItem>
                    {trackingProfiles?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Events (purchase, add_to_cart) will be sent to this profile's configured platforms
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="published"
                  checked={form.published}
                  onCheckedChange={(checked) => setForm({ ...form, published: checked })}
                />
                <Label htmlFor="published">Published</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={() => {
            if (deletingPageId) {
              deleteMutation.mutate(deletingPageId);
            }
            setDeleteDialogOpen(false);
            setDeletingPageId(null);
          }}
          title="Delete Landing Page"
          description="Are you sure you want to delete this landing page? All sections and settings will be permanently removed. This action cannot be undone."
        />
      </div>
    </AdminLayout>
  );
}
