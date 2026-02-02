import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConnectPageRequest {
  page_id: string;
  page_name: string;
  page_access_token: string;
  category?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the user is authenticated and is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Get Facebook App credentials
    const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID');
    const FACEBOOK_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET');

    if (action === 'get-app-id') {
      // Return App ID for SDK initialization (this is safe to expose)
      return new Response(
        JSON.stringify({ app_id: FACEBOOK_APP_ID || null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'exchange-token') {
      // Exchange short-lived token for long-lived token
      if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
        return new Response(
          JSON.stringify({ error: 'Facebook App credentials not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json() as { short_lived_token: string };
      const shortLivedToken = body.short_lived_token;

      if (!shortLivedToken) {
        return new Response(
          JSON.stringify({ error: 'short_lived_token is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Exchange token via Facebook Graph API
      const exchangeUrl = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&fb_exchange_token=${shortLivedToken}`;
      
      const fbResponse = await fetch(exchangeUrl);
      const fbData = await fbResponse.json();

      if (fbData.error) {
        console.error('Facebook token exchange error:', fbData.error);
        return new Response(
          JSON.stringify({ error: fbData.error.message || 'Token exchange failed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Return long-lived token with expiry
      return new Response(
        JSON.stringify({
          access_token: fbData.access_token,
          expires_in: fbData.expires_in || 5184000, // Default 60 days
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'connect-page' && req.method === 'POST') {
      const body = await req.json() as ConnectPageRequest;
      const { page_id, page_name, page_access_token } = body;

      if (!page_id || !page_name || !page_access_token) {
        return new Response(
          JSON.stringify({ error: 'page_id, page_name, and page_access_token are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if page already exists
      const { data: existing } = await supabase
        .from('messenger_connections')
        .select('id')
        .eq('page_id', page_id)
        .single();

      if (existing) {
        // Update existing connection
        const { error: updateError } = await supabase
          .from('messenger_connections')
          .update({
            page_name,
            page_access_token,
            app_id: FACEBOOK_APP_ID,
            is_active: true,
            token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Error updating connection:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to update connection' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Connection updated', id: existing.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create new connection
      const { data: newConnection, error: insertError } = await supabase
        .from('messenger_connections')
        .insert({
          page_id,
          page_name,
          page_access_token,
          app_id: FACEBOOK_APP_ID,
          is_active: true,
          token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Error creating connection:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create connection' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Subscribe to webhook (optional - you may need to do this manually in Meta Developer Console)
      // This would require additional API calls to Facebook

      return new Response(
        JSON.stringify({ success: true, message: 'Page connected', id: newConnection.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in facebook-pages function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
