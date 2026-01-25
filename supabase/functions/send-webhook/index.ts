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

function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

function logRequest(
  functionName: string,
  req: Request,
  userId: string | null,
  isServiceRole: boolean,
  result: string,
  details?: string
) {
  const ip = getClientIp(req);
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    function: functionName,
    method: req.method,
    ip,
    userId: userId || 'anonymous',
    isServiceRole,
    result,
    details,
  }));
}

async function verifyAuth(req: Request): Promise<{
  authenticated: boolean;
  userId?: string;
  isAdmin?: boolean;
  isServiceRole?: boolean;
  error?: string;
}> {
  const authHeader = req.headers.get('Authorization');
  
  // Check for service role key (internal calls from trigger-order-webhooks)
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (authHeader === `Bearer ${serviceRoleKey}`) {
    return { authenticated: true, isServiceRole: true };
  }

  if (!authHeader?.startsWith('Bearer ')) {
    return { authenticated: false, error: 'Missing or invalid Authorization header' };
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return { authenticated: false, error: 'Invalid token' };
    }

    const userId = claimsData.claims.sub as string;

    // Check admin status
    const { data: isAdminData } = await supabase
      .rpc('has_role', { _user_id: userId, _role: 'admin' });

    return {
      authenticated: true,
      userId,
      isAdmin: !!isAdminData,
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { authenticated: false, error: 'Token verification failed' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify authentication - must be admin or service role
  const auth = await verifyAuth(req);
  
  if (!auth.authenticated) {
    logRequest('send-webhook', req, null, false, 'unauthorized', auth.error);
    return new Response(
      JSON.stringify({ error: auth.error || 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Only allow service role (internal) or admin users
  if (!auth.isServiceRole && !auth.isAdmin) {
    logRequest('send-webhook', req, auth.userId || null, false, 'forbidden', 'Not admin');
    return new Response(
      JSON.stringify({ error: 'Admin access required' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { webhookId, orderId, test, message }: WebhookPayload = await req.json();

    logRequest('send-webhook', req, auth.userId || null, auth.isServiceRole || false, 'processing', `webhookId: ${webhookId}`);

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
      logRequest('send-webhook', req, auth.userId || null, auth.isServiceRole || false, 'skipped', 'Webhook disabled');
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
      console.log('Email notification would be sent to:', webhook.email);
      logRequest('send-webhook', req, auth.userId || null, auth.isServiceRole || false, 'success', 'Email logged');
      return new Response(JSON.stringify({ success: true, type: 'email', note: 'Email integration requires setup' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const responseText = response ? await response.text() : '';
    logRequest('send-webhook', req, auth.userId || null, auth.isServiceRole || false, 'success', `Response: ${responseText.substring(0, 100)}`);

    return new Response(
      JSON.stringify({ success: true, response: responseText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logRequest('send-webhook', req, auth.userId || null, auth.isServiceRole || false, 'error', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
