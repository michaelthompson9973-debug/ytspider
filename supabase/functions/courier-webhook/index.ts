import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, logRequest, checkRateLimit, getClientIp, rateLimitedResponse } from "../_shared/auth.ts";

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
  const rateLimitResult = checkRateLimit(ip, { windowMs: 60000, maxRequests: 100 });
  if (!rateLimitResult.allowed) {
    return rateLimitedResponse();
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    console.log('Webhook received:', JSON.stringify(body));

    // Determine provider from payload structure
    let provider: 'steadfast' | 'pathao';
    let consignmentId: string;
    let courierStatus: string;

    // Steadfast webhook format
    if (body.consignment_id && body.status) {
      provider = 'steadfast';
      consignmentId = body.consignment_id;
      courierStatus = body.status;
    }
    // Pathao webhook format
    else if (body.order_id || body.consignment_id) {
      provider = 'pathao';
      consignmentId = body.consignment_id || body.order_id;
      courierStatus = body.order_status || body.status || 'unknown';
    }
    else {
      console.error('Unknown webhook format:', body);
      return new Response(
        JSON.stringify({ error: 'Unknown webhook format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find order by consignment_id
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('consignment_id', consignmentId)
      .single();

    if (orderError || !order) {
      console.log('Order not found for consignment:', consignmentId);
      // Return 200 to prevent webhook retries
      return new Response(
        JSON.stringify({ success: true, message: 'Order not found, webhook acknowledged' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get new order status from mapping
    const statusMap = provider === 'steadfast' ? STEADFAST_STATUS_MAP : PATHAO_STATUS_MAP;
    const newOrderStatus = statusMap[courierStatus] || null;

    const statusChanged = order.courier_status !== courierStatus;
    const orderStatusChanged = newOrderStatus && order.status !== newOrderStatus;

    // Update order
    const updates: Record<string, unknown> = {
      courier_status: courierStatus,
      courier_synced_at: new Date().toISOString(),
    };

    if (orderStatusChanged) {
      updates.status = newOrderStatus;
    }

    await supabase.from('orders').update(updates).eq('id', order.id);

    // Log status change if order status changed
    if (orderStatusChanged) {
      await supabase.from('order_status_history').insert({
        order_id: order.id,
        old_status: order.status,
        new_status: newOrderStatus,
        note: `Webhook: ${provider} status changed to ${courierStatus}`,
      });

      // Trigger order webhooks for status change
      try {
        await supabase.functions.invoke('trigger-order-webhooks', {
          body: { orderId: order.id, event: 'order.status_updated' },
        });
      } catch (e) {
        console.error('Failed to trigger order webhooks:', e);
      }
    }

    console.log(`Webhook processed: ${provider} order ${order.id} status ${courierStatus}`);

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        courier_status: courierStatus,
        order_status: newOrderStatus,
        status_changed: statusChanged,
        order_status_changed: orderStatusChanged,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in courier-webhook:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
