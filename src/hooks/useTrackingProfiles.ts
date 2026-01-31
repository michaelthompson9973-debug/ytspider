import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TrackingProfile {
  id: string;
  name: string;
  description: string | null;
  facebook_pixel_id: string | null;
  facebook_access_token: string | null;
  facebook_test_event_code: string | null;
  tiktok_pixel_id: string | null;
  tiktok_access_token: string | null;
  tiktok_test_event_code: string | null;
  google_gtm_id: string | null;
  google_ga4_id: string | null;
  google_ga4_secret: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrackingProfileFormData {
  name: string;
  description?: string;
  facebook_pixel_id?: string;
  facebook_access_token?: string;
  facebook_test_event_code?: string;
  tiktok_pixel_id?: string;
  tiktok_access_token?: string;
  tiktok_test_event_code?: string;
  google_gtm_id?: string;
  google_ga4_id?: string;
  google_ga4_secret?: string;
  is_active?: boolean;
}

export function useTrackingProfiles() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: profiles, isLoading, error } = useQuery({
    queryKey: ['tracking-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracking_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as TrackingProfile[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: TrackingProfileFormData) => {
      const { data, error } = await supabase
        .from('tracking_profiles')
        .insert({
          name: formData.name,
          description: formData.description || null,
          facebook_pixel_id: formData.facebook_pixel_id || null,
          facebook_access_token: formData.facebook_access_token || null,
          facebook_test_event_code: formData.facebook_test_event_code || null,
          tiktok_pixel_id: formData.tiktok_pixel_id || null,
          tiktok_access_token: formData.tiktok_access_token || null,
          tiktok_test_event_code: formData.tiktok_test_event_code || null,
          google_gtm_id: formData.google_gtm_id || null,
          google_ga4_id: formData.google_ga4_id || null,
          google_ga4_secret: formData.google_ga4_secret || null,
          is_active: formData.is_active ?? true,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-profiles'] });
      toast({ title: 'Profile created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: TrackingProfileFormData }) => {
      const { data, error } = await supabase
        .from('tracking_profiles')
        .update({
          name: formData.name,
          description: formData.description || null,
          facebook_pixel_id: formData.facebook_pixel_id || null,
          facebook_access_token: formData.facebook_access_token || null,
          facebook_test_event_code: formData.facebook_test_event_code || null,
          tiktok_pixel_id: formData.tiktok_pixel_id || null,
          tiktok_access_token: formData.tiktok_access_token || null,
          tiktok_test_event_code: formData.tiktok_test_event_code || null,
          google_gtm_id: formData.google_gtm_id || null,
          google_ga4_id: formData.google_ga4_id || null,
          google_ga4_secret: formData.google_ga4_secret || null,
          is_active: formData.is_active ?? true,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-profiles'] });
      toast({ title: 'Profile updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tracking_profiles')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-profiles'] });
      toast({ title: 'Profile deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    profiles,
    isLoading,
    error,
    createProfile: createMutation.mutateAsync,
    updateProfile: updateMutation.mutateAsync,
    deleteProfile: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useTrackingProfilesSelect() {
  const { data: profiles, isLoading } = useQuery({
    queryKey: ['tracking-profiles-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracking_profiles')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  return { profiles, isLoading };
}
