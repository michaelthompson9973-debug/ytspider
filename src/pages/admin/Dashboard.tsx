import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useShop } from '@/contexts/ShopContext';
import { ShopGuard } from '@/components/admin/ShopGuard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDashboardRealtime } from '@/hooks/useDashboardRealtime';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  KpiCard,
  KpiCardSkeleton,
  SalesChart,
  BestSellingProducts,
  RecentOrdersTable,
  OrderStatusChart,
} from '@/components/admin/dashboard';
import {
  Wallet,
  ShoppingCart,
  Package,
  CheckCircle2,
  XCircle,
  Box,
} from 'lucide-react';

export default function Dashboard() {
  const { t } = useLanguage();
  const { currentShop } = useShop();
  
  // Enable real-time updates
  useDashboardRealtime();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', currentShop?.id],
    queryFn: async () => {
      if (!currentShop) return null;
      
      const [products, orders, newOrders, delivered, cancelled, todayOrders] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('active', true).eq('shop_id', currentShop.id),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('shop_id', currentShop.id),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'new').eq('shop_id', currentShop.id),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'delivered').eq('shop_id', currentShop.id),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'cancelled').eq('shop_id', currentShop.id),
        supabase.from('orders').select('id', { count: 'exact', head: true })
          .eq('shop_id', currentShop.id)
          .gte('created_at', new Date().toISOString().split('T')[0]),
      ]);

      // Get total revenue
      const { data: revenueData } = await supabase
        .from('orders')
        .select('total')
        .eq('shop_id', currentShop.id)
        .not('status', 'eq', 'cancelled');
      
      const totalRevenue = revenueData?.reduce((sum, order) => sum + (Number(order.total) || 0), 0) ?? 0;

      // Get last week's revenue for comparison
      const lastWeekStart = new Date();
      lastWeekStart.setDate(lastWeekStart.getDate() - 14);
      const thisWeekStart = new Date();
      thisWeekStart.setDate(thisWeekStart.getDate() - 7);

      const { data: lastWeekData } = await supabase
        .from('orders')
        .select('total')
        .eq('shop_id', currentShop.id)
        .gte('created_at', lastWeekStart.toISOString())
        .lt('created_at', thisWeekStart.toISOString())
        .not('status', 'eq', 'cancelled');

      const { data: thisWeekData } = await supabase
        .from('orders')
        .select('total')
        .eq('shop_id', currentShop.id)
        .gte('created_at', thisWeekStart.toISOString())
        .not('status', 'eq', 'cancelled');

      const lastWeekRevenue = lastWeekData?.reduce((sum, o) => sum + (Number(o.total) || 0), 0) ?? 0;
      const thisWeekRevenue = thisWeekData?.reduce((sum, o) => sum + (Number(o.total) || 0), 0) ?? 0;
      const revenueTrend = lastWeekRevenue > 0 
        ? Math.round(((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100) 
        : 0;

      return {
        products: products.count ?? 0,
        orders: orders.count ?? 0,
        newOrders: newOrders.count ?? 0,
        delivered: delivered.count ?? 0,
        cancelled: cancelled.count ?? 0,
        todayOrders: todayOrders.count ?? 0,
        totalRevenue,
        revenueTrend,
      };
    },
    enabled: !!currentShop,
  });

  const kpiCards = [
    {
      key: 'revenue',
      title: t('dashboard.totalRevenue'),
      value: `৳${(stats?.totalRevenue ?? 0).toLocaleString()}`,
      subtitle: stats?.revenueTrend !== 0 ? undefined : undefined,
      trend: stats?.revenueTrend ? { 
        value: Math.abs(stats.revenueTrend), 
        isPositive: stats.revenueTrend >= 0 
      } : undefined,
      icon: Wallet,
      gradient: 'from-blue-500 to-purple-600',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      key: 'orders',
      title: t('dashboard.totalOrders'),
      value: stats?.orders ?? 0,
      subtitle: `${t('dashboard.todayOrders')}: ${stats?.todayOrders ?? 0}`,
      icon: ShoppingCart,
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      key: 'newOrders',
      title: t('dashboard.newOrders'),
      value: stats?.newOrders ?? 0,
      subtitle: t('dashboard.pending'),
      icon: Package,
      gradient: 'from-orange-400 to-amber-500',
      iconBg: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      key: 'delivered',
      title: t('dashboard.delivered'),
      value: stats?.delivered ?? 0,
      subtitle: t('dashboard.thisWeek'),
      icon: CheckCircle2,
      gradient: 'from-green-500 to-emerald-600',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      key: 'cancelled',
      title: t('dashboard.cancelled'),
      value: stats?.cancelled ?? 0,
      icon: XCircle,
      gradient: 'from-red-400 to-rose-500',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    {
      key: 'products',
      title: t('dashboard.products'),
      value: stats?.products ?? 0,
      subtitle: t('common.active'),
      icon: Box,
      gradient: 'from-indigo-500 to-violet-600',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
  ];

  return (
    <AdminLayout>
      <ShopGuard>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
          </div>

          {/* KPI Cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {statsLoading
              ? Array.from({ length: 6 }).map((_, i) => <KpiCardSkeleton key={i} />)
              : kpiCards.map((card) => (
                  <KpiCard
                    key={card.key}
                    title={card.title}
                    value={card.value}
                    subtitle={card.subtitle}
                    icon={card.icon}
                    trend={card.trend}
                    gradient={card.gradient}
                    iconBg={card.iconBg}
                    iconColor={card.iconColor}
                  />
                ))}
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            <SalesChart />
            <BestSellingProducts />
          </div>

          {/* Orders Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            <RecentOrdersTable />
            <OrderStatusChart />
          </div>
        </div>
      </ShopGuard>
    </AdminLayout>
  );
}
