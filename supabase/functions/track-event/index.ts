import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TrackEventRequest {
  profileId?: string;
  landingPageId?: string;
  orderId?: string;
  config?: {
    facebook?: {
      pixelId: string;
      accessToken: string;
      testEventCode?: string;
    };
    tiktok?: {
      pixelId: string;
      accessToken: string;
      testEventCode?: string;
    };
  };
  eventName: string;
  eventData: {
    value: number;
    currency: string;
    contentIds?: string[];
    contentType?: string;
    eventSourceUrl?: string;
  };
  userData: {
    phone?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    country?: string;
    externalId?: string;
    clientIpAddress?: string;
    clientUserAgent?: string;
    fbp?: string;
    fbc?: string;
  };
}

interface TrackingProfile {
  id: string;
  facebook_pixel_id: string | null;
  facebook_access_token: string | null;
  facebook_test_event_code: string | null;
  tiktok_pixel_id: string | null;
  tiktok_access_token: string | null;
  tiktok_test_event_code: string | null;
}

// SHA256 hash function for user data
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Normalize phone number to E.164 format
function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("880")) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith("0")) {
    return `+880${cleaned.slice(1)}`;
  }
  return `+880${cleaned}`;
}

// Hash user data for Facebook
async function hashUserDataForFacebook(userData: TrackEventRequest["userData"]) {
  const hashed: Record<string, string[]> = {};

  if (userData.phone) {
    const normalized = normalizePhone(userData.phone);
    hashed.ph = [await sha256(normalized)];
  }
  if (userData.email) {
    hashed.em = [await sha256(userData.email)];
  }
  if (userData.firstName) {
    hashed.fn = [await sha256(userData.firstName)];
  }
  if (userData.lastName) {
    hashed.ln = [await sha256(userData.lastName)];
  }
  if (userData.city) {
    hashed.ct = [await sha256(userData.city)];
  }
  if (userData.country) {
    hashed.country = [await sha256(userData.country)];
  }
  if (userData.externalId) {
    hashed.external_id = [await sha256(userData.externalId)];
  }
  if (userData.fbp) {
    hashed.fbp = [userData.fbp]; // Not hashed
  }
  if (userData.fbc) {
    hashed.fbc = [userData.fbc]; // Not hashed
  }
  if (userData.clientIpAddress) {
    hashed.client_ip_address = [userData.clientIpAddress]; // Not hashed
  }
  if (userData.clientUserAgent) {
    hashed.client_user_agent = [userData.clientUserAgent]; // Not hashed
  }

  return hashed;
}

// Hash user data for TikTok
async function hashUserDataForTikTok(userData: TrackEventRequest["userData"]) {
  const hashed: Record<string, string> = {};

  if (userData.phone) {
    const normalized = normalizePhone(userData.phone);
    hashed.phone = await sha256(normalized);
  }
  if (userData.email) {
    hashed.email = await sha256(userData.email);
  }
  if (userData.externalId) {
    hashed.external_id = await sha256(userData.externalId);
  }

  return hashed;
}

// Map event names between platforms
function mapEventName(eventName: string, platform: "facebook" | "tiktok"): string {
  const fbMap: Record<string, string> = {
    Purchase: "Purchase",
    AddToCart: "AddToCart",
    ViewContent: "ViewContent",
    InitiateCheckout: "InitiateCheckout",
    Lead: "Lead",
    TestEvent: "TestEvent",
  };

  const tiktokMap: Record<string, string> = {
    Purchase: "CompletePayment",
    AddToCart: "AddToCart",
    ViewContent: "ViewContent",
    InitiateCheckout: "InitiateCheckout",
    Lead: "SubmitForm",
    TestEvent: "CompletePayment",
  };

  if (platform === "facebook") {
    return fbMap[eventName] || eventName;
  }
  return tiktokMap[eventName] || eventName;
}

// Send event to Facebook Conversion API
async function sendToFacebook(
  config: { pixelId: string; accessToken: string; testEventCode?: string },
  eventName: string,
  eventData: TrackEventRequest["eventData"],
  userData: TrackEventRequest["userData"],
  eventId: string
): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    const hashedUserData = await hashUserDataForFacebook(userData);
    const eventTime = Math.floor(Date.now() / 1000);

    const payload = {
      data: [
        {
          event_name: mapEventName(eventName, "facebook"),
          event_time: eventTime,
          event_id: eventId,
          event_source_url: eventData.eventSourceUrl || "https://example.com",
          action_source: "website",
          user_data: hashedUserData,
          custom_data: {
            value: eventData.value,
            currency: eventData.currency || "BDT",
            content_ids: eventData.contentIds || [],
            content_type: eventData.contentType || "product",
          },
        },
      ],
      ...(config.testEventCode && { test_event_code: config.testEventCode }),
    };

    console.log("[Facebook CAPI] Sending event:", JSON.stringify(payload, null, 2));

    const response = await fetch(
      `https://graph.facebook.com/v19.0/${config.pixelId}/events?access_token=${config.accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();
    console.log("[Facebook CAPI] Response:", response.status, JSON.stringify(data));

    if (!response.ok) {
      return { success: false, error: data.error?.message || "Facebook API error", response: data };
    }

    return { success: true, response: data };
  } catch (error) {
    console.error("[Facebook CAPI] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Send event to TikTok Events API
async function sendToTikTok(
  config: { pixelId: string; accessToken: string; testEventCode?: string },
  eventName: string,
  eventData: TrackEventRequest["eventData"],
  userData: TrackEventRequest["userData"],
  eventId: string
): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    const hashedUserData = await hashUserDataForTikTok(userData);
    const timestamp = new Date().toISOString();

    const payload = {
      pixel_code: config.pixelId,
      event: mapEventName(eventName, "tiktok"),
      event_id: eventId,
      timestamp: timestamp,
      context: {
        user_agent: userData.clientUserAgent || "",
        ip: userData.clientIpAddress || "",
      },
      properties: {
        contents: (eventData.contentIds || []).map((id) => ({
          content_id: id,
          content_type: eventData.contentType || "product",
        })),
        value: eventData.value,
        currency: eventData.currency || "BDT",
      },
      user: hashedUserData,
      ...(config.testEventCode && { test_event_code: config.testEventCode }),
    };

    console.log("[TikTok Events API] Sending event:", JSON.stringify(payload, null, 2));

    const response = await fetch(
      "https://business-api.tiktok.com/open_api/v1.3/event/track/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Token": config.accessToken,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();
    console.log("[TikTok Events API] Response:", response.status, JSON.stringify(data));

    if (!response.ok || data.code !== 0) {
      return { success: false, error: data.message || "TikTok API error", response: data };
    }

    return { success: true, response: data };
  } catch (error) {
    console.error("[TikTok Events API] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: TrackEventRequest = await req.json();
    console.log("[track-event] Received request:", JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.eventName) {
      return new Response(
        JSON.stringify({ success: false, error: "eventName is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let profile: TrackingProfile | null = null;

    // Get tracking profile from database if profileId or landingPageId provided
    if (body.profileId) {
      const { data, error } = await supabase
        .from("tracking_profiles")
        .select("*")
        .eq("id", body.profileId)
        .eq("is_active", true)
        .single();

      if (error) {
        console.error("[track-event] Error fetching profile:", error);
      } else {
        profile = data;
      }
    } else if (body.landingPageId) {
      // First get the tracking_profile_id from landing page
      const { data: landingPage, error: lpError } = await supabase
        .from("landing_pages")
        .select("tracking_profile_id")
        .eq("id", body.landingPageId)
        .single();

      if (lpError || !landingPage?.tracking_profile_id) {
        console.log("[track-event] No tracking profile linked to landing page");
      } else {
        const { data, error } = await supabase
          .from("tracking_profiles")
          .select("*")
          .eq("id", landingPage.tracking_profile_id)
          .eq("is_active", true)
          .single();

        if (error) {
          console.error("[track-event] Error fetching profile:", error);
        } else {
          profile = data;
        }
      }
    }

    // Build config from profile or direct config
    const facebookConfig = body.config?.facebook || (profile && profile.facebook_pixel_id && profile.facebook_access_token
      ? {
          pixelId: profile.facebook_pixel_id,
          accessToken: profile.facebook_access_token,
          testEventCode: profile.facebook_test_event_code || undefined,
        }
      : null);

    const tiktokConfig = body.config?.tiktok || (profile && profile.tiktok_pixel_id && profile.tiktok_access_token
      ? {
          pixelId: profile.tiktok_pixel_id,
          accessToken: profile.tiktok_access_token,
          testEventCode: profile.tiktok_test_event_code || undefined,
        }
      : null);

    // Generate unique event ID
    const eventId = crypto.randomUUID();
    const results: Record<string, { success: boolean; response?: unknown; error?: string }> = {};

    // Send to Facebook
    if (facebookConfig) {
      results.facebook = await sendToFacebook(
        facebookConfig,
        body.eventName,
        body.eventData || { value: 0, currency: "BDT" },
        body.userData || {},
        eventId
      );

      // Log to database
      await supabase.from("tracking_event_logs").insert({
        profile_id: profile?.id || null,
        order_id: body.orderId || null,
        platform: "facebook",
        event_name: body.eventName,
        event_id: eventId,
        request_payload: body,
        response_status: results.facebook.success ? 200 : 400,
        response_body: JSON.stringify(results.facebook.response || results.facebook.error),
      });
    }

    // Send to TikTok
    if (tiktokConfig) {
      results.tiktok = await sendToTikTok(
        tiktokConfig,
        body.eventName,
        body.eventData || { value: 0, currency: "BDT" },
        body.userData || {},
        eventId
      );

      // Log to database
      await supabase.from("tracking_event_logs").insert({
        profile_id: profile?.id || null,
        order_id: body.orderId || null,
        platform: "tiktok",
        event_name: body.eventName,
        event_id: eventId,
        request_payload: body,
        response_status: results.tiktok.success ? 200 : 400,
        response_body: JSON.stringify(results.tiktok.response || results.tiktok.error),
      });
    }

    const overallSuccess = Object.values(results).some((r) => r.success);

    console.log("[track-event] Complete. Results:", JSON.stringify(results, null, 2));

    return new Response(
      JSON.stringify({
        success: overallSuccess,
        results,
        eventId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[track-event] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
