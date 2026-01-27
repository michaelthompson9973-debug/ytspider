import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Globe, CheckCircle, XCircle } from 'lucide-react';

interface AllowedDomain {
  id: string;
  domain: string;
  enabled: boolean;
  created_at: string;
}

// Domain validation regex
const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i;

export default function AllowedDomains() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState<AllowedDomain | null>(null);
  const [newDomain, setNewDomain] = useState('');
  const [domainError, setDomainError] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: domains, isLoading } = useQuery({
    queryKey: ['allowed-domains'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('allowed_domains')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AllowedDomain[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (domain: string) => {
      const { error } = await supabase
        .from('allowed_domains')
        .insert([{ domain: domain.toLowerCase() }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowed-domains'] });
      setDialogOpen(false);
      setNewDomain('');
      toast({ title: 'Domain added successfully' });
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast({ title: 'Error', description: 'This domain already exists', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('allowed_domains')
        .update({ enabled })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allowed-domains'] });
      toast({ 
        title: variables.enabled ? 'Domain enabled' : 'Domain disabled',
        description: variables.enabled 
          ? 'Landing pages can now be served on this domain' 
          : 'Landing pages will be blocked on this domain'
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('allowed_domains')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowed-domains'] });
      setDeleteDialogOpen(false);
      setDomainToDelete(null);
      toast({ title: 'Domain removed' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const validateDomain = (domain: string): boolean => {
    if (!domain.trim()) {
      setDomainError('Domain is required');
      return false;
    }
    if (!domainRegex.test(domain)) {
      setDomainError('Invalid domain format (e.g., example.com or sub.example.com)');
      return false;
    }
    setDomainError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateDomain(newDomain)) {
      addMutation.mutate(newDomain);
    }
  };

  const handleDeleteClick = (domain: AllowedDomain) => {
    setDomainToDelete(domain);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (domainToDelete) {
      deleteMutation.mutate(domainToDelete.id);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Allowed Domains</h1>
            <p className="text-muted-foreground">
              Control which domains can serve landing pages
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Domain
          </Button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Loading...</div>
        ) : !domains || domains.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Globe className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-2">No domains configured</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Add domains to the allowlist. Only approved domains can serve your landing pages.
                Localhost and preview domains are automatically allowed.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {domains.map((domain) => (
                  <div
                    key={domain.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <span className="font-mono text-sm font-medium">{domain.domain}</span>
                        <p className="text-xs text-muted-foreground">
                          Added {new Date(domain.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge 
                        variant={domain.enabled ? 'default' : 'secondary'}
                        className="gap-1"
                      >
                        {domain.enabled ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            Enabled
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" />
                            Disabled
                          </>
                        )}
                      </Badge>
                      <Switch
                        checked={domain.enabled}
                        onCheckedChange={(checked) => 
                          toggleMutation.mutate({ id: domain.id, enabled: checked })
                        }
                        disabled={toggleMutation.isPending}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(domain)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="py-4">
            <h4 className="font-semibold text-sm mb-2">How it works</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Add domains that should serve your landing pages</li>
              <li>• Disabled domains will show "Domain Not Authorized" page</li>
              <li>• Slug-based routing works on all enabled domains (e.g., domain.com/sale)</li>
              <li>• Localhost and preview environments are automatically bypassed</li>
            </ul>
          </CardContent>
        </Card>

        {/* Add Domain Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Allowed Domain</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  placeholder="example.com or sub.example.com"
                  value={newDomain}
                  onChange={(e) => {
                    setNewDomain(e.target.value.toLowerCase());
                    if (domainError) validateDomain(e.target.value);
                  }}
                  className={domainError ? 'border-destructive' : ''}
                />
                {domainError && (
                  <p className="text-xs text-destructive">{domainError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Configure your DNS to point this domain to your server
                </p>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setDialogOpen(false);
                    setNewDomain('');
                    setDomainError('');
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={addMutation.isPending}>
                  {addMutation.isPending ? 'Adding...' : 'Add Domain'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Domain?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove <strong>{domainToDelete?.domain}</strong>? 
                Landing pages will no longer be accessible on this domain.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
