import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
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

    // Create Supabase client with service role for updating key status
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Create Supabase client with user auth
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get request body
    const { html, instruction } = await req.json();

    if (!html) {
      return new Response(
        JSON.stringify({ error: "HTML content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all active Gemini API keys
    const { data: activeKeys, error: apiError } = await supabaseAdmin
      .from("api_keys")
      .select("*")
      .eq("provider", "gemini")
      .eq("status", "active")
      .order("usage_count", { ascending: true });

    if (!apiError && activeKeys && activeKeys.length > 0) {
      return await handleRequest(req, supabaseAdmin, activeKeys, html, instruction);
    }

    // Try rate_limited keys that might have recovered
    const { data: recoveredKeys } = await supabaseAdmin
      .from("api_keys")
      .select("*")
      .eq("provider", "gemini")
      .eq("status", "rate_limited")
      .lt("rate_limited_until", new Date().toISOString());

    if (recoveredKeys && recoveredKeys.length > 0) {
      // Reset these keys to active
      for (const key of recoveredKeys) {
        await supabaseAdmin
          .from("api_keys")
          .update({ status: "active", rate_limited_until: null })
          .eq("id", key.id);
      }
      return await handleRequest(req, supabaseAdmin, recoveredKeys, html, instruction);
    }

    // Last resort: try any rate_limited keys (they might work now)
    const { data: rateLimitedKeys } = await supabaseAdmin
      .from("api_keys")
      .select("*")
      .eq("provider", "gemini")
      .eq("status", "rate_limited")
      .order("rate_limited_until", { ascending: true });

    if (rateLimitedKeys && rateLimitedKeys.length > 0) {
      return await handleRequest(req, supabaseAdmin, rateLimitedKeys, html, instruction);
    }

    // Check if there are any keys at all (including invalid ones)
    const { data: allKeys } = await supabaseAdmin
      .from("api_keys")
      .select("*")
      .eq("provider", "gemini");

    if (!allKeys || allKeys.length === 0) {
      return new Response(
        JSON.stringify({ error: "No API keys configured. Please add them in API Settings." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "All API keys are invalid. Please add valid keys in API Settings." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleRequest(
  req: Request,
  supabaseAdmin: any,
  apiKeys: any[],
  html: string,
  instruction?: string
) {
  // Build prompt
  const systemPrompt = `You are an expert HTML/CSS developer. Your task is to enhance the given HTML code to make it more visually appealing, responsive, and modern.

Guidelines:
- Use Tailwind CSS classes for styling
- Make the design responsive (mobile-first)
- Improve typography and spacing
- Add subtle animations if appropriate
- Keep the original structure and content
- Output ONLY the enhanced HTML code, no explanations
- Do not wrap in markdown code blocks`;

  const userPrompt = instruction
    ? `Enhance this HTML code with the following instruction: "${instruction}"\n\nHTML:\n${html}`
    : `Enhance this HTML code to make it more visually appealing and modern:\n\n${html}`;

  // Try each API key until one works
  for (const apiKey of apiKeys) {
    try {
      console.log(`Trying API key: ${apiKey.id}`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.key_value}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: systemPrompt },
                  { text: userPrompt }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8192,
            }
          }),
        }
      );

      // Check for rate limiting
      if (response.status === 429) {
        console.log(`API key ${apiKey.id} is rate limited`);
        
        // Mark this key as rate limited
        const rateLimitedUntil = new Date();
        rateLimitedUntil.setMinutes(rateLimitedUntil.getMinutes() + 60); // 1 hour cooldown
        
        await supabaseAdmin
          .from("api_keys")
          .update({ 
            status: "rate_limited", 
            rate_limited_until: rateLimitedUntil.toISOString() 
          })
          .eq("id", apiKey.id);
        
        // Continue to next key
        continue;
      }

      // Check for invalid key
      if (response.status === 400 || response.status === 401 || response.status === 403) {
        console.log(`API key ${apiKey.id} is invalid`);
        
        await supabaseAdmin
          .from("api_keys")
          .update({ status: "invalid" })
          .eq("id", apiKey.id);
        
        // Continue to next key
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error:", errorText);
        continue;
      }

      // Success! Update usage stats
      await supabaseAdmin
        .from("api_keys")
        .update({ 
          usage_count: apiKey.usage_count + 1,
          last_used_at: new Date().toISOString()
        })
        .eq("id", apiKey.id);

      const result = await response.json();
      
      // Extract text from Gemini response
      let enhancedHtml = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      // Clean up response - remove markdown code blocks if present
      enhancedHtml = enhancedHtml.replace(/^```html?\n?/i, "").replace(/\n?```$/i, "").trim();

      return new Response(
        JSON.stringify({ enhancedHtml }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (error) {
      console.error(`Error with API key ${apiKey.id}:`, error);
      continue;
    }
  }

  // All keys failed
  return new Response(
    JSON.stringify({ error: "All API keys failed. Please check your API keys or try again later." }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
