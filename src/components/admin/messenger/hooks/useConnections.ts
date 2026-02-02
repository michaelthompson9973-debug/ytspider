import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MessengerConnection } from '../types';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';

export function useConnections() {
  return useQuery({
    queryKey: ['messenger-connections'],
    queryFn: async (): Promise<MessengerConnection[]> => {
      const { data, error } = await supabase
        .from('messenger_connections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MessengerConnection[];
    },
  });
}

export function useConnection(connectionId: string | null) {
  return useQuery({
    queryKey: ['messenger-connection', connectionId],
    queryFn: async (): Promise<MessengerConnection | null> => {
      if (!connectionId) return null;

      const { data, error } = await supabase
        .from('messenger_connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (error) throw error;
      return data as MessengerConnection;
    },
    enabled: !!connectionId,
  });
}

export function useToggleConnectionStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ connectionId, isActive }: { connectionId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('messenger_connections')
        .update({ is_active: isActive })
        .eq('id', connectionId);

      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['messenger-connections'] });
      toast({
        title: isActive ? 'পেজ সক্রিয় করা হয়েছে' : 'পেজ নিষ্ক্রিয় করা হয়েছে',
      });
    },
  });
}

export function useDeleteConnection() {
  const queryClient = useQueryClient();
  const { toast: toastHook } = useToast();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from('messenger_connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messenger-connections'] });
      toastHook({
        title: 'পেজ সংযোগ মুছে ফেলা হয়েছে',
      });
    },
    onError: (error) => {
      toastHook({
        title: 'ব্যর্থ',
        description: error instanceof Error ? error.message : 'অজানা সমস্যা',
        variant: 'destructive',
      });
    },
  });
}

export function useCreateConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      page_name: string;
      page_id: string;
      page_access_token: string;
    }) => {
      // Generate random webhook verify token
      const webhook_verify_token = crypto.randomUUID();

      const { error } = await supabase
        .from('messenger_connections')
        .insert({
          ...data,
          webhook_verify_token,
          is_active: true,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messenger-connections'] });
    },
    onError: (error) => {
      console.error('Error creating connection:', error);
      toast.error('পেজ যোগ করতে সমস্যা হয়েছে');
    },
  });
}
