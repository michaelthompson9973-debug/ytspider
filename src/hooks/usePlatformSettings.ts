/**
 * usePlatformSettings — Fetches global platform configuration
 * 
 * Used by ShopLayout and public pages to check:
 * - Maintenance mode
 * - Global announcements
 * - Default theme overrides
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PlatformSettings {
  id: string;
  maintenance_mode: boolean;
  maintenance_message: string | null;
  global_announcement: string | null;
  announcement_type: 'info' | 'warning' | 'critical';
  announcement_active: boolean;
  default_theme: Record<string, unknown>;
  config: Record<string, unknown>;
}

export function usePlatformSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return data as unknown as PlatformSettings;
    },
    staleTime: 60000, // Cache for 1 minute
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<Omit<PlatformSettings, 'id'>>) => {
      if (!settings?.id) {
        // Insert first row
        const { error } = await supabase
          .from('platform_settings')
          .insert(updates as Record<string, unknown>);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('platform_settings')
          .update(updates as Record<string, unknown>)
          .eq('id', settings.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      toast({ title: 'Platform settings updated' });
    },
    onError: (error) => {
      toast({ title: 'Error updating settings', description: error.message, variant: 'destructive' });
    },
  });

  return {
    settings,
    isLoading,
    isMaintenanceMode: settings?.maintenance_mode ?? false,
    announcement: settings?.announcement_active ? settings.global_announcement : null,
    announcementType: settings?.announcement_type ?? 'info',
    updateSettings: updateSettingsMutation.mutate,
    isSaving: updateSettingsMutation.isPending,
  };
}
