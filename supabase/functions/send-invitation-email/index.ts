import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/auth.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

interface SendInvitationRequest {
  email: string;
  shopName: string;
  role: string;
  token: string;
  inviterName?: string;
}

function encodeHeaderB64(value: string): string {
  // RFC 2047 encoded-word (Base64) to keep Gmail happy with non-ASCII subjects
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const b64 = btoa(binary);
  return `=?UTF-8?B?${b64}?=`;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: SendInvitationRequest = await req.json();
    const { email, shopName, role, token, inviterName } = body;

    // Validate required fields
    if (!email || !shopName || !role || !token) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, shopName, role, token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send email via Gmail SMTP
    const gmailUser = Deno.env.get('GMAIL_USER');
    const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD');

    if (!gmailUser || !gmailPassword) {
      console.error('Gmail credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    // Build accept invite URL
    // Prefer the caller's origin so the link always matches the environment (preview vs published)
    const origin = req.headers.get('origin') || 'https://yt-crawl-buddy.lovable.app';
    const baseUrl = origin.replace(/\/$/, '');
    const acceptUrl = `${baseUrl}/accept-invite?token=${token}`;

    const roleLabels: Record<string, string> = {
      owner: 'Owner (মালিক)',
      admin: 'Admin (অ্যাডমিন)',
      manager: 'Manager (ম্যানেজার)',
      editor: 'Editor (এডিটর)',
      support: 'Support (সাপোর্ট)',
      viewer: 'Viewer (ভিউয়ার)',
    };

    const roleLabel = roleLabels[role] || role;
    const inviterText = inviterName ? `${inviterName} আপনাকে` : 'আপনাকে';

    const htmlContent = `<!doctype html>
<html lang="bn">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Team invitation</title>
  </head>
  <body style="margin:0;padding:0;background-color:#ffffff;">
    <div style="font-family: 'Hind Siliguri', 'Anek Bangla', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #3B82F6; margin: 0 0 12px 0;">🎉 টিম ইনভাইটেশন!</h1>
      <p style="margin: 0 0 16px 0; line-height: 1.6;">${inviterText} <strong>${shopName}</strong> শপে ${roleLabel} হিসেবে যোগদানের জন্য আমন্ত্রণ জানিয়েছেন।</p>

      <div style="background: #F3F4F6; padding: 16px; border-radius: 10px; margin: 16px 0;">
        <h3 style="margin: 0 0 10px 0;">ইনভাইটেশনের বিবরণ</h3>
        <p style="margin: 0 0 6px 0;"><strong>শপের নাম:</strong> ${shopName}</p>
        <p style="margin: 0;"><strong>আপনার রোল:</strong> ${roleLabel}</p>
      </div>

      <div style="text-align: center; margin: 22px 0;">
        <a href="${acceptUrl}" style="background: #3B82F6; color: white; padding: 14px 36px; text-decoration: none; border-radius: 10px; font-weight: 700; display: inline-block;">
          ইনভাইট গ্রহণ করুন
        </a>
      </div>

      <p style="color: #6B7280; font-size: 14px; margin: 0 0 10px 0;">এই লিংক ৭ দিন পর্যন্ত বৈধ থাকবে।</p>

      <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
      <p style="color: #6B7280; font-size: 12px; margin: 0; line-height: 1.6;">
        আপনি এই ইমেইল পেয়েছেন কারণ কেউ আপনাকে টিমে যোগ দেওয়ার জন্য আমন্ত্রণ জানিয়েছে। যদি এটি আপনার জন্য না হয়, অনুগ্রহ করে উপেক্ষা করুন।
      </p>
    </div>
  </body>
</html>`;

    const subjectText = `🎉 ${shopName} টিমে যোগ দিন!`;

    await client.send({
      from: `YTSpider <${gmailUser}>`,
      to: email,
      subject: encodeHeaderB64(subjectText),
      content: 'auto',
      html: htmlContent,
    });

    await client.close();

    console.log(`Invitation email sent to ${email} for shop ${shopName}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Invitation email sent' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Send invitation email error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
