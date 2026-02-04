import { useQuery } from '@tanstack/react-query';
import { useShop } from '@/contexts/ShopContext';
import { supabase } from '@/integrations/supabase/client';
import { getPlanLimits, isAtLimit, isNearLimit, getUsagePercentage, type PlanType } from '@/lib/planLimits';

export interface UsageData {
  orders: number;
  teamMembers: number;
  landingPages: number;
  products: number;
  shops: number;
}

export function useBillingUsage() {
  const { currentShop, availableShops } = useShop();

  const { data: usage, isLoading, error } = useQuery({
    queryKey: ['billing-usage', currentShop?.id],
    queryFn: async (): Promise<UsageData> => {
      if (!currentShop?.id) {
        return { orders: 0, teamMembers: 0, landingPages: 0, products: 0, shops: 0 };
      }

      // Get start of current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Parallel queries for efficiency
      const [ordersResult, teamResult, pagesResult, productsResult] = await Promise.all([
        // Orders this month
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('shop_id', currentShop.id)
          .gte('created_at', startOfMonth.toISOString()),
        
        // Team members
        supabase
          .from('shop_members')
          .select('id', { count: 'exact', head: true })
          .eq('shop_id', currentShop.id),
        
        // Landing pages
        supabase
          .from('landing_pages')
          .select('id', { count: 'exact', head: true })
          .eq('shop_id', currentShop.id),
        
        // Products
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('shop_id', currentShop.id),
      ]);

      return {
        orders: ordersResult.count || 0,
        teamMembers: teamResult.count || 0,
        landingPages: pagesResult.count || 0,
        products: productsResult.count || 0,
        shops: availableShops?.length || 1,
      };
    },
    enabled: !!currentShop?.id,
    staleTime: 30000, // 30 seconds
  });

  const plan = (currentShop?.plan as PlanType) || 'free';
  const limits = getPlanLimits(plan);

  const usageStats = {
    orders: {
      current: usage?.orders || 0,
      limit: limits.ordersPerMonth,
      percentage: getUsagePercentage(usage?.orders || 0, limits.ordersPerMonth),
      isAtLimit: isAtLimit(usage?.orders || 0, limits.ordersPerMonth),
      isNearLimit: isNearLimit(usage?.orders || 0, limits.ordersPerMonth),
    },
    teamMembers: {
      current: usage?.teamMembers || 0,
      limit: limits.teamMembers,
      percentage: getUsagePercentage(usage?.teamMembers || 0, limits.teamMembers),
      isAtLimit: isAtLimit(usage?.teamMembers || 0, limits.teamMembers),
      isNearLimit: isNearLimit(usage?.teamMembers || 0, limits.teamMembers),
    },
    landingPages: {
      current: usage?.landingPages || 0,
      limit: limits.landingPages,
      percentage: getUsagePercentage(usage?.landingPages || 0, limits.landingPages),
      isAtLimit: isAtLimit(usage?.landingPages || 0, limits.landingPages),
      isNearLimit: isNearLimit(usage?.landingPages || 0, limits.landingPages),
    },
    products: {
      current: usage?.products || 0,
      limit: limits.products,
      percentage: getUsagePercentage(usage?.products || 0, limits.products),
      isAtLimit: isAtLimit(usage?.products || 0, limits.products),
      isNearLimit: isNearLimit(usage?.products || 0, limits.products),
    },
    shops: {
      current: usage?.shops || 1,
      limit: limits.shops,
      percentage: getUsagePercentage(usage?.shops || 1, limits.shops),
      isAtLimit: isAtLimit(usage?.shops || 1, limits.shops),
      isNearLimit: isNearLimit(usage?.shops || 1, limits.shops),
    },
  };

  const hasAnyLimitReached = Object.values(usageStats).some(stat => stat.isAtLimit);
  const hasAnyNearLimit = Object.values(usageStats).some(stat => stat.isNearLimit);

  return {
    usage,
    usageStats,
    limits,
    plan,
    isLoading,
    error,
    hasAnyLimitReached,
    hasAnyNearLimit,
  };
}
