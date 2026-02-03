import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import { CreateShopDialog } from '@/components/admin/CreateShopDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Store, Plus, Settings, Trash2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Shop = Database['public']['Tables']['shops']['Row'];

export default function AllShops() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [deleteShop, setDeleteShop] = useState<Shop | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Fetch all shops
  const { data: shops, isLoading } = useQuery({
    queryKey: ['all-shops'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Shop[];
    },
  });

  // Toggle shop status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('shops')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-shops'] });
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      toast.success('Shop status updated');
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    },
  });

  // Delete shop
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shops')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-shops'] });
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      toast.success('Shop deleted successfully');
      setDeleteShop(null);
    },
    onError: (error) => {
      toast.error('Failed to delete: ' + error.message);
    },
  });

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'pro':
        return 'default';
      case 'enterprise':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Store className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">{t('sidebar.allShops')}</h1>
              <p className="text-muted-foreground">Manage all shops in the system</p>
            </div>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Shop
          </Button>
        </div>

        {/* Shops Table */}
        {isLoading ? (
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ) : shops?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Store className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">No shops yet</h3>
              <p className="text-muted-foreground mb-4">Create your first shop to get started</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Shop
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow className="bg-accent/50">
                  <TableHead>Shop Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shops?.map((shop) => (
                  <TableRow key={shop.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                          <Store className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{shop.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{shop.slug}</TableCell>
                    <TableCell>
                      <Badge variant={getPlanBadgeVariant(shop.plan)} className="capitalize">
                        {shop.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={shop.is_active}
                        onCheckedChange={(checked) => 
                          toggleStatusMutation.mutate({ id: shop.id, is_active: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(shop.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setDeleteShop(shop)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteShop} onOpenChange={() => setDeleteShop(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the shop
              "{deleteShop?.name}" and all associated data including products, orders,
              and landing pages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteShop && deleteMutation.mutate(deleteShop.id)}
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Shop Dialog */}
      <CreateShopDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['all-shops'] })}
      />
    </AdminLayout>
  );
}
