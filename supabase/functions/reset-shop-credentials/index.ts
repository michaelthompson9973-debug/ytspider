import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, verifyAuth, logRequest, unauthorizedResponse, checkRateLimit, getClientIp, rateLimitedResponse } from "../_shared/auth.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

interface ResetCredentialsRequest {
  userId: string;
  sendEmail: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(ip, { windowMs: 60000, maxRequests: 10 });
  if (!rateLimit.allowed) return rateLimitedResponse();

  const auth = await verifyAuth(req);
  if (!auth.authenticated || (!auth.isAdmin && !auth.isServiceRole)) {
    logRequest('reset-shop-credentials', req, auth, 'unauthorized');
    return unauthorizedResponse('Admin access required');
  }

  try {
    const { userId, sendEmail }: ResetCredentialsRequest = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get user info
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (!profile?.email) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Block resetting platform admin passwords
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (roleData?.role === 'admin' || roleData?.role === 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Cannot reset platform admin credentials' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate new password
    const newPassword = generateSecurePassword(16);

    // Update user password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUser(userId, {
      password: newPassword,
    });

    if (updateError) {
      console.error('Error updating password:', updateError);
      return new Response(
        JSON.stringify({ error: `Failed to reset password: ${updateError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Optionally send email
    let emailSent = false;
    if (sendEmail) {
      try {
        await sendResetEmail({
          to: profile.email,
          name: profile.full_name || profile.email,
          newPassword,
        });
        emailSent = true;
      } catch (emailError) {
        console.error('Error sending reset email:', emailError);
      }
    }

    logRequest('reset-shop-credentials', req, auth, 'success', `Password reset for ${profile.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        email: profile.email,
        password: newPassword,
        emailSent,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Reset credentials error:', error);
    logRequest('reset-shop-credentials', req, auth, 'error', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateSecurePassword(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

async function sendResetEmail(params: { to: string; name: string; newPassword: string }) {
  const gmailUser = Deno.env.get('GMAIL_USER');
  const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD');
  if (!gmailUser || !gmailPassword) throw new Error('Gmail credentials not configured');

  const client = new SMTPClient({
    connection: {
      hostname: "smtp.gmail.com",
      port: 465,
      tls: true,
      auth: { username: gmailUser, password: gmailPassword },
    },
  });

  const subjectB64 = btoa(unescape(encodeURIComponent(`🔐 আপনার পাসওয়ার্ড রিসেট হয়েছে`)));

  const htmlContent = `
    <div style="font-family: 'Hind Siliguri', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #3B82F6;">🔐 পাসওয়ার্ড রিসেট</h1>
      <p>প্রিয় ${params.name},</p>
      <p>আপনার অ্যাকাউন্টের পাসওয়ার্ড রিসেট করা হয়েছে।</p>
      
      <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
        <h3 style="margin-top: 0; color: #92400E;">নতুন লগইন তথ্য</h3>
        <p><strong>ইমেইল:</strong> ${params.to}</p>
        <p><strong>নতুন পাসওয়ার্ড:</strong> <code style="background: #FDE68A; padding: 4px 8px; border-radius: 4px; font-size: 16px;">${params.newPassword}</code></p>
        <p style="color: #92400E; font-size: 14px;">⚠️ লগইন করে অবিলম্বে পাসওয়ার্ড পরিবর্তন করুন।</p>
      </div>
      
      <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
      <p style="color: #6B7280; font-size: 14px;">এই ইমেইল Ytspider Platform থেকে স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে।</p>
    </div>
  `;

  await client.send({
    from: gmailUser,
    to: params.to,
    subject: `=?UTF-8?B?${subjectB64}?=`,
    content: "আপনার পাসওয়ার্ড রিসেট হয়েছে।",
    html: htmlContent,
  });

  await client.close();
}
