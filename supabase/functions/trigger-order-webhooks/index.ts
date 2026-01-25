import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  
  // Check for service role key (internal calls)
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
    logRequest('trigger-order-webhooks', req, null, false, 'unauthorized', auth.error);
    return new Response(
      JSON.stringify({ error: auth.error || 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Only allow service role (internal) or admin users
  if (!auth.isServiceRole && !auth.isAdmin) {
    logRequest('trigger-order-webhooks', req, auth.userId || null, false, 'forbidden', 'Not admin');
    return new Response(
      JSON.stringify({ error: 'Admin access required' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    logRequest('trigger-order-webhooks', req, auth.userId || null, auth.isServiceRole || false, 'processing', `orderId: ${orderId}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get all enabled webhooks
    const { data: webhooks, error: webhooksError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('enabled', true);

    if (webhooksError) {
      console.error('Error fetching webhooks:', webhooksError);
      throw webhooksError;
    }

    if (!webhooks || webhooks.length === 0) {
      logRequest('trigger-order-webhooks', req, auth.userId || null, auth.isServiceRole || false, 'success', 'No webhooks found');
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Trigger each webhook using service role for internal calls
    const results = await Promise.allSettled(
      webhooks.map(async (webhook) => {
        const { error } = await supabase.functions.invoke('send-webhook', {
          body: {
            webhookId: webhook.id,
            orderId,
          },
        });
        if (error) throw error;
        return webhook.id;
      })
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    logRequest('trigger-order-webhooks', req, auth.userId || null, auth.isServiceRole || false, 'success', `sent: ${succeeded}, failed: ${failed}`);

    return new Response(
      JSON.stringify({ success: true, sent: succeeded, failed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logRequest('trigger-order-webhooks', req, auth.userId || null, auth.isServiceRole || false, 'error', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
