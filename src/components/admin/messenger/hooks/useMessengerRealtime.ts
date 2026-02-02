import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useMessengerRealtime(connectionId: string | null, conversationId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!connectionId) return;

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('messenger-messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messenger_messages',
          filter: `connection_id=eq.${connectionId}`,
        },
        (payload) => {
          console.log('New message received:', payload);
          // Invalidate messages query if it's for the current conversation
          if (payload.new.conversation_id === conversationId) {
            queryClient.invalidateQueries({ queryKey: ['messenger-messages', conversationId] });
          }
          // Always refresh conversation list for unread counts
          queryClient.invalidateQueries({ queryKey: ['messenger-conversations'] });
        }
      )
      .subscribe();

    // Subscribe to conversation updates
    const conversationsChannel = supabase
      .channel('messenger-conversations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messenger_conversations',
          filter: `connection_id=eq.${connectionId}`,
        },
        (payload) => {
          console.log('Conversation update:', payload);
          queryClient.invalidateQueries({ queryKey: ['messenger-conversations'] });
          if (payload.new && (payload.new as { id: string }).id === conversationId) {
            queryClient.invalidateQueries({ queryKey: ['messenger-conversation', conversationId] });
          }
        }
      )
      .subscribe();

    // Subscribe to conversation tags
    const tagsChannel = supabase
      .channel('conversation-tags-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_tags',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messenger-conversations'] });
          if (conversationId) {
            queryClient.invalidateQueries({ queryKey: ['messenger-conversation', conversationId] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(tagsChannel);
    };
  }, [connectionId, conversationId, queryClient]);
}

export function useCustomerProfileRealtime(customerId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!customerId) return;

    const channel = supabase
      .channel(`customer-profile-${customerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_profiles',
          filter: `id=eq.${customerId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['customer-profile'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customerId, queryClient]);
}
