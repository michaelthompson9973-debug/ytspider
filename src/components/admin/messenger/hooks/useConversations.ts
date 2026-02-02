import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MessengerConversation, ConversationFilter } from '../types';

export function useConversations(connectionId: string | null, filter: ConversationFilter = 'all') {
  return useQuery({
    queryKey: ['messenger-conversations', connectionId, filter],
    queryFn: async (): Promise<MessengerConversation[]> => {
      if (!connectionId) return [];

      let query = supabase
        .from('messenger_conversations')
        .select(`
          *,
          connection:messenger_connections(*),
          tags:conversation_tags(*),
          ad_source:ad_sources(*)
        `)
        .eq('connection_id', connectionId)
        .order('last_message_at', { ascending: false });

      // Apply filters
      if (filter === 'unread') {
        query = query.gt('unread_count', 0);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Additional filtering based on tags/sources
      let filtered = data || [];
      
      if (filter === 'from_ads') {
        filtered = filtered.filter(c => c.ad_source !== null);
      } else if (filter === 'vip') {
        filtered = filtered.filter(c => 
          c.tags?.some((t: { tag: string }) => t.tag === 'VIP')
        );
      } else if (filter === 'hot_lead') {
        filtered = filtered.filter(c => 
          c.tags?.some((t: { tag: string }) => t.tag === 'Hot Lead')
        );
      } else if (filter === 'complaint') {
        filtered = filtered.filter(c => 
          c.tags?.some((t: { tag: string }) => t.tag === 'Complaint')
        );
      }

      return filtered as MessengerConversation[];
    },
    enabled: !!connectionId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useConversation(conversationId: string | null) {
  return useQuery({
    queryKey: ['messenger-conversation', conversationId],
    queryFn: async (): Promise<MessengerConversation | null> => {
      if (!conversationId) return null;

      const { data, error } = await supabase
        .from('messenger_conversations')
        .select(`
          *,
          connection:messenger_connections(*),
          tags:conversation_tags(*),
          ad_source:ad_sources(*)
        `)
        .eq('id', conversationId)
        .single();

      if (error) throw error;
      return data as MessengerConversation;
    },
    enabled: !!conversationId,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from('messenger_conversations')
        .update({ unread_count: 0 })
        .eq('id', conversationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messenger-conversations'] });
    },
  });
}

export function useAddConversationTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, tag }: { conversationId: string; tag: string }) => {
      const { error } = await supabase
        .from('conversation_tags')
        .upsert({ conversation_id: conversationId, tag }, { onConflict: 'conversation_id,tag' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messenger-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messenger-conversation'] });
    },
  });
}

export function useRemoveConversationTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, tag }: { conversationId: string; tag: string }) => {
      const { error } = await supabase
        .from('conversation_tags')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('tag', tag);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messenger-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messenger-conversation'] });
    },
  });
}
