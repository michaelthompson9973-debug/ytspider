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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const userId = claimsData.claims.sub
    const userEmail = claimsData.claims.email as string

    const { plan_slug, shop_id } = await req.json()

    if (!plan_slug) {
      return new Response(JSON.stringify({ error: 'plan_slug is required' }), { status: 400, headers: corsHeaders })
    }

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('pricing_plans')
      .select('*')
      .eq('slug', plan_slug)
      .eq('is_active', true)
      .single()

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), { status: 404, headers: corsHeaders })
    }

    // Get user profile
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: profile } = await adminClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single()

    // Generate unique invoice number
    const invoiceNumber = `PS-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

    // Determine callback URL
    const siteUrl = Deno.env.get('SUPABASE_URL')!.replace('.supabase.co', '')
    const callbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/paystation-callback`

    // Create purchase record
    const { data: purchase, error: purchaseError } = await adminClient
      .from('purchases')
      .insert({
        email: userEmail,
        full_name: profile?.full_name || userEmail,
        plan_id: plan.id,
        plan_snapshot: plan,
        shop_name: '', // Will be filled if new shop needed
        payment_provider: 'paystation',
        payment_status: 'pending',
        amount: plan.price_monthly,
        currency: plan.currency || 'BDT',
        user_id: userId,
        shop_id: shop_id || null,
        paystation_invoice_number: invoiceNumber,
      })
      .select()
      .single()

    if (purchaseError) {
      console.error('Purchase creation error:', purchaseError)
      return new Response(JSON.stringify({ error: 'Failed to create purchase' }), { status: 500, headers: corsHeaders })
    }

    // Initiate PayStation payment
    const merchantId = Deno.env.get('PAYSTATION_MERCHANT_ID')!
    const password = Deno.env.get('PAYSTATION_PASSWORD')!

    const formData = new FormData()
    formData.append('merchantId', merchantId)
    formData.append('password', password)
    formData.append('invoice_number', invoiceNumber)
    formData.append('currency', 'BDT')
    formData.append('payment_amount', String(plan.price_monthly))
    formData.append('pay_with_charge', '0')
    formData.append('reference', `plan:${plan.slug}|purchase:${purchase.id}`)
    formData.append('cust_name', profile?.full_name || 'Customer')
    formData.append('cust_phone', '01700000000')
    formData.append('cust_email', userEmail)
    formData.append('cust_address', 'Bangladesh')
    formData.append('callback_url', callbackUrl)
    formData.append('checkout_items', JSON.stringify({
      plan_name: plan.name,
      plan_slug: plan.slug,
      duration_days: plan.duration_days,
    }))
    formData.append('opt_a', purchase.id) // purchase ID for callback

    const psResponse = await fetch('https://api.paystation.com.bd/initiate-payment', {
      method: 'POST',
      body: formData,
    })

    const psResult = await psResponse.json()

    if (psResult.status_code !== '200' || psResult.status !== 'success') {
      console.error('PayStation error:', psResult)
      // Clean up purchase
      await adminClient.from('purchases').delete().eq('id', purchase.id)
      return new Response(JSON.stringify({ error: psResult.message || 'Payment initiation failed' }), { status: 400, headers: corsHeaders })
    }

    // Update purchase with payment URL
    await adminClient
      .from('purchases')
      .update({
        paystation_payment_url: psResult.payment_url,
        payment_session_id: psResult.payment_url,
      })
      .eq('id', purchase.id)

    return new Response(JSON.stringify({
      payment_url: psResult.payment_url,
      invoice_number: invoiceNumber,
      purchase_id: purchase.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: corsHeaders })
  }
})
