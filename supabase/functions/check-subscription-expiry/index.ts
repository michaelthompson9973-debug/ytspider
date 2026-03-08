/**
 * check-subscription-expiry Edge Function
 * 
 * Runs daily via pg_cron to:
 * 1. Move expired active subscriptions → grace_period (7 days)
 * 2. Move expired grace_period shops → suspended
 * 3. Update shops.status accordingly
 * 
 * Called by pg_cron with service role key — no JWT needed.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const now = new Date().toISOString()
    const results = { entered_grace: 0, suspended: 0, errors: [] as string[] }

    // ── Step 1: Find active shops with expired subscriptions → grace_period ──
    const { data: expiredActive, error: err1 } = await adminClient
      .from('shops')
      .select('id, subscription_id, expires_at')
      .eq('status', 'active')
      .not('expires_at', 'is', null)
      .lt('expires_at', now)

    if (err1) {
      results.errors.push(`Query expired active: ${err1.message}`)
    } else if (expiredActive && expiredActive.length > 0) {
      // Set 7-day grace period
      const gracePeriodEnd = new Date()
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7)

      for (const shop of expiredActive) {
        const { error } = await adminClient
          .from('shops')
          .update({
            status: 'grace_period',
            grace_period_ends_at: gracePeriodEnd.toISOString(),
          })
          .eq('id', shop.id)

        if (error) {
          results.errors.push(`Grace ${shop.id}: ${error.message}`)
        } else {
          results.entered_grace++
        }
      }
    }

    // ── Step 2: Find grace_period shops past their grace → suspended ──
    const { data: expiredGrace, error: err2 } = await adminClient
      .from('shops')
      .select('id')
      .eq('status', 'grace_period')
      .not('grace_period_ends_at', 'is', null)
      .lt('grace_period_ends_at', now)

    if (err2) {
      results.errors.push(`Query expired grace: ${err2.message}`)
    } else if (expiredGrace && expiredGrace.length > 0) {
      for (const shop of expiredGrace) {
        // Suspend the shop
        const { error: updateErr } = await adminClient
          .from('shops')
          .update({ status: 'suspended', is_active: false })
          .eq('id', shop.id)

        if (updateErr) {
          results.errors.push(`Suspend ${shop.id}: ${updateErr.message}`)
        } else {
          results.suspended++

          // Also unpublish all landing pages for suspended shops
          await adminClient
            .from('landing_pages')
            .update({ published: false })
            .eq('shop_id', shop.id)
        }
      }
    }

    // ── Step 3: Also mark subscriptions as expired ──
    await adminClient
      .from('subscriptions')
      .update({ status: 'expired' })
      .eq('status', 'active')
      .lt('expires_at', now)

    console.log('Subscription expiry check complete:', results)

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('check-subscription-expiry error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
