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
  // Build prompt - Multi-functional Bengali E-commerce System Instruction
  const systemPrompt = `You are an expert Bengali e-commerce landing page developer. Your task is to enhance HTML sections to be more visually appealing, responsive, and conversion-optimized.

## SYSTEM CONTEXT
- Bengali e-commerce landing page builder for Bangladesh market
- Primary audience: Bangladeshi customers (80%+ mobile traffic)
- Products: Health, beauty, food, lifestyle products
- Payment: Cash on Delivery (COD) system
- Goal: Maximize conversions through compelling design

## THEME SYSTEM (MANDATORY - Always use these)

**CSS Variables:**
- var(--theme-primary) → Primary brand color
- var(--theme-bg) → Background color
- var(--theme-radius) → Border radius
- var(--theme-btn-radius) → Button border radius
- var(--theme-container) → Container max-width

**Tailwind Classes:**
- text-primary, bg-primary, border-primary → Primary color utilities
- rounded-theme → Theme-aware border radius

**Typography Classes (CRITICAL):**
- font-heading → Headings (Hind Siliguri - Bengali optimized)
- font-body → Body text (Anek Bangla - Bengali optimized)
- font-button → Buttons/CTAs (Inter - clean, modern)
- font-digit → Numbers, prices, timers (Poppins - legible digits)

## SECTION PATTERNS & BEST PRACTICES

**Hero Section:**
- Large heading: font-heading text-3xl md:text-5xl font-bold
- Subheading: font-body text-lg md:text-xl text-muted-foreground
- CTA button: bg-primary font-button text-lg py-3 px-8 rounded-theme
- Hero image/video with proper aspect ratio

**CTA / Order Section:**
- Urgency: "সীমিত স্টক!", countdown timers, "অফার শেষ হচ্ছে!"
- Price display: font-digit text-2xl md:text-4xl font-bold
- Discount badge: bg-red-500 text-white px-2 py-1 rounded
- Clear button: "এখনই অর্ডার করুন", "অর্ডার করতে ক্লিক করুন"

**Features / Benefits Grid:**
- Grid layout: grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6
- Icon + text cards with subtle shadows
- Checkmarks (✅) or custom icons
- Short, benefit-focused copy

**Testimonial / Social Proof:**
- Customer photo (rounded-full), name, location
- Star ratings: ⭐⭐⭐⭐⭐ or SVG stars
- Quote with quotation marks
- "১০০০+ সন্তুষ্ট গ্রাহক" badges

**FAQ Section:**
- Accordion-style expandable items
- Question in font-heading font-medium
- Answer in font-body text-muted-foreground

**Trust Badges:**
- "১০০% মানি-ব্যাক গ্যারান্টি"
- "সার্টিফাইড অরিজিনাল প্রোডাক্ট"
- "সারাদেশে ফ্রি ডেলিভারি"
- Icons: 🛡️ ✅ 🚚 💯

## TAILWIND CSS GUIDELINES

**MUST USE (Mobile-First):**
- Base → sm: → md: → lg: → xl: breakpoints
- Flexbox: flex flex-col md:flex-row items-center justify-center gap-*
- Grid: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-*
- Spacing: p-4 md:p-6 lg:p-8, space-y-4 md:space-y-6
- Colors: bg-white, bg-gray-50, text-gray-900, text-gray-600
- Shadows: shadow-sm, shadow-md, shadow-lg
- Transitions: transition-all duration-300 hover:*
- Borders: border border-gray-200 rounded-lg

**AVOID:**
- Inline styles (use Tailwind instead)
- Fixed pixel widths (use responsive units)
- Complex nested CSS
- !important declarations

## BENGALI CONTENT RULES (CRITICAL)

1. **Text Preservation:** Never modify Bengali text content
2. **Bengali Numbers:** Keep ১২৩৪৫৬৭৮৯০ as-is
3. **English Numbers:** Wrap in <span class="font-digit">1234</span>
4. **Prices:** <span class="font-digit">৳999</span> or <span class="font-digit text-2xl font-bold">৳1,299</span>
5. **Emojis:** Use freely - 🔥 ⭐ ✅ 🎁 📞 🚚 💯 🛡️ ❤️ 👍

## CONVERSION OPTIMIZATION TECHNIQUES

1. **Urgency Elements:**
   - "সীমিত সময়ের অফার!"
   - "মাত্র ১০টি বাকি!"
   - Countdown timer styling
   - Pulsing/animated CTAs

2. **Trust Signals:**
   - Money-back guarantee badges
   - Customer count: "৫০০০+ সন্তুষ্ট গ্রাহক"
   - Certifications and awards
   - Payment security icons

3. **CTA Best Practices:**
   - Large tap targets (min 48px height)
   - High contrast colors
   - Action-oriented text
   - Sticky mobile CTA if appropriate

4. **Mobile UX:**
   - Touch-friendly spacing (gap-4 minimum)
   - Readable fonts (text-base minimum)
   - Thumb-zone placement for CTAs
   - Fast-loading optimized images

## OUTPUT RULES (STRICT)

1. Output ONLY clean, valid HTML code
2. NO explanations, comments, or descriptions
3. NO markdown code blocks (\`\`\` or \`)
4. PRESERVE all original text content exactly
5. PRESERVE original HTML structure
6. ONLY enhance styling and visual presentation
7. Ensure valid HTML that renders correctly`;

  const userPrompt = instruction
    ? `Enhance this HTML code with the following instruction: "${instruction}"\n\nHTML:\n${html}`
    : `Enhance this HTML code to make it more visually appealing and modern:\n\n${html}`;

  // Try each API key until one works
  for (const apiKey of apiKeys) {
    try {
      console.log(`Trying API key: ${apiKey.id}`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.key_value}`,
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
