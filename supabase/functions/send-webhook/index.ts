import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  webhookId?: string;
  orderId?: string;
  test?: boolean;
  message?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { webhookId, orderId, test, message }: WebhookPayload = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get webhook config
    let webhook;
    if (webhookId) {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('id', webhookId)
        .single();
      if (error) throw error;
      webhook = data;
    }

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    if (!webhook.enabled && !test) {
      console.log('Webhook disabled, skipping');
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build message
    let notificationMessage = message || '';
    if (orderId && !test) {
      const { data: order } = await supabase
        .from('orders')
        .select(`
          *,
          products (name, price),
          landing_pages (slug)
        `)
        .eq('id', orderId)
        .single();

      if (order) {
        notificationMessage = `🛒 New Order!\n\nCustomer: ${order.customer_name}\nPhone: ${order.customer_phone}\nCity: ${order.customer_city}\nProduct: ${order.products?.name || 'N/A'}\nPrice: $${order.products?.price || 0}\nPage: /${order.landing_pages?.slug || 'N/A'}\n\nUTM Source: ${order.utm_source || '-'}`;
      }
    }

    // Send based on type
    let response;
    if (webhook.type === 'telegram' && webhook.url) {
      // Extract bot token and chat ID from URL or use URL directly
      response = await fetch(webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: notificationMessage,
          parse_mode: 'HTML',
        }),
      });
    } else if (webhook.type === 'slack' && webhook.url) {
      response = await fetch(webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: notificationMessage,
        }),
      });
    } else if (webhook.type === 'email' && webhook.email) {
      // For email, you'd integrate with a service like Resend
      console.log('Email notification would be sent to:', webhook.email);
      console.log('Message:', notificationMessage);
      // Return success for now - actual email integration requires RESEND_API_KEY
      return new Response(JSON.stringify({ success: true, type: 'email', note: 'Email integration requires setup' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const responseText = response ? await response.text() : '';
    console.log('Webhook response:', responseText);

    return new Response(
      JSON.stringify({ success: true, response: responseText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
