import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckoutSettings, defaultCheckoutSettings, DeliveryMode } from './types';

export function useCheckoutSettings(landingPageId: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['checkout-settings', landingPageId],
    queryFn: async () => {
      if (!landingPageId) return null;
      const { data, error } = await supabase
        .from('landing_page_checkout_settings')
        .select('*')
        .eq('landing_page_id', landingPageId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        delivery_mode: data.delivery_mode as DeliveryMode,
        delivery_amount: Number(data.delivery_amount),
        free_over_amount: data.free_over_amount ? Number(data.free_over_amount) : null,
      } as CheckoutSettings;
    },
    enabled: !!landingPageId,
  });

  const checkoutSettings: Omit<CheckoutSettings, 'id' | 'landing_page_id' | 'created_at' | 'updated_at'> = settings 
    ? {
        currency: settings.currency,
        delivery_mode: settings.delivery_mode,
        delivery_amount: settings.delivery_amount,
        free_over_amount: settings.free_over_amount,
      }
    : defaultCheckoutSettings;

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: Omit<CheckoutSettings, 'id' | 'landing_page_id' | 'created_at' | 'updated_at'>) => {
      if (!landingPageId) throw new Error('No landing page selected');

      const { data: existing } = await supabase
        .from('landing_page_checkout_settings')
        .select('id')
        .eq('landing_page_id', landingPageId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('landing_page_checkout_settings')
          .update({
            currency: newSettings.currency,
            delivery_mode: newSettings.delivery_mode,
            delivery_amount: newSettings.delivery_amount,
            free_over_amount: newSettings.free_over_amount,
          })
          .eq('landing_page_id', landingPageId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('landing_page_checkout_settings')
          .insert({
            landing_page_id: landingPageId,
            currency: newSettings.currency,
            delivery_mode: newSettings.delivery_mode,
            delivery_amount: newSettings.delivery_amount,
            free_over_amount: newSettings.free_over_amount,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkout-settings', landingPageId] });
      toast({ title: 'Checkout settings saved' });
    },
    onError: (error) => {
      toast({ title: 'Error saving settings', description: error.message, variant: 'destructive' });
    },
  });

  return {
    settings,
    checkoutSettings,
    isLoading,
    saveSettings: saveSettingsMutation.mutate,
    isSaving: saveSettingsMutation.isPending,
  };
}
