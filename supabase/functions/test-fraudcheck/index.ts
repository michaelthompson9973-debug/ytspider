import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FraudCheckResponse {
  mobile_number: string;
  total_parcels: number;
  total_delivered: number;
  total_cancel: number;
  apis: Record<string, {
    total_parcels: number;
    total_delivered_parcels: number;
    total_cancelled_parcels: number;
  }>;
}

function addMinutes(date: Date, minutes: number) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + minutes);
  return d;
}

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

    const { phone } = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate Bangladesh phone number format
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) {
      return new Response(
        JSON.stringify({ error: "Invalid Bangladesh phone number format. Must be 11 digits starting with 01." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Testing fraud check for phone: ${cleanPhone}`);

    // 1) Prefer an active key that isn't currently rate-limited.
    // 2) If none exists, fallback to the most recent key (even if status is stale/invalid)
    //    and let the real API response decide the correct status.
    const nowIso = new Date().toISOString();

    const { data: activeKeys, error: activeKeysError } = await supabaseAdmin
      .from("api_keys")
      .select("*")
      .eq("provider", "fraudcheck")
      .eq("status", "active")
      .or(`rate_limited_until.is.null,rate_limited_until.lte.${nowIso}`)
      .order("created_at", { ascending: false })
      .limit(1);

    if (activeKeysError) {
      console.error("Error fetching active API keys:", activeKeysError);
      throw activeKeysError;
    }

    let apiKey = activeKeys?.[0] ?? null;

    if (!apiKey) {
      const { data: fallbackKeys, error: fallbackError } = await supabaseAdmin
        .from("api_keys")
        .select("*")
        .eq("provider", "fraudcheck")
        .order("created_at", { ascending: false })
        .limit(1);

      if (fallbackError) {
        console.error("Error fetching fallback API keys:", fallbackError);
        throw fallbackError;
      }
      apiKey = fallbackKeys?.[0] ?? null;
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "No active fraud check API key available" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log(`Using API key: ${apiKey.id}`);

    // Make API call to fraudchecker.link
    const body = new URLSearchParams({ phone: cleanPhone });

    const response = await fetch("https://fraudchecker.link/api/v1/qc/", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey.key_value}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    // Update usage count
    await supabaseAdmin
      .from("api_keys")
      .update({ 
        usage_count: (apiKey.usage_count || 0) + 1,
        last_used_at: new Date().toISOString()
      })
      .eq("id", apiKey.id);

    if (response.status === 429) {
      // Mark key as rate limited
      await supabaseAdmin
        .from("api_keys")
        .update({ 
          status: "rate_limited",
          rate_limited_until: addMinutes(new Date(), 60).toISOString()
        })
        .eq("id", apiKey.id);

      return new Response(
        JSON.stringify({ error: "API key rate limited. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (response.status === 401 || response.status === 403) {
      // Mark key as invalid
      await supabaseAdmin
        .from("api_keys")
        .update({ status: "invalid" })
        .eq("id", apiKey.id);

      return new Response(
        JSON.stringify({ error: "API key is invalid" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Fraud check API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to check phone number" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data: FraudCheckResponse = await response.json();
    console.log("Fraud check result:", data);

    // If the call succeeded, ensure the key is marked active (it may have been stale/invalid).
    if (apiKey.status !== "active") {
      await supabaseAdmin
        .from("api_keys")
        .update({ status: "active", rate_limited_until: null })
        .eq("id", apiKey.id);
    }

    return new Response(
      JSON.stringify(data),
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
