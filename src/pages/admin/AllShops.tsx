import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import { CreateShopForUserDialog } from '@/components/admin/CreateShopForUserDialog';
import { ShopManageModal, type ShopOverviewRow } from '@/components/admin/ShopManageModal';
import { ResetCredentialsDialog } from '@/components/admin/ResetCredentialsDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Store,
  Plus,
  Settings,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Timer,
  Package,
  FileText,
  ShoppingCart,
  Users,
  KeyRound,
} from 'lucide-react';

const PAGE_SIZE = 20;

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof ShieldCheck }> = {
  active: { label: 'Active', variant: 'default', icon: ShieldCheck },
  grace_period: { label: 'Grace Period', variant: 'secondary', icon: Timer },
  suspended: { label: 'Suspended', variant: 'destructive', icon: ShieldAlert },
  cancelled: { label: 'Cancelled', variant: 'outline', icon: ShieldOff },
};

export default function AllShops() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [manageShop, setManageShop] = useState<ShopOverviewRow | null>(null);
  const [resetTarget, setResetTarget] = useState<{ userId: string; email: string; name: string } | null>(null);

  // Debounced search
  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    const timeout = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(0);
    }, 400);
    return () => clearTimeout(timeout);
  }, []);

  // Fetch via RPC with pagination
  const { data, isLoading } = useQuery({
    queryKey: ['admin-shops', page, debouncedSearch, statusFilter],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_shops_overview', {
        _limit: PAGE_SIZE,
        _offset: page * PAGE_SIZE,
        _search: debouncedSearch,
        _status_filter: statusFilter,
      });
      if (error) throw error;
      return data as ShopOverviewRow[];
    },
  });

  const shops = data ?? [];
  const totalRows = shops[0]?.total_rows ?? 0;
  const totalPages = Math.ceil(totalRows / PAGE_SIZE);

  // Quick status mutation (from dropdown)
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const is_active = status === 'active' || status === 'grace_period';
      const { error } = await supabase
        .from('shops')
        .update({ status: status as any, is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shops'] });
      toast.success('Shop status updated');
    },
    onError: (err) => toast.error('Failed: ' + (err as Error).message),
  });

  const getStatusConfig = (status: string) =>
    STATUS_CONFIG[status] || STATUS_CONFIG.active;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Store className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">{t('sidebar.allShops')}</h1>
              <p className="text-sm text-muted-foreground">
                {totalRows > 0 ? `${totalRows} shops registered` : 'Master control for all tenants'}
              </p>
            </div>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Shop
          </Button>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, slug, or owner email…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v === 'all' ? '' : v);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Data Table */}
        {isLoading ? (
          <Card>
            <CardContent className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </CardContent>
          </Card>
        ) : shops.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Store className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">
                {debouncedSearch || statusFilter ? 'No matching shops' : 'No shops yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {debouncedSearch || statusFilter
                  ? 'Try adjusting your filters'
                  : 'Create your first shop to get started'}
              </p>
              {!debouncedSearch && !statusFilter && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Shop
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow className="bg-accent/50">
                  <TableHead>Shop</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Resources</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shops.map((shop) => {
                  const sc = getStatusConfig(shop.status);
                  const StatusIcon = sc.icon;
                  return (
                    <TableRow key={shop.id}>
                      {/* Shop Name */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                            <Store className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{shop.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {shop.slug}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Owner */}
                      <TableCell>
                        <div className="min-w-0">
                          <div className="text-sm truncate">
                            {shop.owner_name || '—'}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {shop.owner_email || '—'}
                          </div>
                        </div>
                      </TableCell>

                      {/* Plan */}
                      <TableCell>
                        <Badge variant="outline" className="capitalize font-digit">
                          {shop.plan || 'free'}
                        </Badge>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge variant={sc.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {sc.label}
                        </Badge>
                      </TableCell>

                      {/* Resources */}
                      <TableCell>
                        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground font-digit">
                          <span className="flex items-center gap-1" title="Products">
                            <Package className="h-3 w-3" />
                            {shop.product_count}
                          </span>
                          <span className="flex items-center gap-1" title="Pages">
                            <FileText className="h-3 w-3" />
                            {shop.landing_page_count}
                          </span>
                          <span className="flex items-center gap-1" title="Orders">
                            <ShoppingCart className="h-3 w-3" />
                            {shop.order_count}
                          </span>
                          <span className="flex items-center gap-1" title="Team">
                            <Users className="h-3 w-3" />
                            {shop.team_member_count}
                          </span>
                        </div>
                      </TableCell>

                      {/* Created */}
                      <TableCell className="text-muted-foreground text-sm font-digit">
                        {new Date(shop.created_at).toLocaleDateString()}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setManageShop(shop)}>
                              <Settings className="h-4 w-4 mr-2" />
                              Manage Shop
                            </DropdownMenuItem>
                            {shop.owner_id && (
                              <DropdownMenuItem onClick={() => setResetTarget({ userId: shop.owner_id!, email: shop.owner_email || '', name: shop.owner_name || '' })}>
                                <KeyRound className="h-4 w-4 mr-2" />
                                Reset Password
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {shop.status !== 'active' && (
                              <DropdownMenuItem
                                onClick={() =>
                                  statusMutation.mutate({ id: shop.id, status: 'active' })
                                }
                              >
                                <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
                                Set Active
                              </DropdownMenuItem>
                            )}
                            {shop.status !== 'suspended' && (
                              <DropdownMenuItem
                                onClick={() =>
                                  statusMutation.mutate({ id: shop.id, status: 'suspended' })
                                }
                                className="text-destructive focus:text-destructive"
                              >
                                <ShieldAlert className="h-4 w-4 mr-2" />
                                Suspend Shop
                              </DropdownMenuItem>
                            )}
                            {shop.status !== 'cancelled' && (
                              <DropdownMenuItem
                                onClick={() =>
                                  statusMutation.mutate({ id: shop.id, status: 'cancelled' })
                                }
                                className="text-destructive focus:text-destructive"
                              >
                                <ShieldOff className="h-4 w-4 mr-2" />
                                Cancel Shop
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-muted-foreground font-digit">
                  Page {page + 1} of {totalPages} ({totalRows} shops)
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Shop Management Modal */}
      <ShopManageModal
        shop={manageShop}
        open={!!manageShop}
        onOpenChange={(open) => !open && setManageShop(null)}
      />

      {/* Create Shop Dialog */}
      <CreateShopForUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['admin-shops'] })}
      />

      {/* Reset Credentials Dialog */}
      <ResetCredentialsDialog
        open={!!resetTarget}
        onOpenChange={(open) => !open && setResetTarget(null)}
        userId={resetTarget?.userId ?? null}
        userEmail={resetTarget?.email ?? null}
        userName={resetTarget?.name ?? null}
      />
    </AdminLayout>
  );
}
