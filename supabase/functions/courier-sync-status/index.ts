import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, verifyAuth, unauthorizedResponse, logRequest, checkRateLimit, getClientIp, rateLimitedResponse } from "../_shared/auth.ts";

interface SyncStatusRequest {
  orderId: string;
}

// Status mapping from courier to order status
const STEADFAST_STATUS_MAP: Record<string, string> = {
  'pending': 'shipped',
  'delivered_approval_pending': 'shipped',
  'partial_delivered_approval_pending': 'shipped',
  'cancelled_approval_pending': 'shipped',
  'unknown_approval_pending': 'shipped',
  'delivered': 'delivered',
  'partial_delivered': 'delivered',
  'cancelled': 'cancelled',
  'hold': 'shipped',
  'in_review': 'shipped',
};

const PATHAO_STATUS_MAP: Record<string, string> = {
  'Pending': 'shipped',
  'Pickup_Requested': 'shipped',
  'Picked': 'shipped',
  'At_The_Sorting_Hub': 'shipped',
  'In_Transit': 'shipped',
  'Out_For_Delivery': 'shipped',
  'Delivered': 'delivered',
  'Partial_Delivery': 'delivered',
  'Return': 'cancelled',
  'Exchange': 'shipped',
  'On_Hold': 'shipped',
  'Payment_Invoice': 'delivered',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const ip = getClientIp(req);
  const rateLimitResult = checkRateLimit(ip, { windowMs: 60000, maxRequests: 30 });
  if (!rateLimitResult.allowed) {
    return rateLimitedResponse();
  }

  try {
    const auth = await verifyAuth(req);
    if (!auth.authenticated || (!auth.isAdmin && !auth.isServiceRole)) {
      logRequest('courier-sync-status', req, auth, 'unauthorized');
      return unauthorizedResponse('Admin access required');
    }

    const body: SyncStatusRequest = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'orderId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!order.consignment_id || !order.courier_provider) {
      return new Response(
        JSON.stringify({ error: 'Order not sent to courier yet' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch credentials
    const { data: credentials } = await supabase
      .from('courier_credentials')
      .select('*')
      .eq('provider', order.courier_provider)
      .eq('is_active', true);

    if (!credentials || credentials.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No active courier credentials found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let newCourierStatus: string;
    let newOrderStatus: string | null = null;

    if (order.courier_provider === 'steadfast') {
      const apiKey = credentials.find(c => c.credential_type === 'api_key')?.credential_value;
      const secretKey = credentials.find(c => c.credential_type === 'secret_key')?.credential_value;

      if (!apiKey || !secretKey) {
        return new Response(
          JSON.stringify({ error: 'Steadfast credentials incomplete' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch status from Steadfast
      const response = await fetch(
        `https://portal.packzy.com/api/v1/status_by_cid/${order.consignment_id}`,
        {
          headers: {
            'Api-Key': apiKey,
            'Secret-Key': secretKey,
          },
        }
      );

      const data = await response.json();
      console.log('Steadfast status response:', data);

      if (data.status !== 200) {
        return new Response(
          JSON.stringify({ error: data.message || 'Failed to fetch status' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      newCourierStatus = data.delivery_status || 'unknown';
      newOrderStatus = STEADFAST_STATUS_MAP[newCourierStatus] || null;

    } else if (order.courier_provider === 'pathao') {
      const accessTokenCred = credentials.find(c => c.credential_type === 'access_token');

      if (!accessTokenCred?.access_token) {
        return new Response(
          JSON.stringify({ error: 'Pathao access token not found' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch status from Pathao
      const response = await fetch(
        `https://api-hermes.pathao.com/aladdin/api/v1/orders/${order.consignment_id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessTokenCred.access_token}`,
          },
        }
      );

      const data = await response.json();
      console.log('Pathao status response:', data);

      if (data.code !== 200) {
        return new Response(
          JSON.stringify({ error: data.message || 'Failed to fetch status' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      newCourierStatus = data.data?.order_status || 'unknown';
      newOrderStatus = PATHAO_STATUS_MAP[newCourierStatus] || null;

    } else {
      return new Response(
        JSON.stringify({ error: 'Unknown courier provider' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update order if status changed
    const updates: Record<string, unknown> = {
      courier_status: newCourierStatus,
      courier_synced_at: new Date().toISOString(),
    };

    const statusChanged = order.courier_status !== newCourierStatus;
    const orderStatusChanged = newOrderStatus && order.status !== newOrderStatus;

    if (orderStatusChanged) {
      updates.status = newOrderStatus;

      // Log status change
      await supabase.from('order_status_history').insert({
        order_id: orderId,
        old_status: order.status,
        new_status: newOrderStatus,
        note: `Auto-updated from courier status: ${newCourierStatus}`,
        changed_by: auth.userId || null,
      });
    }

    await supabase.from('orders').update(updates).eq('id', orderId);

    logRequest('courier-sync-status', req, auth, 'success', `Synced ${order.courier_provider}: ${newCourierStatus}`);

    return new Response(
      JSON.stringify({
        success: true,
        courier_status: newCourierStatus,
        order_status: newOrderStatus,
        status_changed: statusChanged,
        order_status_changed: orderStatusChanged,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in courier-sync-status:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
