import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, verifyAuth, unauthorizedResponse, logRequest, checkRateLimit, getClientIp, rateLimitedResponse } from "../_shared/auth.ts";

interface PathaoAuthRequest {
  client_id: string;
  client_secret: string;
  username: string;
  password: string;
  grant_type?: string;
}

interface PathaoTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const ip = getClientIp(req);
  const rateLimitResult = checkRateLimit(ip, { windowMs: 60000, maxRequests: 10 });
  if (!rateLimitResult.allowed) {
    return rateLimitedResponse();
  }

  try {
    const auth = await verifyAuth(req);
    if (!auth.authenticated || (!auth.isAdmin && !auth.isServiceRole)) {
      logRequest('pathao-auth', req, auth, 'unauthorized');
      return unauthorizedResponse('Admin access required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch Pathao credentials from DB
    const { data: credentials, error: credError } = await supabase
      .from('courier_credentials')
      .select('*')
      .eq('provider', 'pathao')
      .eq('is_active', true);

    if (credError || !credentials || credentials.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No Pathao credentials found. Please add credentials first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get required credentials
    const clientId = credentials.find(c => c.credential_type === 'client_id')?.credential_value;
    const clientSecret = credentials.find(c => c.credential_type === 'client_secret')?.credential_value;

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing Pathao credentials. Required: client_id, client_secret',
          missing: {
            client_id: !clientId,
            client_secret: !clientSecret,
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Pathao External Login endpoint (simplified - no username/password needed)
    const tokenResponse = await fetch('https://api-hermes.pathao.com/aladdin/api/v1/external/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log('Pathao token response:', { ...tokenData, access_token: tokenData.access_token ? '***' : null });

    if (!tokenData.access_token) {
      return new Response(
        JSON.stringify({ error: tokenData.message || 'Failed to get Pathao token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate expiry time (subtract 5 minutes buffer)
    const expiresAt = new Date(Date.now() + (tokenData.expires_in - 300) * 1000);

    // Update or create access_token credential
    const existingToken = credentials.find(c => c.credential_type === 'access_token');

    if (existingToken) {
      await supabase
        .from('courier_credentials')
        .update({
          access_token: tokenData.access_token,
          token_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingToken.id);
    } else {
      await supabase
        .from('courier_credentials')
        .insert({
          provider: 'pathao',
          credential_type: 'access_token',
          credential_value: 'oauth_token',
          label: 'OAuth Access Token',
          is_active: true,
          access_token: tokenData.access_token,
          token_expires_at: expiresAt.toISOString(),
        });
    }

    // Store refresh token if provided
    if (tokenData.refresh_token) {
      const existingRefresh = credentials.find(c => c.credential_type === 'refresh_token');
      if (existingRefresh) {
        await supabase
          .from('courier_credentials')
          .update({
            credential_value: tokenData.refresh_token,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingRefresh.id);
      } else {
        await supabase
          .from('courier_credentials')
          .insert({
            provider: 'pathao',
            credential_type: 'refresh_token',
            credential_value: tokenData.refresh_token,
            label: 'OAuth Refresh Token',
            is_active: true,
          });
      }
    }

    logRequest('pathao-auth', req, auth, 'success', 'Token refreshed');

    return new Response(
      JSON.stringify({
        success: true,
        expires_at: expiresAt.toISOString(),
        token_type: tokenData.token_type,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in pathao-auth:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
