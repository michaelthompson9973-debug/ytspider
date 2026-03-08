import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, verifyAuth, logRequest, unauthorizedResponse, checkRateLimit, getClientIp, rateLimitedResponse } from "../_shared/auth.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

interface ProvisionShopRequest {
  shopName: string;
  slug: string;
  shopType?: 'physical' | 'digital';
  ownerEmail: string;
  ownerPassword?: string;
  planId: string;
  durationDays: number;
  sendCredentials: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Rate limiting
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(ip, { windowMs: 60000, maxRequests: 10 });
  if (!rateLimit.allowed) {
    return rateLimitedResponse();
  }

  // Verify admin auth
  const auth = await verifyAuth(req);
  if (!auth.authenticated || !auth.isAdmin) {
    logRequest('provision-shop', req, auth, 'unauthorized');
    return unauthorizedResponse('Admin access required');
  }

  try {
    const body: ProvisionShopRequest = await req.json();
    const { shopName, slug, shopType = 'physical', ownerEmail, ownerPassword, planId, durationDays, sendCredentials } = body;

    // Validate required fields
    if (!shopName || !slug || !ownerEmail || !planId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: shopName, slug, ownerEmail, planId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ownerEmail)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if slug already exists
    const { data: existingShop } = await supabaseAdmin
      .from('shops')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingShop) {
      return new Response(
        JSON.stringify({ error: 'Shop slug already exists' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get plan details
    const { data: plan, error: planError } = await supabaseAdmin
      .from('pricing_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find or create user
    let userId: string;
    let isNewUser = false;
    let generatedPassword: string | null = null;

    // Check if user exists in profiles
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', ownerEmail.toLowerCase())
      .single();

    if (existingProfile) {
      userId = existingProfile.id;
      console.log(`Found existing user: ${userId}`);
    } else {
      // Create new user
      isNewUser = true;
      generatedPassword = generateSecurePassword(16);

      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: ownerEmail.toLowerCase(),
        password: generatedPassword,
        email_confirm: true,
        user_metadata: {
          provisioned_by: auth.userId,
          provisioned_at: new Date().toISOString()
        }
      });

      if (createUserError || !newUser.user) {
        console.error('Error creating user:', createUserError);
        return new Response(
          JSON.stringify({ error: `Failed to create user: ${createUserError?.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = newUser.user.id;
      console.log(`Created new user: ${userId}`);
    }

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (durationDays || plan.duration_days || 30));

    // Determine plan enum value based on plan slug
    let planEnum = 'free';
    if (plan.slug === 'pro' || plan.slug === 'professional') {
      planEnum = 'pro';
    } else if (plan.slug === 'enterprise' || plan.slug === 'business') {
      planEnum = 'enterprise';
    }

    // Create shop
    const { data: shop, error: shopError } = await supabaseAdmin
      .from('shops')
      .insert({
        name: shopName,
        slug: slug.toLowerCase(),
        owner_id: userId,
        plan: planEnum,
        shop_type: shopType,
        onboarding_completed: true,
        is_active: true,
        expires_at: expiresAt.toISOString(),
        settings: {}
      })
      .select()
      .single();

    if (shopError || !shop) {
      console.error('Error creating shop:', shopError);
      return new Response(
        JSON.stringify({ error: `Failed to create shop: ${shopError?.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Created shop: ${shop.id}`);

    // Create shop_members entry with owner role
    const { error: memberError } = await supabaseAdmin
      .from('shop_members')
      .insert({
        shop_id: shop.id,
        user_id: userId,
        role: 'owner',
        invited_by: auth.userId,
        accepted_at: new Date().toISOString()
      });

    if (memberError) {
      console.error('Error creating shop member:', memberError);
      // Continue anyway, shop is created
    }

    // Create subscription entry
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        shop_id: shop.id,
        user_id: userId,
        plan_id: planId,
        starts_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        status: 'active',
        amount_paid: plan.price_monthly || 0,
        currency: plan.currency || 'BDT',
        payment_provider: 'manual'
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError);
      // Continue anyway
    }

    // Update shop with subscription_id
    if (subscription) {
      await supabaseAdmin
        .from('shops')
        .update({ subscription_id: subscription.id })
        .eq('id', shop.id);
    }

    // Send welcome email if requested
    let emailSent = false;
    if (sendCredentials) {
      try {
        await sendWelcomeEmail({
          to: ownerEmail,
          shopName,
          isNewUser,
          password: generatedPassword,
          planName: plan.name_en || plan.name,
          expiresAt: expiresAt.toISOString()
        });
        emailSent = true;
        console.log(`Welcome email sent to ${ownerEmail}`);
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't fail the whole operation
      }
    }

    logRequest('provision-shop', req, auth, 'success', `Shop ${shop.id} created for ${ownerEmail}`);

    return new Response(
      JSON.stringify({
        success: true,
        shop: {
          id: shop.id,
          name: shop.name,
          slug: shop.slug
        },
        user: {
          id: userId,
          email: ownerEmail,
          isNewUser
        },
        subscription: subscription ? {
          id: subscription.id,
          expires_at: subscription.expires_at
        } : null,
        emailSent
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Provision shop error:', error);
    logRequest('provision-shop', req, auth, 'error', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Generate secure random password
function generateSecurePassword(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

// Send welcome email via Gmail SMTP
async function sendWelcomeEmail(params: {
  to: string;
  shopName: string;
  isNewUser: boolean;
  password: string | null;
  planName: string;
  expiresAt: string;
}) {
  const gmailUser = Deno.env.get('GMAIL_USER');
  const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD');

  if (!gmailUser || !gmailPassword) {
    throw new Error('Gmail credentials not configured');
  }

  const client = new SMTPClient({
    connection: {
      hostname: "smtp.gmail.com",
      port: 465,
      tls: true,
      auth: {
        username: gmailUser,
        password: gmailPassword,
      },
    },
  });

  const expiryDate = new Date(params.expiresAt).toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const loginUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/auth`;

  let htmlContent = `
    <div style="font-family: 'Hind Siliguri', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #3B82F6;">🎉 স্বাগতম ${params.shopName}!</h1>
      <p>আপনার নতুন শপ সফলভাবে তৈরি হয়েছে।</p>
      
      <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">শপের তথ্য</h3>
        <p><strong>শপের নাম:</strong> ${params.shopName}</p>
        <p><strong>প্ল্যান:</strong> ${params.planName}</p>
        <p><strong>মেয়াদ শেষ:</strong> ${expiryDate}</p>
      </div>
  `;

  if (params.isNewUser && params.password) {
    htmlContent += `
      <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
        <h3 style="margin-top: 0; color: #92400E;">🔐 লগইন তথ্য</h3>
        <p><strong>ইমেইল:</strong> ${params.to}</p>
        <p><strong>পাসওয়ার্ড:</strong> <code style="background: #FDE68A; padding: 4px 8px; border-radius: 4px;">${params.password}</code></p>
        <p style="color: #92400E; font-size: 14px;">⚠️ অনুগ্রহ করে লগইন করে পাসওয়ার্ড পরিবর্তন করুন।</p>
      </div>
    `;
  }

  htmlContent += `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" style="background: #3B82F6; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">
          লগইন করুন
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
      <p style="color: #6B7280; font-size: 14px;">
        এই ইমেইল Ytspider Platform থেকে স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে।
      </p>
    </div>
  `;

  await client.send({
    from: gmailUser,
    to: params.to,
    subject: `🎉 ${params.shopName} - আপনার শপ তৈরি হয়েছে!`,
    content: "আপনার শপ তৈরি হয়েছে। বিস্তারিত দেখতে ইমেইল HTML ভিউ ব্যবহার করুন।",
    html: htmlContent,
  });

  await client.close();
}
