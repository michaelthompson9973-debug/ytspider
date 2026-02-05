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
    const baseUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://yt-crawl-buddy.lovable.app';
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

    const htmlContent = `
      <div style="font-family: 'Hind Siliguri', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #3B82F6;">🎉 টিম ইনভাইটেশন!</h1>
        <p>${inviterText} <strong>${shopName}</strong> শপে ${roleLabel} হিসেবে যোগদানের জন্য আমন্ত্রণ জানিয়েছেন।</p>
        
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">ইনভাইটেশনের বিবরণ</h3>
          <p><strong>শপের নাম:</strong> ${shopName}</p>
          <p><strong>আপনার রোল:</strong> ${roleLabel}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${acceptUrl}" style="background: #3B82F6; color: white; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            ইনভাইট গ্রহণ করুন
          </a>
        </div>

        <p style="color: #6B7280; font-size: 14px;">
          এই লিংক ৭ দিন পর্যন্ত বৈধ থাকবে।
        </p>
        
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
        <p style="color: #6B7280; font-size: 12px;">
          আপনি এই ইমেইল পেয়েছেন কারণ কেউ আপনাকে টিমে যোগ দেওয়ার জন্য আমন্ত্রণ জানিয়েছে। 
          যদি এটি আপনার জন্য না হয়, অনুগ্রহ করে উপেক্ষা করুন।
        </p>
      </div>
    `;

    await client.send({
      from: gmailUser,
      to: email,
      subject: `🎉 ${shopName} টিমে যোগ দিন!`,
      content: `${shopName} শপে ${roleLabel} হিসেবে যোগদানের জন্য আমন্ত্রণ। লিংক: ${acceptUrl}`,
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
