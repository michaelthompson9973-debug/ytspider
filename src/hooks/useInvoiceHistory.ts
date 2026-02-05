import { useQuery } from '@tanstack/react-query';
import { useShop } from '@/contexts/ShopContext';
import { supabase } from '@/integrations/supabase/client';

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  invoiceId: string;
  planName?: string;
  currency: string;
}

export function useInvoiceHistory(limit?: number) {
  const { currentShop } = useShop();

  const { data: invoices, isLoading, error } = useQuery({
    queryKey: ['shop-invoices', currentShop?.id, limit],
    queryFn: async () => {
      if (!currentShop?.id) return [];

      // Fetch purchases (transactions) for this shop
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select(`
          id,
          amount,
          currency,
          payment_status,
          created_at,
          plan_snapshot
        `)
        .eq('shop_id', currentShop.id)
        .order('created_at', { ascending: false })
        .limit(limit || 100);

      if (purchasesError) throw purchasesError;

      // Map to invoice format
      return (purchases || []).map((purchase, index) => {
        const date = new Date(purchase.created_at);
        const invoiceId = `INV-${date.getFullYear()}-${String(index + 1).padStart(3, '0')}`;
        
        let status: 'paid' | 'pending' | 'failed' = 'pending';
        if (purchase.payment_status === 'completed' || purchase.payment_status === 'paid') status = 'paid';
        else if (purchase.payment_status === 'failed') status = 'failed';

        const planSnapshot = purchase.plan_snapshot as { name?: string } | null;

        return {
          id: purchase.id,
          date: purchase.created_at,
          amount: purchase.amount || 0,
          status,
          invoiceId,
          planName: planSnapshot?.name || 'Unknown Plan',
          currency: purchase.currency || 'BDT',
        } as Invoice;
      });
    },
    enabled: !!currentShop?.id,
  });

  // Get subscription info for next billing date
  const { data: subscription } = useQuery({
    queryKey: ['shop-subscription', currentShop?.id],
    queryFn: async () => {
      if (!currentShop?.id) return null;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, pricing_plans(*)')
        .eq('shop_id', currentShop.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!currentShop?.id,
  });

  return {
    invoices: invoices || [],
    subscription,
    nextBillingDate: subscription?.expires_at 
      ? new Date(subscription.expires_at) 
      : null,
    isLoading,
    error,
  };
}
