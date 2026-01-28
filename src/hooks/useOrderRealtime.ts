import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UseOrderRealtimeOptions {
  enabled?: boolean;
}

export function useOrderRealtime({ enabled = true }: UseOrderRealtimeOptions = {}) {
  const queryClient = useQueryClient();

  const invalidateOrders = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['order-counts'] });
  }, [queryClient]);

  const invalidateCourierHistory = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['courier-history'] });
  }, [queryClient]);

  useEffect(() => {
    if (!enabled) return;

    // Subscribe to orders changes
    const ordersChannel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          invalidateOrders();
        }
      )
      .subscribe();

    // Subscribe to customer_courier_history changes
    const courierChannel = supabase
      .channel('courier-history-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_courier_history',
        },
        () => {
          invalidateCourierHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(courierChannel);
    };
  }, [enabled, invalidateOrders, invalidateCourierHistory]);

  return {
    invalidateOrders,
    invalidateCourierHistory,
  };
}
