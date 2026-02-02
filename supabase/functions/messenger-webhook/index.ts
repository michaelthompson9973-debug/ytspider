import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookEntry {
  id: string;
  time: number;
  messaging?: MessagingEvent[];
}

interface MessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    attachments?: Array<{
      type: string;
      payload: { url?: string; sticker_id?: number; coordinates?: { lat: number; long: number } };
    }>;
  };
  postback?: {
    payload: string;
    referral?: { ref: string; ad_id?: string };
  };
  referral?: {
    ref: string;
    ad_id?: string;
    ads_context_data?: {
      ad_title?: string;
      photo_url?: string;
    };
  };
  read?: { watermark: number };
  delivery?: { watermark: number };
}

interface WebhookPayload {
  object: string;
  entry: WebhookEntry[];
}

interface Connection {
  id: string;
  page_id: string;
  page_access_token: string;
  is_active: boolean;
}

interface Conversation {
  id: string;
  connection_id: string;
  sender_psid: string;
  unread_count: number;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // Webhook verification (GET request from Facebook)
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    console.log('Webhook verification request:', { mode, token });

    if (mode === 'subscribe') {
      // Verify token against stored connections
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const { data: connection } = await supabase
        .from('messenger_connections')
        .select('id')
        .eq('webhook_verify_token', token)
        .eq('is_active', true)
        .maybeSingle();

      if (connection) {
        console.log('Webhook verified for connection:', connection.id);
        return new Response(challenge, { headers: corsHeaders });
      }
    }

    return new Response('Forbidden', { status: 403, headers: corsHeaders });
  }

  // Handle webhook events (POST request)
  if (req.method === 'POST') {
    try {
      const body: WebhookPayload = await req.json();
      console.log('Webhook received:', JSON.stringify(body, null, 2));

      if (body.object !== 'page') {
        return new Response('Not a page event', { status: 400, headers: corsHeaders });
      }

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      for (const entry of body.entry) {
        const pageId = entry.id;

        // Find the connection for this page
        const { data: connection, error: connError } = await supabase
          .from('messenger_connections')
          .select('*')
          .eq('page_id', pageId)
          .eq('is_active', true)
          .maybeSingle();

        if (connError || !connection) {
          console.log('No active connection for page:', pageId);
          continue;
        }

        const conn = connection as Connection;

        // Process messaging events
        for (const event of entry.messaging || []) {
          await processMessagingEvent(supabase, conn, event);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (err) {
      const error = err as Error;
      console.error('Webhook error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders });
});

async function processMessagingEvent(
  supabase: {
    from: (table: string) => ReturnType<ReturnType<typeof createClient>['from']>;
  },
  connection: Connection,
  event: MessagingEvent
) {
  const senderPsid = event.sender.id;
  const recipientId = event.recipient.id;
  const isFromPage = senderPsid === connection.page_id;
  const customerPsid = isFromPage ? recipientId : senderPsid;

  console.log('Processing event for customer:', customerPsid, 'isFromPage:', isFromPage);

  // Skip if sender is the page itself (echo of sent messages handled separately)
  if (isFromPage && !event.message) {
    return;
  }

  // Find or create conversation
  const { data: existingConv } = await supabase
    .from('messenger_conversations')
    .select('*')
    .eq('connection_id', connection.id)
    .eq('sender_psid', customerPsid)
    .maybeSingle();

  let conversation: Conversation;

  if (!existingConv) {
    // Create new conversation
    const { data: newConv, error: convError } = await supabase
      .from('messenger_conversations')
      .insert({
        connection_id: connection.id,
        sender_psid: customerPsid,
        unread_count: isFromPage ? 0 : 1,
        last_message_at: new Date(event.timestamp).toISOString(),
      })
      .select()
      .single();

    if (convError || !newConv) {
      console.error('Error creating conversation:', convError);
      return;
    }

    conversation = newConv as unknown as Conversation;
    console.log('Created new conversation:', conversation.id);
  } else {
    conversation = existingConv as unknown as Conversation;
  }

  // Process message event
  if (event.message) {
    const messageText = event.message.text || null;
    const attachments = event.message.attachments?.map(att => ({
      type: att.type,
      payload: att.payload,
    })) || null;

    // Insert message
    const { error: msgError } = await supabase.from('messenger_messages').insert({
      connection_id: connection.id,
      conversation_id: conversation.id,
      message_id: event.message.mid,
      sender_psid: senderPsid,
      message_text: messageText,
      attachments: attachments,
      is_from_page: isFromPage,
      timestamp: new Date(event.timestamp).toISOString(),
    });

    if (msgError) {
      console.error('Error inserting message:', msgError);
      return;
    }

    // Update conversation
    const updateData: { last_message_at: string; unread_count?: number } = {
      last_message_at: new Date(event.timestamp).toISOString(),
    };

    if (!isFromPage) {
      // Increment unread count for incoming messages
      updateData.unread_count = (conversation.unread_count || 0) + 1;
    }

    await supabase
      .from('messenger_conversations')
      .update(updateData)
      .eq('id', conversation.id);

    console.log('Message saved successfully');
  }

  // Process referral (ad click)
  if (event.referral) {
    console.log('Processing referral:', event.referral);
    
    // Store ad source
    await supabase.from('ad_sources').upsert({
      conversation_id: conversation.id,
      ad_id: event.referral.ad_id || null,
      ad_name: event.referral.ads_context_data?.ad_title || null,
      campaign_id: null, // Would need Marketing API to get this
      campaign_name: null,
      placement: 'facebook_messenger',
      click_timestamp: new Date(event.timestamp).toISOString(),
    }, { onConflict: 'conversation_id' });

    // Add "From Ads" tag
    await supabase.from('conversation_tags').upsert({
      conversation_id: conversation.id,
      tag: 'From Ads',
    }, { onConflict: 'conversation_id,tag' });
  }

  // Process read receipt
  if (event.read && isFromPage) {
    // Mark messages as read up to watermark
    await supabase
      .from('messenger_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversation.id)
      .is('read_at', null)
      .lte('timestamp', new Date(event.read.watermark).toISOString());
  }
}
