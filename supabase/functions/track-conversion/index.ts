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
    const { eventId, productName, productPrice, customerCity, landingPageSlug } = await req.json();

    console.log('Tracking conversion:', { eventId, productName, productPrice, customerCity, landingPageSlug });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Store conversion event for deduplication
    const { error: insertError } = await supabase
      .from('conversion_events')
      .insert([{
        order_id: null, // Could be linked if order_id is passed
        platform: 'google',
        event_id: eventId,
        event_name: 'purchase',
        response_status: 200,
        response_body: JSON.stringify({ status: 'logged' }),
      }]);

    if (insertError) {
      console.error('Error storing conversion event:', insertError);
    }

    // Here you would add actual GA4/Google Ads Measurement Protocol calls
    // For now, we just log the conversion
    console.log('Conversion logged successfully:', eventId);

    return new Response(
      JSON.stringify({ success: true, eventId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in track-conversion:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
