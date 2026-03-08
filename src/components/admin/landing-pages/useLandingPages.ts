import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useShop } from '@/contexts/ShopContext';
import { useToast } from '@/hooks/use-toast';
import type { LandingPage, PageForm, StatusFilter, EnhancedStats } from './types';

const PAGE_SIZE = 24;

export function useLandingPages() {
  const { currentShop } = useShop();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(0);

  // ── Queries ──────────────────────────────────────────────
  const { data: pagesData, isLoading } = useQuery({
    queryKey: ['landing-pages', currentShop?.id, statusFilter, searchQuery, page],
    queryFn: async () => {
      if (!currentShop) return { pages: [] as LandingPage[], total: 0 };

      let query = supabase
        .from('landing_pages')
        .select(`*, products (name), tracking_profiles (name)`, { count: 'exact' })
        .eq('shop_id', currentShop.id)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (statusFilter === 'published') query = query.eq('published', true);
      if (statusFilter === 'draft') query = query.eq('published', false);
      if (searchQuery) query = query.ilike('slug', `%${searchQuery}%`);

      const { data, error, count } = await query;
      if (error) throw error;
      return { pages: (data ?? []) as LandingPage[], total: count ?? 0 };
    },
    enabled: !!currentShop,
  });

  const pages = pagesData?.pages ?? [];
  const totalPages = pagesData?.total ?? 0;
  const totalPagesCount = Math.ceil(totalPages / PAGE_SIZE);

  const { data: enhancedStats } = useQuery<EnhancedStats | null>({
    queryKey: ['landing-pages-enhanced-stats', currentShop?.id],
    queryFn: async () => {
      if (!currentShop) return null;
      const [pagesResult, ordersResult] = await Promise.all([
        supabase.from('landing_pages').select('id, published, created_at').eq('shop_id', currentShop.id),
        supabase.from('orders').select('landing_page_id, total').eq('shop_id', currentShop.id).not('landing_page_id', 'is', null),
      ]);
      const pagesData = pagesResult.data ?? [];
      const ordersData = ordersResult.data ?? [];
      const thisWeekStart = new Date();
      thisWeekStart.setDate(thisWeekStart.getDate() - 7);

      const pageStats: Record<string, { orders: number; revenue: number }> = {};
      ordersData.forEach((order) => {
        if (order.landing_page_id) {
          if (!pageStats[order.landing_page_id]) pageStats[order.landing_page_id] = { orders: 0, revenue: 0 };
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
    enabled: !!currentShop,
  });

  const { data: products } = useQuery({
    queryKey: ['products-select', currentShop?.id],
    queryFn: async () => {
      if (!currentShop) return [];
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('shop_id', currentShop.id)
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!currentShop,
  });

  // ── Invalidation helper ──────────────────────────────────
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
    queryClient.invalidateQueries({ queryKey: ['landing-pages-enhanced-stats'] });
  };

  // ── Mutations ────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async ({ form, editingId }: { form: PageForm; editingId: string | null }) => {
      if (!currentShop) throw new Error('No shop selected');
      if (editingId) {
        const { error } = await supabase.from('landing_pages').update({
          slug: form.slug,
          product_id: form.product_id || null,
          gtm_id: form.gtm_id || null,
          tracking_profile_id: form.tracking_profile_id || null,
          published: form.published,
        }).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('landing_pages').insert([{
          slug: form.slug,
          product_id: form.product_id || null,
          gtm_id: form.gtm_id || null,
          tracking_profile_id: form.tracking_profile_id || null,
          published: form.published,
          html_content: '',
          created_by: user?.id,
          shop_id: currentShop.id,
        }]);
        if (error) throw error;
      }
    },
    onSuccess: (_, { editingId }) => {
      invalidate();
      toast({ title: editingId ? 'পেজ আপডেট হয়েছে' : 'নতুন পেজ তৈরি হয়েছে' });
    },
    onError: (error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('landing_pages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: 'পেজ ডিলিট হয়েছে' }); },
    onError: (error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (p: LandingPage) => {
      if (!currentShop) throw new Error('No shop selected');
      const { data: newPage, error: pageError } = await supabase.from('landing_pages').insert({
        slug: `${p.slug}-copy-${Date.now()}`,
        product_id: p.product_id, gtm_id: p.gtm_id, tracking_profile_id: p.tracking_profile_id,
        published: false, html_content: p.html_content, created_by: user?.id, shop_id: currentShop.id,
      }).select().single();
      if (pageError) throw pageError;

      const { data: sections } = await supabase.from('landing_page_sections').select('*').eq('landing_page_id', p.id).order('sort_order');
      if (sections?.length) {
        await supabase.from('landing_page_sections').insert(sections.map((s) => ({
          landing_page_id: newPage.id, name: s.name, html: s.html, sort_order: s.sort_order, type: s.type, config: s.config,
        })));
      }
      const { data: theme } = await supabase.from('landing_page_theme').select('*').eq('landing_page_id', p.id).maybeSingle();
      if (theme) await supabase.from('landing_page_theme').insert({ landing_page_id: newPage.id, config: theme.config });

      const { data: cs } = await supabase.from('landing_page_checkout_settings').select('*').eq('landing_page_id', p.id).maybeSingle();
      if (cs) {
        const { id, landing_page_id, created_at, updated_at, ...rest } = cs;
        await supabase.from('landing_page_checkout_settings').insert({ ...rest, landing_page_id: newPage.id });
      }
      const { data: prods } = await supabase.from('landing_page_products').select('*').eq('landing_page_id', p.id);
      if (prods?.length) {
        await supabase.from('landing_page_products').insert(prods.map((pr) => ({
          landing_page_id: newPage.id, product_id: pr.product_id, default_quantity: pr.default_quantity, sort_order: pr.sort_order,
        })));
      }
    },
    onSuccess: () => { invalidate(); toast({ title: 'পেজ ডুপ্লিকেট হয়েছে' }); },
    onError: (error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  const bulkPublishMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('landing_pages').update({ published: true }).in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: `${selectedIds.length}টি পেজ পাবলিশ হয়েছে` }); setSelectedIds([]); },
    onError: (error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  const bulkUnpublishMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('landing_pages').update({ published: false }).in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: `${selectedIds.length}টি পেজ আনপাবলিশ হয়েছে` }); setSelectedIds([]); },
    onError: (error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('landing_pages').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: `${selectedIds.length}টি পেজ ডিলিট হয়েছে` }); setSelectedIds([]); },
    onError: (error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  // ── Selection helpers ────────────────────────────────────
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const selectAll = () => {
    setSelectedIds((prev) => prev.length === pages.length ? [] : pages.map((p) => p.id));
  };

  const isProcessing = bulkPublishMutation.isPending || bulkUnpublishMutation.isPending || bulkDeleteMutation.isPending;

  return {
    // Data
    pages,
    products,
    enhancedStats,
    isLoading,
    // Pagination
    page, setPage, totalPagesCount, totalPages,
    // Filters
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    // Selection
    selectedIds, setSelectedIds, toggleSelection, selectAll,
    // Mutations
    saveMutation, deleteMutation, duplicateMutation,
    bulkPublishMutation, bulkUnpublishMutation, bulkDeleteMutation,
    isProcessing,
    // Context
    currentShop,
  };
}
