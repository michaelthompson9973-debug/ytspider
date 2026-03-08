import { useQuery } from '@tanstack/react-query';
import { useShop } from '@/contexts/ShopContext';
import { supabase } from '@/integrations/supabase/client';

export type QuotaResource = 'products' | 'landing_pages' | 'team_members' | 'orders';

export interface ResourceQuota {
  current: number;
  limit: number;
  percentage: number;
  isNearLimit: boolean;
  isAtLimit: boolean;
  canCreate: boolean;
}

export interface ShopQuotaStatus {
  plan: string;
  resources: Record<QuotaResource, ResourceQuota>;
  isLoading: boolean;
  hasAnyLimitReached: boolean;
  hasAnyNearLimit: boolean;
}

function buildResourceQuota(current: number, limit: number): ResourceQuota {
  const isUnlimited = limit >= 999999;
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);
  return {
    current,
    limit: isUnlimited ? Infinity : limit,
    percentage,
    isNearLimit: !isUnlimited && percentage >= 80,
    isAtLimit: !isUnlimited && current >= limit,
    canCreate: isUnlimited || current < limit,
  };
}

const EMPTY_RESOURCE: ResourceQuota = {
  current: 0, limit: Infinity, percentage: 0,
  isNearLimit: false, isAtLimit: false, canCreate: true,
};

/**
 * Unified quota hook — fetches dynamic limits from pricing_plans via RPC.
 * Replaces the old hardcoded PLAN_LIMITS approach.
 */
export function useQuotaStatus(): ShopQuotaStatus {
  const { currentShop } = useShop();

  const { data, isLoading } = useQuery({
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
  const resources: Record<QuotaResource, ResourceQuota> = {
    products: r ? buildResourceQuota(r.products.current, r.products.limit) : EMPTY_RESOURCE,
    landing_pages: r ? buildResourceQuota(r.landing_pages.current, r.landing_pages.limit) : EMPTY_RESOURCE,
    team_members: r ? buildResourceQuota(r.team_members.current, r.team_members.limit) : EMPTY_RESOURCE,
    orders: r ? buildResourceQuota(r.orders.current, r.orders.limit) : EMPTY_RESOURCE,
  };

  return {
    plan: data?.plan || currentShop?.plan || 'free',
    resources,
    isLoading,
    hasAnyLimitReached: Object.values(resources).some((q) => q.isAtLimit),
    hasAnyNearLimit: Object.values(resources).some((q) => q.isNearLimit),
  };
}

/** Convenience hook for a single resource */
export function useQuotaCheck(resource: QuotaResource) {
  const status = useQuotaStatus();
  return {
    ...status.resources[resource],
    plan: status.plan,
    isLoading: status.isLoading,
  };
}
