import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, verifyAuth, unauthorizedResponse, logRequest, checkRateLimit, getClientIp, rateLimitedResponse } from "../_shared/auth.ts";

interface CreateOrderRequest {
  orderId: string;
  provider: 'steadfast' | 'pathao';
  // Pathao specific fields
  cityId?: number;
  zoneId?: number;
  areaId?: number;
  weight?: number;
  specialInstructions?: string;
}

interface SteadfastResponse {
  status: number;
  message: string;
  consignment?: {
    consignment_id: string;
    tracking_code: string;
    status: string;
  };
}

interface PathaoResponse {
  code: number;
  message: string;
  data?: {
    consignment_id: string;
    merchant_order_id: string;
    order_status: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const ip = getClientIp(req);
  const rateLimitResult = checkRateLimit(ip, { windowMs: 60000, maxRequests: 20 });
  if (!rateLimitResult.allowed) {
    return rateLimitedResponse();
  }

  try {
    // Verify admin authentication
    const auth = await verifyAuth(req);
    if (!auth.authenticated || (!auth.isAdmin && !auth.isServiceRole)) {
      logRequest('courier-create-order', req, auth, 'unauthorized');
      return unauthorizedResponse('Admin access required');
    }

    const body: CreateOrderRequest = await req.json();
    const { orderId, provider, cityId, zoneId, areaId, weight = 0.5, specialInstructions } = body;

    if (!orderId || !provider) {
      return new Response(
        JSON.stringify({ error: 'orderId and provider are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service role client for DB operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order fetch error:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already sent to courier
    if (order.consignment_id) {
      return new Response(
        JSON.stringify({ error: 'Order already sent to courier', consignment_id: order.consignment_id }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch courier credentials
    const { data: credentials, error: credError } = await supabase
      .from('courier_credentials')
      .select('*')
      .eq('provider', provider)
      .eq('is_active', true);

    if (credError || !credentials || credentials.length === 0) {
      console.error('Credentials fetch error:', credError);
      return new Response(
        JSON.stringify({ error: `No active ${provider} credentials found` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let consignmentId: string;
    let trackingCode: string;
    let courierStatus: string;

    if (provider === 'steadfast') {
      // Find API Key and Secret Key
      const apiKey = credentials.find(c => c.credential_type === 'api_key')?.credential_value;
      const secretKey = credentials.find(c => c.credential_type === 'secret_key')?.credential_value;

      if (!apiKey || !secretKey) {
        return new Response(
          JSON.stringify({ error: 'Steadfast API Key and Secret Key are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Call Steadfast API
      const steadfastResponse = await fetch('https://portal.packzy.com/api/v1/create_order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': apiKey,
          'Secret-Key': secretKey,
        },
        body: JSON.stringify({
          invoice: order.id.slice(0, 8).toUpperCase(),
          recipient_name: order.customer_name,
          recipient_phone: order.customer_phone,
          recipient_address: `${order.customer_address}, ${order.customer_city}`,
          cod_amount: order.total || 0,
          note: specialInstructions || order.note || '',
        }),
      });

      const steadfastData: SteadfastResponse = await steadfastResponse.json();
      console.log('Steadfast response:', steadfastData);

      if (steadfastData.status !== 200 || !steadfastData.consignment) {
        return new Response(
          JSON.stringify({ error: steadfastData.message || 'Failed to create Steadfast order' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      consignmentId = steadfastData.consignment.consignment_id;
      trackingCode = steadfastData.consignment.tracking_code;
      courierStatus = steadfastData.consignment.status || 'pending';

    } else if (provider === 'pathao') {
      // Find access token
      const accessTokenCred = credentials.find(c => c.credential_type === 'access_token');
      const storeIdCred = credentials.find(c => c.credential_type === 'store_id');

      if (!accessTokenCred?.access_token) {
        return new Response(
          JSON.stringify({ error: 'Pathao access token not found. Please authenticate first.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check token expiry
      if (accessTokenCred.token_expires_at && new Date(accessTokenCred.token_expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'Pathao access token expired. Please re-authenticate.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!storeIdCred?.credential_value) {
        return new Response(
          JSON.stringify({ error: 'Pathao store ID not configured' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!cityId || !zoneId) {
        return new Response(
          JSON.stringify({ error: 'Pathao requires cityId and zoneId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Call Pathao API
      const pathaoResponse = await fetch('https://api-hermes.pathao.com/aladdin/api/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessTokenCred.access_token}`,
        },
        body: JSON.stringify({
          store_id: parseInt(storeIdCred.credential_value),
          merchant_order_id: order.id.slice(0, 8).toUpperCase(),
          recipient_name: order.customer_name,
          recipient_phone: order.customer_phone,
          recipient_address: order.customer_address,
          recipient_city: cityId,
          recipient_zone: zoneId,
          recipient_area: areaId || undefined,
          delivery_type: 48, // 48 hours delivery
          item_type: 2, // Parcel
          special_instruction: specialInstructions || order.note || '',
          item_quantity: order.quantity || 1,
          item_weight: weight,
          amount_to_collect: order.total || 0,
          item_description: 'Order items',
        }),
      });

      const pathaoData: PathaoResponse = await pathaoResponse.json();
      console.log('Pathao response:', pathaoData);

      if (pathaoData.code !== 200 || !pathaoData.data) {
        return new Response(
          JSON.stringify({ error: pathaoData.message || 'Failed to create Pathao order' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      consignmentId = pathaoData.data.consignment_id;
      trackingCode = pathaoData.data.consignment_id; // Pathao uses same ID for tracking
      courierStatus = pathaoData.data.order_status || 'Pending';

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid provider' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update order with courier info
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        courier_provider: provider,
        consignment_id: consignmentId,
        tracking_code: trackingCode,
        courier_status: courierStatus,
        courier_synced_at: new Date().toISOString(),
        status: 'shipped', // Auto update to shipped
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Order update error:', updateError);
      // Don't fail the request, courier order was created
    }

    // Log status change
    await supabase.from('order_status_history').insert({
      order_id: orderId,
      old_status: order.status,
      new_status: 'shipped',
      note: `Sent to ${provider}. Consignment: ${consignmentId}`,
      changed_by: auth.userId || null,
    });

    logRequest('courier-create-order', req, auth, 'success', `Created ${provider} order: ${consignmentId}`);

    return new Response(
      JSON.stringify({
        success: true,
        provider,
        consignment_id: consignmentId,
        tracking_code: trackingCode,
        courier_status: courierStatus,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in courier-create-order:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
