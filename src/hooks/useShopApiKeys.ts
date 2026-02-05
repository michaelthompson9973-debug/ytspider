import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useShop } from '@/contexts/ShopContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ApiKey {
  id: string;
  key_name: string;
  key_value: string;
  provider: string;
  status: string;
  created_at: string;
  last_used_at: string | null;
  usage_count: number;
}

export function useShopApiKeys() {
  const { currentShop } = useShop();
  const queryClient = useQueryClient();

  const { data: apiKeys, isLoading, error } = useQuery({
    queryKey: ['shop-api-keys', currentShop?.id],
    queryFn: async () => {
      if (!currentShop?.id) return [];

      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('shop_id', currentShop.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ApiKey[];
    },
    enabled: !!currentShop?.id,
  });

  const createKeyMutation = useMutation({
    mutationFn: async ({ name, provider = 'custom' }: { name: string; provider?: string }) => {
      if (!currentShop?.id) throw new Error('No shop selected');

      // Generate a random API key
      const keyValue = `yt_${provider === 'custom' ? 'live' : provider}_${crypto.randomUUID().replace(/-/g, '')}`;

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          shop_id: currentShop.id,
          key_name: name,
          key_value: keyValue,
          provider,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shop-api-keys', currentShop?.id] });
      toast.success(`API key "${data.key_name}" তৈরি হয়েছে`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const revokeKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase
        .from('api_keys')
        .update({ status: 'revoked' })
        .eq('id', keyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-api-keys', currentShop?.id] });
      toast.success('API key revoked');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-api-keys', currentShop?.id] });
      toast.success('API key deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    apiKeys: apiKeys || [],
    isLoading,
    error,
    createKey: createKeyMutation.mutate,
    revokeKey: revokeKeyMutation.mutate,
    deleteKey: deleteKeyMutation.mutate,
    isCreating: createKeyMutation.isPending,
  };
}
