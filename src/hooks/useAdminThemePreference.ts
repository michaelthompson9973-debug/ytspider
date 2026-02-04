import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminTheme, themePresets } from '@/contexts/AdminThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Json } from '@/integrations/supabase/types';

const PREFERENCE_KEY = 'admin_theme';

const defaultTheme: AdminTheme = {
  preset: 'default',
  colors: themePresets.default,
  mode: 'light',
};

export function useAdminThemePreference() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: savedTheme, isLoading } = useQuery({
    queryKey: ['user-preference', PREFERENCE_KEY, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('value')
        .eq('user_id', user.id)
        .eq('key', PREFERENCE_KEY)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      
      // Parse and validate the theme data
      const value = data.value as Record<string, unknown>;
      if (value && typeof value === 'object' && 'preset' in value && 'colors' in value && 'mode' in value) {
        return value as unknown as AdminTheme;
      }
      return null;
    },
    enabled: !!user?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async (theme: AdminTheme) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Check if preference exists
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .eq('key', PREFERENCE_KEY)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('user_preferences')
          .update({ value: theme as unknown as Json })
          .eq('user_id', user.id)
          .eq('key', PREFERENCE_KEY);
        
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            key: PREFERENCE_KEY,
            value: theme as unknown as Json,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preference', PREFERENCE_KEY] });
    },
  });

  return {
    savedTheme: savedTheme ?? defaultTheme,
    isLoading,
    saveTheme: saveMutation.mutate,
    saveThemeAsync: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
}
