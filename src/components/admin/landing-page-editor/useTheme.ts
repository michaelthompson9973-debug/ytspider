import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ThemeConfig, LandingPageTheme, defaultThemeConfig } from './types';
import { migrateThemeConfig } from './themeUtils';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

export function useTheme(landingPageId: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: theme, isLoading } = useQuery({
    queryKey: ['landing-page-theme', landingPageId],
    queryFn: async () => {
      if (!landingPageId) return null;
      const { data, error } = await supabase
        .from('landing_page_theme')
        .select('*')
        .eq('landing_page_id', landingPageId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      
      // Migrate old config format to new format
      const rawConfig = data.config as Record<string, unknown>;
      const migratedConfig = migrateThemeConfig(rawConfig as Partial<ThemeConfig>);
      
      return {
        ...data,
        config: migratedConfig,
      } as LandingPageTheme;
    },
    enabled: !!landingPageId,
  });

  const themeConfig = theme?.config ?? defaultThemeConfig;

  const saveThemeMutation = useMutation({
    mutationFn: async (config: ThemeConfig) => {
      if (!landingPageId) throw new Error('No landing page selected');
      
      const { data: existing } = await supabase
        .from('landing_page_theme')
        .select('id')
        .eq('landing_page_id', landingPageId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('landing_page_theme')
          .update({ config: config as unknown as Json })
          .eq('landing_page_id', landingPageId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('landing_page_theme')
          .insert({
            landing_page_id: landingPageId,
            config: config as unknown as Json,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-page-theme', landingPageId] });
      toast({ title: 'Theme saved' });
    },
    onError: (error) => {
      toast({ title: 'Error saving theme', description: error.message, variant: 'destructive' });
    },
  });

  return {
    theme,
    themeConfig,
    isLoading,
    saveTheme: saveThemeMutation.mutate,
    isSaving: saveThemeMutation.isPending,
  };
}
