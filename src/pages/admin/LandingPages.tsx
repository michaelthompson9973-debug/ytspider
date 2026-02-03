import { useState, useMemo } from 'react';
import { DeleteConfirmDialog } from '@/components/admin/landing-page-editor/DeleteConfirmDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Copy, 
  ExternalLink, 
  Layers, 
  Target,
  MoreHorizontal,
  Globe,
  FileText,
  Calendar,
  Search,
  LayoutGrid,
  List,
  ShoppingCart,
  Wallet,
  TrendingUp,
  Layout,
  BarChart3,
  Upload,
  X,
  EyeOff,
  Clock,
} from 'lucide-react';
import { z } from 'zod';
import { SectionBuilder } from '@/components/admin/landing-page-editor';
import { useTrackingProfilesSelect } from '@/hooks/useTrackingProfiles';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';

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

type StatusFilter = 'all' | 'published' | 'draft';

// Stat Card Component with Gradient Background
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  gradient: string;
  iconBg: string;
  iconColor: string;
}

function StatCard({ icon: Icon, label, value, subtext, gradient, iconBg, iconColor }: StatCardProps) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl p-4 sm:p-5",
      "bg-gradient-to-br shadow-md hover:shadow-lg transition-all duration-300",
      "hover:scale-[1.02] hover:-translate-y-0.5",
      gradient
    )}>
      {/* Decorative circles */}
      <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-white/10 blur-xl" />
      <div className="absolute -bottom-2 -left-2 h-12 w-12 rounded-full bg-white/5" />
      
      <div className="relative z-10 flex items-start gap-3">
        <div className={cn(
          "flex-shrink-0 p-2.5 sm:p-3 rounded-xl shadow-sm",
          iconBg
        )}>
          <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", iconColor)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-white/80 truncate mb-0.5">{label}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold font-digit tracking-tight text-white drop-shadow-sm">
            {value}
          </p>
          {subtext && (
            <p className="text-[10px] sm:text-xs text-white/70 mt-0.5">{subtext}</p>
          )}
        </div>
      </div>
    </div>
  );
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
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { profiles: trackingProfiles } = useTrackingProfilesSelect();

  // Fetch landing pages
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

  // Fetch enhanced stats (orders data)
  const { data: enhancedStats } = useQuery({
    queryKey: ['landing-pages-enhanced-stats'],
    queryFn: async () => {
      const [pagesResult, ordersResult] = await Promise.all([
        supabase.from('landing_pages').select('id, published, created_at'),
        supabase.from('orders').select('landing_page_id, total').not('landing_page_id', 'is', null),
      ]);

      const pagesData = pagesResult.data ?? [];
      const ordersData = ordersResult.data ?? [];

      const thisWeekStart = new Date();
      thisWeekStart.setDate(thisWeekStart.getDate() - 7);

      // Per-page stats
      const pageStats: Record<string, { orders: number; revenue: number }> = {};
      ordersData.forEach((order) => {
        if (order.landing_page_id) {
          if (!pageStats[order.landing_page_id]) {
            pageStats[order.landing_page_id] = { orders: 0, revenue: 0 };
          }
          pageStats[order.landing_page_id].orders += 1;
          pageStats[order.landing_page_id].revenue += Number(order.total) || 0;
        }
      });

      return {
        total: pagesData.length,
        published: pagesData.filter((p) => p.published).length,
        draft: pagesData.filter((p) => !p.published).length,
        thisWeek: pagesData.filter((p) => new Date(p.created_at) >= thisWeekStart).length,
        totalOrders: ordersData.length,
        totalRevenue: ordersData.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
        pageStats,
      };
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

  // Filter pages based on search query and status filter
  const filteredPages = useMemo(() => {
    let result = pages ?? [];
    
    // Search filter
    if (searchQuery) {
      result = result.filter((page) =>
        page.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.products?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Status filter
    if (statusFilter === 'published') {
      result = result.filter((p) => p.published);
    } else if (statusFilter === 'draft') {
      result = result.filter((p) => !p.published);
    }
    
    return result;
  }, [pages, searchQuery, statusFilter]);

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
      queryClient.invalidateQueries({ queryKey: ['landing-pages-enhanced-stats'] });
      setDialogOpen(false);
      resetForm();
      toast({ title: editingId ? 'পেজ আপডেট হয়েছে' : 'নতুন পেজ তৈরি হয়েছে' });
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
      queryClient.invalidateQueries({ queryKey: ['landing-pages-enhanced-stats'] });
      toast({ title: 'পেজ ডিলিট হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (page: LandingPage) => {
      const { data: newPage, error: pageError } = await supabase
        .from('landing_pages')
        .insert({
          slug: `${page.slug}-copy-${Date.now()}`,
          product_id: page.product_id,
          gtm_id: page.gtm_id,
          tracking_profile_id: page.tracking_profile_id,
          published: false,
          html_content: page.html_content,
          created_by: user?.id,
        })
        .select()
        .single();
      if (pageError) throw pageError;

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
          type: s.type,
          config: s.config,
        }));
        await supabase.from('landing_page_sections').insert(newSections);
      }

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

      // Copy checkout settings
      const { data: checkoutSettings } = await supabase
        .from('landing_page_checkout_settings')
        .select('*')
        .eq('landing_page_id', page.id)
        .maybeSingle();

      if (checkoutSettings) {
        const { id, landing_page_id, created_at, updated_at, ...settingsData } = checkoutSettings;
        await supabase.from('landing_page_checkout_settings').insert({
          ...settingsData,
          landing_page_id: newPage.id,
        });
      }

      // Copy products
      const { data: pageProducts } = await supabase
        .from('landing_page_products')
        .select('*')
        .eq('landing_page_id', page.id);

      if (pageProducts && pageProducts.length > 0) {
        const newProducts = pageProducts.map((p) => ({
          landing_page_id: newPage.id,
          product_id: p.product_id,
          default_quantity: p.default_quantity,
          sort_order: p.sort_order,
        }));
        await supabase.from('landing_page_products').insert(newProducts);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      queryClient.invalidateQueries({ queryKey: ['landing-pages-enhanced-stats'] });
      toast({ title: 'পেজ ডুপ্লিকেট হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Bulk mutations
  const bulkPublishMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('landing_pages')
        .update({ published: true })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      queryClient.invalidateQueries({ queryKey: ['landing-pages-enhanced-stats'] });
      setSelectedIds([]);
      toast({ title: `${selectedIds.length}টি পেজ পাবলিশ হয়েছে` });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const bulkUnpublishMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('landing_pages')
        .update({ published: false })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      queryClient.invalidateQueries({ queryKey: ['landing-pages-enhanced-stats'] });
      setSelectedIds([]);
      toast({ title: `${selectedIds.length}টি পেজ আনপাবলিশ হয়েছে` });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('landing_pages')
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      queryClient.invalidateQueries({ queryKey: ['landing-pages-enhanced-stats'] });
      setSelectedIds([]);
      toast({ title: `${selectedIds.length}টি পেজ ডিলিট হয়েছে` });
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

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredPages.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPages.map((p) => p.id));
    }
  };

  const isProcessing = bulkPublishMutation.isPending || bulkUnpublishMutation.isPending || bulkDeleteMutation.isPending;

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
      <div className="space-y-5">
        {/* Header with Quick Actions */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight">
              ল্যান্ডিং পেজ
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              আপনার সকল ল্যান্ডিং পেজ ম্যানেজ করুন
            </p>
          </div>
          
          {/* Quick Actions - Horizontal */}
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              onClick={() => { resetForm(); setDialogOpen(true); }}
              size="sm"
              className="font-medium"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              নতুন পেজ
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Layout className="mr-1.5 h-4 w-4" />
              টেমপ্লেট
            </Button>
            <Button variant="outline" size="sm" disabled>
              <BarChart3 className="mr-1.5 h-4 w-4" />
              Analytics
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Upload className="mr-1.5 h-4 w-4" />
              Bulk Import
            </Button>
          </div>
        </div>

        {/* Stats Cards - 5 Cards in Single Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          <StatCard
            icon={FileText}
            label="মোট পেজ"
            value={enhancedStats?.total ?? 0}
            gradient="from-slate-700 via-slate-800 to-slate-900"
            iconBg="bg-white/20 backdrop-blur-sm"
            iconColor="text-white"
          />
          <StatCard
            icon={Globe}
            label="পাবলিশড"
            value={enhancedStats?.published ?? 0}
            gradient="from-emerald-500 via-emerald-600 to-teal-700"
            iconBg="bg-white/20 backdrop-blur-sm"
            iconColor="text-white"
          />
          <StatCard
            icon={Pencil}
            label="ড্রাফট"
            value={enhancedStats?.draft ?? 0}
            gradient="from-amber-400 via-orange-500 to-orange-600"
            iconBg="bg-white/20 backdrop-blur-sm"
            iconColor="text-white"
          />
          <StatCard
            icon={ShoppingCart}
            label="মোট অর্ডার"
            value={enhancedStats?.totalOrders ?? 0}
            gradient="from-blue-500 via-blue-600 to-indigo-700"
            iconBg="bg-white/20 backdrop-blur-sm"
            iconColor="text-white"
          />
          <StatCard
            icon={TrendingUp}
            label="এই সপ্তাহে"
            value={enhancedStats?.thisWeek ?? 0}
            subtext="নতুন পেজ"
            gradient="from-pink-500 via-rose-500 to-red-600"
            iconBg="bg-white/20 backdrop-blur-sm"
            iconColor="text-white"
          />
        </div>


        {/* Status Filter Tabs + Search + View Toggle */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg w-fit">
            {([
              { key: 'all' as StatusFilter, label: 'সব', count: enhancedStats?.total ?? 0 },
              { key: 'published' as StatusFilter, label: 'পাবলিশড', count: enhancedStats?.published ?? 0 },
              { key: 'draft' as StatusFilter, label: 'ড্রাফট', count: enhancedStats?.draft ?? 0 },
            ]).map((tab) => (
              <Button
                key={tab.key}
                variant={statusFilter === tab.key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => { setStatusFilter(tab.key); setSelectedIds([]); }}
                className="text-xs sm:text-sm"
              >
                {tab.label}
                <Badge 
                  variant={statusFilter === tab.key ? 'secondary' : 'outline'} 
                  className="ml-1.5 text-[10px] px-1.5 py-0"
                >
                  {tab.count}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Search & View Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="পেজ খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex items-center border rounded-lg p-0.5">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
                className="h-8 w-8"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Select All (when items exist) */}
        {filteredPages.length > 0 && (
          <div className="flex items-center gap-3 px-1">
            <Checkbox
              checked={selectedIds.length === filteredPages.length && filteredPages.length > 0}
              onCheckedChange={selectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedIds.length > 0 
                ? `${selectedIds.length}টি সিলেক্টেড` 
                : 'সব সিলেক্ট করুন'
              }
            </span>
          </div>
        )}

        {/* Pages Grid/List */}
        {isLoading ? (
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" 
              : "space-y-3"
          )}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <Skeleton className="h-6 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPages.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">কোনো পেজ নেই</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? 'আপনার সার্চে কোনো পেজ পাওয়া যায়নি' : 'এখনো কোনো ল্যান্ডিং পেজ তৈরি হয়নি'}
              </p>
              {!searchQuery && (
                <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  প্রথম পেজ তৈরি করুন
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPages.map((page, index) => (
              <Card 
                key={page.id} 
                className={cn(
                  "group hover:shadow-lg transition-all duration-200",
                  selectedIds.includes(page.id) && "ring-2 ring-primary border-primary",
                  "animate-in fade-in-50 slide-in-from-bottom-2"
                )}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <Checkbox
                      checked={selectedIds.includes(page.id)}
                      onCheckedChange={() => toggleSelection(page.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base font-semibold truncate font-heading">
                          /{page.slug}
                        </CardTitle>
                        <Badge 
                          variant={page.published ? 'default' : 'secondary'}
                          className={cn(
                            "shrink-0 text-[10px] px-1.5",
                            page.published && "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20"
                          )}
                        >
                          {page.published ? 'পাবলিশড' : 'ড্রাফট'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">
                        {page.products?.name ?? 'কোনো প্রোডাক্ট নেই'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Page Stats Row */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground py-2.5 my-2 border-t border-b">
                    <div className="flex items-center gap-1">
                      <ShoppingCart className="h-3 w-3" />
                      <span>{enhancedStats?.pageStats?.[page.id]?.orders ?? 0} অর্ডার</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Wallet className="h-3 w-3" />
                      <span>৳{(enhancedStats?.pageStats?.[page.id]?.revenue ?? 0).toLocaleString('bn-BD')}</span>
                    </div>
                    <div className="flex items-center gap-1 ml-auto">
                      <Clock className="h-3 w-3" />
                      <span className="truncate max-w-[80px]">
                        {formatDistanceToNow(new Date(page.updated_at), { addSuffix: true, locale: bn })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => openBuilder(page)}
                      className="flex-1 font-medium h-8"
                    >
                      <Layers className="h-3.5 w-3.5 mr-1.5" />
                      এডিট
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {page.published && (
                          <DropdownMenuItem asChild>
                            <a href={`/p/${page.slug}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              লাইভ দেখুন
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => openEdit(page)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          সেটিংস
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicateMutation.mutate(page)}>
                          <Copy className="h-4 w-4 mr-2" />
                          ডুপ্লিকেট
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => {
                            setDeletingPageId(page.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          ডিলিট
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* List View */
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredPages.map((page) => (
                  <div 
                    key={page.id} 
                    className={cn(
                      "flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors",
                      selectedIds.includes(page.id) && "bg-primary/5"
                    )}
                  >
                    <Checkbox
                      checked={selectedIds.includes(page.id)}
                      onCheckedChange={() => toggleSelection(page.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold truncate font-heading">/{page.slug}</h3>
                        <Badge 
                          variant={page.published ? 'default' : 'secondary'}
                          className={cn(
                            "shrink-0 font-medium text-xs",
                            page.published && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          )}
                        >
                          {page.published ? 'পাবলিশড' : 'ড্রাফট'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{page.products?.name ?? 'প্রোডাক্ট নেই'}</span>
                        <span className="text-xs">•</span>
                        <span className="text-xs flex items-center gap-1">
                          <ShoppingCart className="h-3 w-3" />
                          {enhancedStats?.pageStats?.[page.id]?.orders ?? 0}
                        </span>
                        <span className="text-xs">•</span>
                        <span className="text-xs">৳{(enhancedStats?.pageStats?.[page.id]?.revenue ?? 0).toLocaleString('bn-BD')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {page.published && (
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                          <a href={`/p/${page.slug}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openBuilder(page)}
                        className="font-medium h-8"
                      >
                        <Layers className="h-3.5 w-3.5 mr-1.5" />
                        এডিট
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => openEdit(page)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            সেটিংস
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateMutation.mutate(page)}>
                            <Copy className="h-4 w-4 mr-2" />
                            ডুপ্লিকেট
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setDeletingPageId(page.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            ডিলিট
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Floating Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-background border rounded-lg shadow-xl px-4 py-3 animate-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{selectedIds.length}টি সিলেক্টেড</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setSelectedIds([])}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-6 w-px bg-border" />

            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => bulkPublishMutation.mutate(selectedIds)}
              disabled={isProcessing}
              className="h-8"
            >
              <Globe className="mr-1.5 h-3.5 w-3.5" />
              Publish
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => bulkUnpublishMutation.mutate(selectedIds)}
              disabled={isProcessing}
              className="h-8"
            >
              <EyeOff className="mr-1.5 h-3.5 w-3.5" />
              Unpublish
            </Button>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={() => bulkDeleteMutation.mutate(selectedIds)}
              disabled={isProcessing}
              className="h-8"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading">
                {editingId ? 'পেজ সেটিংস' : 'নতুন ল্যান্ডিং পেজ'}
              </DialogTitle>
              <DialogDescription>
                {editingId ? 'পেজের সেটিংস আপডেট করুন' : 'নতুন ল্যান্ডিং পেজ তৈরি করতে নিচের তথ্য দিন'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-sm font-medium">
                  Slug (URL path)
                </Label>
                <Input
                  id="slug"
                  placeholder="my-product-page"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  required
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  URL হবে: /p/{form.slug || 'your-slug'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product" className="text-sm font-medium">প্রোডাক্ট</Label>
                <Select
                  value={form.product_id ?? 'none'}
                  onValueChange={(val) => setForm({ ...form, product_id: val === 'none' ? null : val })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="প্রোডাক্ট সিলেক্ট করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">কোনো প্রোডাক্ট নেই</SelectItem>
                    {products?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tracking_profile" className="flex items-center gap-2 text-sm font-medium">
                  <Target className="h-4 w-4" />
                  ট্র্যাকিং প্রোফাইল
                </Label>
                <Select
                  value={form.tracking_profile_id ?? 'none'}
                  onValueChange={(val) => setForm({ ...form, tracking_profile_id: val === 'none' ? null : val })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="ট্র্যাকিং প্রোফাইল সিলেক্ট করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">কোনো ট্র্যাকিং নেই</SelectItem>
                    {trackingProfiles?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Purchase, add_to_cart ইভেন্ট এই প্রোফাইলের প্ল্যাটফর্মে পাঠানো হবে
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <Label htmlFor="published" className="text-sm font-medium">পাবলিশ স্ট্যাটাস</Label>
                  <p className="text-xs text-muted-foreground">পাবলিশ করলে পেজ লাইভ হয়ে যাবে</p>
                </div>
                <Switch
                  id="published"
                  checked={form.published}
                  onCheckedChange={(checked) => setForm({ ...form, published: checked })}
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  বাতিল
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
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
          title="ল্যান্ডিং পেজ ডিলিট"
          description="আপনি কি নিশ্চিত যে এই ল্যান্ডিং পেজটি ডিলিট করতে চান? সকল সেকশন এবং সেটিংস স্থায়ীভাবে মুছে যাবে। এই কাজটি আর ফেরানো যাবে না।"
        />
      </div>
    </AdminLayout>
  );
}
