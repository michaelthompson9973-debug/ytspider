import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const invoiceNumber = url.searchParams.get('invoice_number')
    const trxId = url.searchParams.get('trx_id')

    console.log('PayStation callback:', { status, invoiceNumber, trxId })

    if (!invoiceNumber) {
      return new Response('Missing invoice_number', { status: 400 })
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Find the purchase
    const { data: purchase, error: purchaseError } = await adminClient
      .from('purchases')
      .select('*')
      .eq('paystation_invoice_number', invoiceNumber)
      .single()

    if (purchaseError || !purchase) {
      console.error('Purchase not found:', invoiceNumber)
      return redirectToResult('failed', 'Purchase not found')
    }

    if (status === 'Successful' && trxId) {
      // Verify transaction with PayStation
      const merchantId = Deno.env.get('PAYSTATION_MERCHANT_ID')!
      
      const verifyForm = new FormData()
      verifyForm.append('invoice_number', invoiceNumber)
      
      const verifyResponse = await fetch('https://api.paystation.com.bd/transaction-status', {
        method: 'POST',
        headers: { 'merchantId': merchantId },
        body: verifyForm,
      })

      const verifyResult = await verifyResponse.json()
      console.log('Verification result:', verifyResult)

      const isVerified = verifyResult.status_code === '200' && 
        verifyResult.data?.trx_status?.toLowerCase() === 'success'

      if (isVerified) {
        // Update purchase as completed
        await adminClient
          .from('purchases')
          .update({
            payment_status: 'completed',
            paystation_trx_id: trxId,
            completed_at: new Date().toISOString(),
          })
          .eq('id', purchase.id)

        // Now activate the plan
        await activatePlan(adminClient, purchase)

        // Redirect to success page
        const siteUrl = getSiteUrl()
        return Response.redirect(
          `${siteUrl}/purchase-success?status=success&invoice=${invoiceNumber}`,
          302
        )
      } else {
        // Verification failed
        await adminClient
          .from('purchases')
          .update({ payment_status: 'failed', paystation_trx_id: trxId || null })
          .eq('id', purchase.id)

        const siteUrl = getSiteUrl()
        return Response.redirect(
          `${siteUrl}/purchase-success?status=failed&invoice=${invoiceNumber}`,
          302
        )
      }
    } else {
      // Payment failed or cancelled
      await adminClient
        .from('purchases')
        .update({ payment_status: status === 'Canceled' ? 'cancelled' : 'failed' })
        .eq('id', purchase.id)

      const siteUrl = getSiteUrl()
      return Response.redirect(
        `${siteUrl}/purchase-success?status=${status === 'Canceled' ? 'cancelled' : 'failed'}&invoice=${invoiceNumber}`,
        302
      )
    }
  } catch (err) {
    console.error('Callback error:', err)
    const siteUrl = getSiteUrl()
    return Response.redirect(`${siteUrl}/purchase-success?status=error`, 302)
  }
})

function getSiteUrl(): string {
  // Use the published URL or fallback
  return 'https://yt-crawl-buddy.lovable.app'
}

function redirectToResult(status: string, message: string) {
  const siteUrl = getSiteUrl()
  return Response.redirect(`${siteUrl}/purchase-success?status=${status}&message=${encodeURIComponent(message)}`, 302)
}

async function activatePlan(adminClient: any, purchase: any) {
  try {
    const planSnapshot = purchase.plan_snapshot as any
    const userId = purchase.user_id
    const shopId = purchase.shop_id

    if (!userId) {
      console.error('No user_id on purchase')
      return
    }

    // Calculate expiration
    const durationDays = planSnapshot?.duration_days || 30
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + durationDays)

    if (shopId) {
      // Upgrade existing shop
      const planSlug = planSnapshot?.slug || 'pro'
      const planType = planSlug === 'enterprise' ? 'enterprise' : planSlug === 'starter' || planSlug === 'free' ? 'free' : 'pro'

      await adminClient
        .from('shops')
        .update({ plan: planType })
        .eq('id', shopId)

      // Create or update subscription
      const { data: existingSub } = await adminClient
        .from('subscriptions')
        .select('id')
        .eq('shop_id', shopId)
        .eq('status', 'active')
        .maybeSingle()

      if (existingSub) {
        await adminClient
          .from('subscriptions')
          .update({
            plan_id: planSnapshot.id || purchase.plan_id,
            starts_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            amount_paid: purchase.amount,
            status: 'active',
            payment_provider: 'paystation',
          })
          .eq('id', existingSub.id)
      } else {
        await adminClient
          .from('subscriptions')
          .insert({
            user_id: userId,
            shop_id: shopId,
            plan_id: planSnapshot.id || purchase.plan_id,
            starts_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            amount_paid: purchase.amount,
            status: 'active',
            payment_provider: 'paystation',
            currency: purchase.currency || 'BDT',
          })
      }

      // Update purchase with subscription info
      await adminClient
        .from('purchases')
        .update({ shop_id: shopId })
        .eq('id', purchase.id)

      console.log(`Plan upgraded for shop ${shopId} to ${planType}`)
    } else {
      // No shop_id — user buying for the first time without a shop
      // Just create subscription record, shop will be created during onboarding
      await adminClient
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_id: planSnapshot.id || purchase.plan_id,
          starts_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          amount_paid: purchase.amount,
          status: 'active',
          payment_provider: 'paystation',
          currency: purchase.currency || 'BDT',
        })
      
      console.log(`Subscription created for user ${userId} without shop`)
    }
  } catch (err) {
    console.error('Error activating plan:', err)
  }
}
