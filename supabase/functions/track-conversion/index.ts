import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiter
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 20;
  
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

function logRequest(
  functionName: string,
  req: Request,
  userId: string | null,
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
    result,
    details,
  }));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const ip = getClientIp(req);

  // Rate limiting
  if (!checkRateLimit(ip)) {
    logRequest('track-conversion', req, null, 'rate_limited');
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { eventId, productName, productPrice, customerCity, landingPageSlug } = await req.json();

    // This endpoint is called from client-side after order submission
    // It's semi-public but rate-limited and logged
    let userId: string | null = null;
    
    // Try to extract user from token if present (optional auth)
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const supabaseAuth = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_ANON_KEY')!,
          { global: { headers: { Authorization: authHeader } } }
        );
        const token = authHeader.replace('Bearer ', '');
        const { data } = await supabaseAuth.auth.getClaims(token);
        userId = data?.claims?.sub as string || null;
      } catch {
        // Optional auth - continue without user
      }
    }

    logRequest('track-conversion', req, userId, 'processing', `eventId: ${eventId}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Store conversion event for deduplication
    const { error: insertError } = await supabase
      .from('conversion_events')
      .insert([{
        order_id: null,
        platform: 'google',
        event_id: eventId,
        event_name: 'purchase',
        response_status: 200,
        response_body: JSON.stringify({ status: 'logged' }),
      }]);

    if (insertError) {
      console.error('Error storing conversion event:', insertError);
      logRequest('track-conversion', req, userId, 'error', insertError.message);
    }

    logRequest('track-conversion', req, userId, 'success', `eventId: ${eventId}`);

    return new Response(
      JSON.stringify({ success: true, eventId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logRequest('track-conversion', req, null, 'error', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
