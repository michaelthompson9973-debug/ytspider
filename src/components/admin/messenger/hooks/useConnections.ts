import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MessengerConnection } from '../types';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

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
      toast({
        title: 'পেজ সংযোগ মুছে ফেলা হয়েছে',
      });
    },
    onError: (error) => {
      toast({
        title: 'ব্যর্থ',
        description: error instanceof Error ? error.message : 'অজানা সমস্যা',
        variant: 'destructive',
      });
    },
  });
}
