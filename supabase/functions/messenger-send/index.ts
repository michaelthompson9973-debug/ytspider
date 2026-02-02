import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendMessageRequest {
  connectionId: string;
  recipientPsid: string;
  message: string;
  conversationId?: string;
}

interface FacebookSendResponse {
  recipient_id: string;
  message_id: string;
}

interface Connection {
  id: string;
  page_id: string;
  page_access_token: string;
  is_active: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const body: SendMessageRequest = await req.json();
    const { connectionId, recipientPsid, message, conversationId } = body;

    console.log('Send message request:', { connectionId, recipientPsid, messageLength: message?.length });

    if (!connectionId || !recipientPsid || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: connectionId, recipientPsid, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get connection with access token
    const { data: connectionData, error: connError } = await supabase
      .from('messenger_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('is_active', true)
      .single();

    if (connError || !connectionData) {
      console.error('Connection not found:', connError);
      return new Response(
        JSON.stringify({ error: 'Connection not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const connection = connectionData as Connection;

    // Send message via Facebook Graph API
    const graphApiUrl = `https://graph.facebook.com/v18.0/${connection.page_id}/messages`;
    
    const fbResponse = await fetch(graphApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: recipientPsid },
        messaging_type: 'RESPONSE',
        message: { text: message },
        access_token: connection.page_access_token,
      }),
    });

    const fbData = await fbResponse.json();
    console.log('Facebook API response:', fbData);

    if (!fbResponse.ok) {
      console.error('Facebook API error:', fbData);
      return new Response(
        JSON.stringify({ error: 'Failed to send message', details: fbData }),
        { status: fbResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fbResult = fbData as FacebookSendResponse;

    // Find or get conversation
    let targetConversationId = conversationId;
    
    if (!targetConversationId) {
      const { data: conv } = await supabase
        .from('messenger_conversations')
        .select('id')
        .eq('connection_id', connectionId)
        .eq('sender_psid', recipientPsid)
        .maybeSingle();
      
      targetConversationId = conv?.id;
    }

    // Save sent message to database
    if (targetConversationId) {
      const { error: msgError } = await supabase.from('messenger_messages').insert({
        connection_id: connectionId,
        conversation_id: targetConversationId,
        message_id: fbResult.message_id,
        sender_psid: connection.page_id,
        message_text: message,
        is_from_page: true,
        timestamp: new Date().toISOString(),
      });

      if (msgError) {
        console.error('Error saving message:', msgError);
      }

      // Update conversation last_message_at
      await supabase
        .from('messenger_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', targetConversationId);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: fbResult.message_id,
        recipientId: fbResult.recipient_id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const error = err as Error;
    console.error('Send message error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
