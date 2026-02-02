import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MessengerMessage } from '../types';
import { useToast } from '@/hooks/use-toast';

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['messenger-messages', conversationId],
    queryFn: async (): Promise<MessengerMessage[]> => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from('messenger_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      return (data || []).map(msg => ({
        ...msg,
        attachments: msg.attachments as unknown as MessengerMessage['attachments'],
      })) as MessengerMessage[];
    },
    enabled: !!conversationId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      conversationId,
      connectionId,
      recipientPsid,
      message,
    }: {
      conversationId: string;
      connectionId: string;
      recipientPsid: string;
      message: string;
    }) => {
      // Call edge function to send message via Facebook API
      const { data, error } = await supabase.functions.invoke('messenger-send', {
        body: {
          connectionId,
          recipientPsid,
          message,
          conversationId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messenger-messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['messenger-conversations'] });
    },
    onError: (error) => {
      toast({
        title: 'মেসেজ পাঠাতে ব্যর্থ',
        description: error instanceof Error ? error.message : 'অজানা সমস্যা হয়েছে',
        variant: 'destructive',
      });
    },
  });
}

export function useQuickReplies() {
  return useQuery({
    queryKey: ['quick-replies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quick_replies')
        .select('*')
        .order('use_count', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useIncrementQuickReplyUsage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quickReplyId: string) => {
      const { data: current } = await supabase
        .from('quick_replies')
        .select('use_count')
        .eq('id', quickReplyId)
        .single();

      const { error } = await supabase
        .from('quick_replies')
        .update({ use_count: (current?.use_count || 0) + 1 })
        .eq('id', quickReplyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-replies'] });
    },
  });
}
