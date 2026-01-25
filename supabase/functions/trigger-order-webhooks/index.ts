import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      throw new Error('Order ID is required');
    }

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
      console.log('No enabled webhooks found');
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Trigger each webhook
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

    console.log(`Webhooks triggered: ${succeeded} succeeded, ${failed} failed`);

    return new Response(
      JSON.stringify({ success: true, sent: succeeded, failed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error triggering webhooks:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
