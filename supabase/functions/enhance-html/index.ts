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

    // Create Supabase client
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

    // Get Gemini API key from database
    const { data: apiSetting, error: apiError } = await supabase
      .from("api_settings")
      .select("key_value")
      .eq("key_name", "GEMINI_API_KEY")
      .single();

    if (apiError || !apiSetting?.key_value) {
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured. Please add it in API Settings." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiApiKey = apiSetting.key_value;

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

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to enhance HTML. Please check your API key." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
