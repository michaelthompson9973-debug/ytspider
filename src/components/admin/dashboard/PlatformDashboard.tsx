import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useShop, Shop, ShopPlan } from '@/contexts/ShopContext';
import { KpiCard, KpiCardSkeleton } from './KpiCard';
import { ShopPerformanceTable } from './ShopPerformanceTable';
import {
  Wallet,
  ShoppingCart,
  Store,
  FileText,
  Package,
} from 'lucide-react';

interface ShopStats {
  shop: Shop;
  ordersCount: number;
  revenue: number;
  productsCount: number;
  pagesCount: number;
}

export function PlatformDashboard() {
  const { t } = useLanguage();
  const { availableShops } = useShop();

  // Fetch aggregated platform stats
  const { data: platformStats, isLoading: statsLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      // Fetch counts for all shops
      const [ordersResult, productsResult, pagesResult] = await Promise.all([
        supabase.from('orders').select('shop_id, total, status'),
        supabase.from('products').select('shop_id', { count: 'exact', head: true }).eq('active', true),
        supabase.from('landing_pages').select('shop_id', { count: 'exact', head: true }),
      ]);

      const orders = ordersResult.data || [];
      const activeShops = availableShops.filter(s => s.is_active).length;

      // Calculate totals
      const totalRevenue = orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const totalOrders = orders.length;

      return {
        totalRevenue,
        totalOrders,
        activeShops,
        totalProducts: productsResult.count ?? 0,
        totalPages: pagesResult.count ?? 0,
      };
    },
  });

  // Fetch per-shop stats for the table
  const { data: shopStats, isLoading: shopStatsLoading } = useQuery({
    queryKey: ['shop-stats', availableShops.map(s => s.id)],
    queryFn: async () => {
      if (availableShops.length === 0) return [];

      const stats: ShopStats[] = [];

      for (const shop of availableShops) {
        const [ordersResult, productsResult, pagesResult] = await Promise.all([
          supabase.from('orders').select('total, status').eq('shop_id', shop.id),
          supabase.from('products').select('id', { count: 'exact', head: true }).eq('shop_id', shop.id).eq('active', true),
          supabase.from('landing_pages').select('id', { count: 'exact', head: true }).eq('shop_id', shop.id),
        ]);

        const orders = ordersResult.data || [];
        const revenue = orders
          .filter(o => o.status !== 'cancelled')
          .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

        stats.push({
          shop: shop,
          ordersCount: orders.length,
          revenue,
          productsCount: productsResult.count ?? 0,
          pagesCount: pagesResult.count ?? 0,
        });
      }

      // Sort by revenue descending
      return stats.sort((a, b) => b.revenue - a.revenue);
    },
    enabled: availableShops.length > 0,
  });

  const kpiCards = [
    {
      key: 'revenue',
      title: t('platform.totalRevenue'),
      value: `৳${(platformStats?.totalRevenue ?? 0).toLocaleString()}`,
      icon: Wallet,
      gradient: 'from-blue-500 to-purple-600',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      key: 'orders',
      title: t('platform.totalOrders'),
      value: platformStats?.totalOrders ?? 0,
      icon: ShoppingCart,
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      key: 'shops',
      title: t('platform.activeShops'),
      value: platformStats?.activeShops ?? 0,
      subtitle: `${availableShops.length} total`,
      icon: Store,
      gradient: 'from-orange-400 to-amber-500',
      iconBg: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      key: 'products',
      title: t('platform.totalProducts'),
      value: platformStats?.totalProducts ?? 0,
      icon: Package,
      gradient: 'from-indigo-500 to-violet-600',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      key: 'pages',
      title: t('platform.totalPages'),
      value: platformStats?.totalPages ?? 0,
      icon: FileText,
      gradient: 'from-pink-500 to-rose-600',
      iconBg: 'bg-pink-100 dark:bg-pink-900/30',
      iconColor: 'text-pink-600 dark:text-pink-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('platform.title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('platform.allShopsOverview')}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statsLoading
          ? Array.from({ length: 5 }).map((_, i) => <KpiCardSkeleton key={i} />)
          : kpiCards.map((card) => (
              <KpiCard
                key={card.key}
                title={card.title}
                value={card.value}
                subtitle={card.subtitle}
                icon={card.icon}
                gradient={card.gradient}
                iconBg={card.iconBg}
                iconColor={card.iconColor}
              />
            ))}
      </div>

      {/* Shop Performance Table */}
      <ShopPerformanceTable 
        shopStats={shopStats || []} 
        isLoading={shopStatsLoading} 
      />
    </div>
  );
}
