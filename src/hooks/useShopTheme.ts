import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useShop } from '@/contexts/ShopContext';

export interface ShopThemeData {
  id?: string;
  shop_id: string;
  preset: string;
  colors: Record<string, string>;
  mode: 'light' | 'dark' | 'system';
}

const defaultTheme: Omit<ShopThemeData, 'shop_id'> = {
  preset: 'default',
  colors: {},
  mode: 'light',
};

export function useShopTheme() {
  const { currentShop } = useShop();
  const queryClient = useQueryClient();

  // Fetch shop theme
  const { data: theme, isLoading, error } = useQuery({
    queryKey: ['shop-theme', currentShop?.id],
    queryFn: async () => {
      if (!currentShop) return null;

      const { data, error } = await supabase
        .from('shop_theme')
        .select('*')
        .eq('shop_id', currentShop.id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        return {
          ...defaultTheme,
          shop_id: currentShop.id,
        } as ShopThemeData;
      }

      return {
        id: data.id,
        shop_id: data.shop_id,
        preset: data.preset,
        colors: (data.colors || {}) as Record<string, string>,
        mode: data.mode as 'light' | 'dark' | 'system',
      } as ShopThemeData;
    },
    enabled: !!currentShop,
  });

  // Save shop theme
  const saveMutation = useMutation({
    mutationFn: async (themeData: Omit<ShopThemeData, 'id'>) => {
      if (!currentShop) throw new Error('No shop selected');

      // Check if theme exists
      const { data: existing } = await supabase
        .from('shop_theme')
        .select('id')
        .eq('shop_id', currentShop.id)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('shop_theme')
          .update({
            preset: themeData.preset,
            colors: themeData.colors,
            mode: themeData.mode,
            updated_at: new Date().toISOString(),
          })
          .eq('shop_id', currentShop.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('shop_theme')
          .insert({
            shop_id: currentShop.id,
            preset: themeData.preset,
            colors: themeData.colors,
            mode: themeData.mode,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-theme', currentShop?.id] });
    },
  });

  return {
    theme: theme || (currentShop ? { ...defaultTheme, shop_id: currentShop.id } : null),
    isLoading,
    error,
    saveTheme: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
}
