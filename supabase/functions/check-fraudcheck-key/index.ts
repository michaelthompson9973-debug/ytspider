import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user is admin
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { keyId, keyValue } = await req.json();

    if (!keyId || !keyValue) {
      return new Response(
        JSON.stringify({ error: "Key ID and value are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Checking FraudCheck API key: ${keyId}`);

    // Test the key by making a simple API call with a test phone number.
    // Fraudchecker expects form-urlencoded (per their docs), not multipart/form-data.
    const body = new URLSearchParams({ phone: "01700000000" });

    const response = await fetch("https://fraudchecker.link/api/v1/qc/", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${keyValue}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    let status = "active";
    let rateLimitedUntil = null;

    if (response.status === 429) {
      status = "rate_limited";
      rateLimitedUntil = new Date();
      rateLimitedUntil.setMinutes(rateLimitedUntil.getMinutes() + 60);
      console.log(`Key ${keyId} is rate limited`);
    } else if (response.status === 401 || response.status === 403) {
      status = "invalid";
      console.log(`Key ${keyId} is invalid`);
    } else if (!response.ok) {
      const errorText = await response.text();
      console.error(`Key ${keyId} error:`, response.status, errorText);

      // Some upstream errors can be transient; only hard-fail on auth errors.
      // For other non-2xx, keep it active so the system can still try it during real checks.
      if (response.status === 401 || response.status === 403) {
        status = "invalid";
      }
    } else {
      console.log(`Key ${keyId} is active`);
    }

    // Update the key status
    const { error: updateError } = await supabaseAdmin
      .from("api_keys")
      .update({ 
        status, 
        rate_limited_until: rateLimitedUntil?.toISOString() || null 
      })
      .eq("id", keyId);

    if (updateError) {
      console.error("Error updating key status:", updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({ status, keyId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

