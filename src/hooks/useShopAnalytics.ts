import { useQuery } from '@tanstack/react-query';
import { useShop } from '@/contexts/ShopContext';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';

export interface AnalyticsKPI {
  totalVisitors: number;
  totalOrders: number;
  conversionRate: number;
  totalRevenue: number;
  visitorsChange: number;
  ordersChange: number;
  conversionChange: number;
  revenueChange: number;
}

export interface ChartDataPoint {
  date: string;
  visitors: number;
  orders: number;
  revenue: number;
}

export interface TopPage {
  path: string;
  views: number;
  orders: number;
  conversion: string;
}

export interface TopProduct {
  name: string;
  sold: number;
  revenue: number;
}

interface UseShopAnalyticsReturn {
  kpis: AnalyticsKPI;
  chartData: ChartDataPoint[];
  topPages: TopPage[];
  topProducts: TopProduct[];
  isLoading: boolean;
  error: Error | null;
}

export function useShopAnalytics(dateRange: '7d' | '30d' | 'custom' = '7d'): UseShopAnalyticsReturn {
  const { currentShop } = useShop();
  
  const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 7;
  const startDate = startOfDay(subDays(new Date(), days));
  const endDate = endOfDay(new Date());
  const previousStartDate = startOfDay(subDays(startDate, days));

  // Fetch orders for KPIs and chart data
  const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ['shop-analytics-orders', currentShop?.id, dateRange],
    queryFn: async () => {
      if (!currentShop?.id) return null;

      // Current period orders
      const { data: currentOrders, error: currentError } = await supabase
        .from('orders')
        .select('id, total, created_at, landing_page_id, status')
        .eq('shop_id', currentShop.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (currentError) throw currentError;

      // Previous period orders for comparison
      const { data: previousOrders, error: previousError } = await supabase
        .from('orders')
        .select('id, total, created_at')
        .eq('shop_id', currentShop.id)
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      if (previousError) throw previousError;

      return { currentOrders, previousOrders };
    },
    enabled: !!currentShop?.id,
  });

  // Fetch landing pages for top pages
  const { data: landingPagesData, isLoading: pagesLoading } = useQuery({
    queryKey: ['shop-analytics-pages', currentShop?.id],
    queryFn: async () => {
      if (!currentShop?.id) return [];

      const { data, error } = await supabase
        .from('landing_pages')
        .select('id, slug')
        .eq('shop_id', currentShop.id)
        .eq('published', true);

      if (error) throw error;
      return data;
    },
    enabled: !!currentShop?.id,
  });

  // Fetch top products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['shop-analytics-products', currentShop?.id, dateRange],
    queryFn: async () => {
      if (!currentShop?.id) return [];

      // Get order items with product info
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          quantity,
          subtotal,
          product_name,
          orders!inner(shop_id, created_at)
        `)
        .eq('orders.shop_id', currentShop.id)
        .gte('orders.created_at', startDate.toISOString())
        .lte('orders.created_at', endDate.toISOString());

      if (error) throw error;
      
      // Aggregate by product name
      const productMap = new Map<string, { sold: number; revenue: number }>();
      data?.forEach((item) => {
        const existing = productMap.get(item.product_name) || { sold: 0, revenue: 0 };
        productMap.set(item.product_name, {
          sold: existing.sold + item.quantity,
          revenue: existing.revenue + (item.subtotal || 0),
        });
      });

      return Array.from(productMap.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5);
    },
    enabled: !!currentShop?.id,
  });

  // Calculate KPIs
  const currentOrders = ordersData?.currentOrders || [];
  const previousOrders = ordersData?.previousOrders || [];

  const currentRevenue = currentOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const previousRevenue = previousOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  
  const currentOrderCount = currentOrders.length;
  const previousOrderCount = previousOrders.length;

  // Visitor count is mocked for now (would need analytics table)
  const currentVisitors = currentOrderCount * 25; // Rough estimate
  const previousVisitors = previousOrderCount * 25;

  const kpis: AnalyticsKPI = {
    totalVisitors: currentVisitors,
    totalOrders: currentOrderCount,
    conversionRate: currentVisitors > 0 ? (currentOrderCount / currentVisitors) * 100 : 0,
    totalRevenue: currentRevenue,
    visitorsChange: previousVisitors > 0 
      ? ((currentVisitors - previousVisitors) / previousVisitors) * 100 
      : 0,
    ordersChange: previousOrderCount > 0 
      ? ((currentOrderCount - previousOrderCount) / previousOrderCount) * 100 
      : 0,
    conversionChange: 0, // Would need historical conversion data
    revenueChange: previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0,
  };

  // Generate chart data by day
  const chartData: ChartDataPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dateStr = format(date, 'MMM d');
    const dayOrders = currentOrders.filter((o) => {
      const orderDate = new Date(o.created_at);
      return format(orderDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });

    chartData.push({
      date: dateStr,
      visitors: dayOrders.length * 25, // Estimate
      orders: dayOrders.length,
      revenue: dayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
    });
  }

  // Calculate top pages
  const topPages: TopPage[] = (landingPagesData || []).map((page) => {
    const pageOrders = currentOrders.filter((o) => o.landing_page_id === page.id);
    const views = pageOrders.length * 30; // Estimate views
    const conversion = views > 0 ? ((pageOrders.length / views) * 100).toFixed(1) : '0.0';
    return {
      path: `/p/${page.slug}`,
      views,
      orders: pageOrders.length,
      conversion: `${conversion}%`,
    };
  }).sort((a, b) => b.views - a.views).slice(0, 4);

  return {
    kpis,
    chartData,
    topPages,
    topProducts: productsData || [],
    isLoading: ordersLoading || pagesLoading || productsLoading,
    error: ordersError as Error | null,
  };
}
