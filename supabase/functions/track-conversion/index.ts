import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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
  const maxRequests = 30;
  
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

interface ConversionPayload {
  eventId: string;
  orderId: string;
  transactionId: string;
  productName?: string;
  productIds?: string[];
  customerPhone?: string;
  customerCity?: string;
  landingPageSlug?: string;
  quantity?: number;
  subtotal?: number;
  shipping?: number;
  total?: number;
  currency?: string;
  items?: Array<{
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
    index?: number;
  }>;
}

function logConversion(
  eventType: string,
  payload: ConversionPayload,
  ip: string,
  result: string,
  details?: string
) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event: eventType,
    eventId: payload.eventId,
    orderId: payload.orderId,
    transactionId: payload.transactionId,
    value: payload.total,
    currency: payload.currency,
    itemCount: payload.items?.length || 0,
    quantity: payload.quantity,
    landingPage: payload.landingPageSlug,
    city: payload.customerCity,
    ip,
    result,
    details,
  }));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const ip = getClientIp(req);

  // Rate limiting
  if (!checkRateLimit(ip)) {
    console.warn(`Rate limited: ${ip}`);
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const payload: ConversionPayload = await req.json();
    
    const { 
      eventId, 
      orderId, 
      transactionId,
      productName, 
      productIds,
      customerPhone,
      customerCity, 
      landingPageSlug,
      quantity,
      subtotal,
      shipping,
      total,
      currency,
      items,
    } = payload;

    // Validate required fields
    if (!eventId || !orderId) {
      logConversion('purchase', payload, ip, 'error', 'Missing eventId or orderId');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: eventId and orderId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logConversion('purchase', payload, ip, 'processing');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check for duplicate event (deduplication)
    const { data: existingEvent } = await supabase
      .from('conversion_events')
      .select('id')
      .eq('event_id', eventId)
      .eq('platform', 'google')
      .maybeSingle();

    if (existingEvent) {
      logConversion('purchase', payload, ip, 'duplicate', 'Event already tracked');
      return new Response(
        JSON.stringify({ success: true, eventId, duplicate: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store conversion event for deduplication and analytics
    const conversionData = {
      order_id: orderId,
      platform: 'google',
      event_id: eventId,
      event_name: 'purchase',
      response_status: 200,
      response_body: JSON.stringify({
        status: 'tracked',
        transaction_id: transactionId || orderId,
        value: total,
        currency: currency || 'BDT',
        items_count: items?.length || 0,
        quantity: quantity || 0,
        product_names: productName,
        product_ids: productIds,
        landing_page: landingPageSlug,
        city: customerCity,
        phone_hash: customerPhone ? 'provided' : 'not_provided',
        subtotal,
        shipping,
      }),
    };

    const { error: insertError } = await supabase
      .from('conversion_events')
      .insert([conversionData]);

    if (insertError) {
      console.error('Error storing conversion event:', insertError);
      logConversion('purchase', payload, ip, 'db_error', insertError.message);
      // Don't fail the request, just log the error
    }

    logConversion('purchase', payload, ip, 'success');

    return new Response(
      JSON.stringify({ 
        success: true, 
        eventId,
        transactionId: transactionId || orderId,
        tracked: true,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Track conversion error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
