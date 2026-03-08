import { useQuery } from '@tanstack/react-query';
import { useShop } from '@/contexts/ShopContext';
import { supabase } from '@/integrations/supabase/client';

export interface UsageData {
  orders: number;
  teamMembers: number;
  landingPages: number;
  products: number;
  shops: number;
}

/**
 * useBillingUsage — Now backed by the get_shop_quota_status RPC
 * for dynamic limits from pricing_plans table.
 */
export function useBillingUsage() {
  const { currentShop, availableShops } = useShop();

  const { data, isLoading, error } = useQuery({
    queryKey: ['shop-quota-status', currentShop?.id],
    queryFn: async () => {
      if (!currentShop?.id) return null;
      const { data, error } = await supabase.rpc('get_shop_quota_status', {
        _shop_id: currentShop.id,
      });
      if (error) throw error;
      return data as {
        plan: string;
        resources: Record<string, { current: number; limit: number }>;
      };
    },
    enabled: !!currentShop?.id,
    staleTime: 30_000,
  });

  const r = data?.resources;
  const plan = data?.plan || currentShop?.plan || 'free';

  const usage: UsageData = {
    orders: r?.orders?.current ?? 0,
    teamMembers: r?.team_members?.current ?? 0,
    landingPages: r?.landing_pages?.current ?? 0,
    products: r?.products?.current ?? 0,
    shops: availableShops?.length || 1,
  };

  function stat(current: number, limit: number) {
    const isUnlimited = limit >= 999999 || limit === Infinity;
    const effectiveLimit = isUnlimited ? Infinity : limit;
    const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);
    return {
      current,
      limit: effectiveLimit,
      percentage,
      isAtLimit: !isUnlimited && current >= limit,
      isNearLimit: !isUnlimited && percentage >= 80,
    };
  }

  const usageStats = {
    orders: stat(usage.orders, r?.orders?.limit ?? 100),
    teamMembers: stat(usage.teamMembers, r?.team_members?.limit ?? 2),
    landingPages: stat(usage.landingPages, r?.landing_pages?.limit ?? 10),
    products: stat(usage.products, r?.products?.limit ?? 50),
    shops: stat(usage.shops, Infinity),
  };

  const limits = {
    ordersPerMonth: r?.orders?.limit ?? 100,
    teamMembers: r?.team_members?.limit ?? 2,
    landingPages: r?.landing_pages?.limit ?? 10,
    products: r?.products?.limit ?? 50,
    shops: Infinity,
  };

  return {
    usage,
    usageStats,
    limits,
    plan,
    isLoading,
    error,
    hasAnyLimitReached: Object.values(usageStats).some((s) => s.isAtLimit),
    hasAnyNearLimit: Object.values(usageStats).some((s) => s.isNearLimit),
  };
}
