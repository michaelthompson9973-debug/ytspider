/**
 * useShopStatus — Checks current shop's subscription status
 * 
 * Returns whether the shop is active, in grace period, or suspended.
 * Used by ShopProtectedRoute to enforce dashboard locks.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useShop } from '@/contexts/ShopContext';

export type ShopStatusType = 'active' | 'grace_period' | 'suspended' | 'cancelled';

interface ShopStatusResult {
  status: ShopStatusType;
  gracePeriodEndsAt: string | null;
  isActive: boolean;
  isSuspended: boolean;
  isGracePeriod: boolean;
  isLoading: boolean;
}

export function useShopStatus(): ShopStatusResult {
  const { currentShop } = useShop();

  const { data, isLoading } = useQuery({
    queryKey: ['shop-status', currentShop?.id],
    queryFn: async () => {
      if (!currentShop?.id) return null;

      const { data, error } = await supabase
        .from('shops')
        .select('status, grace_period_ends_at')
        .eq('id', currentShop.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!currentShop?.id,
    staleTime: 30000,
  });

  const status = (data?.status as ShopStatusType) ?? 'active';

  return {
    status,
    gracePeriodEndsAt: data?.grace_period_ends_at ?? null,
    isActive: status === 'active',
    isSuspended: status === 'suspended' || status === 'cancelled',
    isGracePeriod: status === 'grace_period',
    isLoading,
  };
}
