import { corsHeaders } from "../_shared/auth.ts";

interface SendInvitationRequest {
  email: string;
  shopName: string;
  role: string;
  token: string;
  inviterName?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate token by making a simple request
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': authHeader,
        'apikey': supabaseKey,
      },
    });
    
    if (!userRes.ok) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: SendInvitationRequest = await req.json();
    const { email, shopName, role, token, inviterName } = body;

    if (!email || !shopName || !role || !token) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const gmailUser = Deno.env.get('GMAIL_USER');
    const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD');

    if (!gmailUser || !gmailPassword) {
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const origin = req.headers.get('origin') || 'https://yt-crawl-buddy.lovable.app';
    const acceptUrl = `${origin.replace(/\/$/, '')}/accept-invite?token=${token}`;

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
    const subject = `🎉 ${shopName} টিমে যোগ দিন!`;

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:20px;font-family:Arial,sans-serif;background:#f9fafb;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
<h1 style="color:#3B82F6;margin:0 0 20px;">🎉 টিম ইনভাইটেশন!</h1>
<p style="line-height:1.8;color:#374151;">${inviterText} <strong>${shopName}</strong> শপে ${roleLabel} হিসেবে যোগদানের জন্য আমন্ত্রণ জানিয়েছেন।</p>
<div style="background:#F3F4F6;border-radius:10px;padding:20px;margin:24px 0;">
<h3 style="margin:0 0 12px;color:#1F2937;">ইনভাইটেশনের বিবরণ</h3>
<p style="margin:0 0 8px;color:#4B5563;"><strong>শপের নাম:</strong> ${shopName}</p>
<p style="margin:0;color:#4B5563;"><strong>আপনার রোল:</strong> ${roleLabel}</p>
</div>
<div style="text-align:center;padding:28px 0;">
<a href="${acceptUrl}" style="background:#3B82F6;color:#fff;padding:16px 40px;text-decoration:none;border-radius:10px;font-weight:700;display:inline-block;">ইনভাইট গ্রহণ করুন</a>
</div>
<p style="color:#6B7280;font-size:14px;">এই লিংক ৭ দিন পর্যন্ত বৈধ থাকবে।</p>
<hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;">
<p style="color:#9CA3AF;font-size:12px;">আপনি এই ইমেইল পেয়েছেন কারণ কেউ আপনাকে টিমে যোগ দেওয়ার জন্য আমন্ত্রণ জানিয়েছে।</p>
</div>
</body></html>`;

    const text = `${shopName} শপে ${roleLabel} হিসেবে যোগদানের আমন্ত্রণ। লিংক: ${acceptUrl}`;

    // Send email via Gmail SMTP
    const result = await sendEmail(gmailUser, gmailPassword, email, subject, text, html);
    
    if (!result.success) {
      throw new Error(result.error);
    }

    console.log(`Invitation email sent to ${email}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal error';
    console.error('Email error:', error);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendEmail(
  user: string,
  pass: string,
  to: string,
  subject: string,
  text: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  const conn = await Deno.connectTls({ hostname: "smtp.gmail.com", port: 465 });
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  const read = async () => {
    const buf = new Uint8Array(4096);
    const n = await conn.read(buf);
    return n ? dec.decode(buf.subarray(0, n)) : '';
  };

  const write = async (s: string) => {
    await conn.write(enc.encode(s + '\r\n'));
  };

  try {
    await read();
    await write('EHLO localhost');
    await read();
    await write('AUTH LOGIN');
    await read();
    await write(btoa(user));
    await read();
    await write(btoa(pass));
    const auth = await read();
    if (!auth.includes('235')) {
      conn.close();
      return { success: false, error: 'Auth failed' };
    }
    await write(`MAIL FROM:<${user}>`);
    await read();
    await write(`RCPT TO:<${to}>`);
    await read();
    await write('DATA');
    await read();

    const b64 = (s: string) => btoa(unescape(encodeURIComponent(s)));
    const boundary = `b${Date.now()}`;
    const msg = [
      `From: YTSpider <${user}>`,
      `To: ${to}`,
      `Subject: =?UTF-8?B?${b64(subject)}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      b64(text),
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      b64(html),
      ``,
      `--${boundary}--`,
    ].join('\r\n');

    await write(msg + '\r\n.');
    await read();
    await write('QUIT');
    conn.close();
    return { success: true };
  } catch (e) {
    conn.close();
    return { success: false, error: e instanceof Error ? e.message : 'SMTP error' };
  }
}