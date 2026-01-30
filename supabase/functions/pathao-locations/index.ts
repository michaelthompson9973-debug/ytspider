import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, verifyAuth, unauthorizedResponse, logRequest, checkRateLimit, getClientIp, rateLimitedResponse } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const ip = getClientIp(req);
  const rateLimitResult = checkRateLimit(ip, { windowMs: 60000, maxRequests: 30 });
  if (!rateLimitResult.allowed) {
    return rateLimitedResponse();
  }

  try {
    const auth = await verifyAuth(req);
    if (!auth.authenticated || (!auth.isAdmin && !auth.isServiceRole)) {
      logRequest('pathao-locations', req, auth, 'unauthorized');
      return unauthorizedResponse('Admin access required');
    }

    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'cities';
    const cityId = url.searchParams.get('cityId');
    const zoneId = url.searchParams.get('zoneId');
    const refresh = url.searchParams.get('refresh') === 'true';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check if we should return cached data
    if (!refresh) {
      if (type === 'cities') {
        const { data: cached } = await supabase
          .from('pathao_locations')
          .select('city_id, city_name')
          .not('city_id', 'is', null)
          .is('zone_id', null);

        if (cached && cached.length > 0) {
          const cities = [...new Map(cached.map(c => [c.city_id, c])).values()];
          return new Response(
            JSON.stringify({ data: cities, cached: true }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else if (type === 'zones' && cityId) {
        const { data: cached } = await supabase
          .from('pathao_locations')
          .select('zone_id, zone_name')
          .eq('city_id', parseInt(cityId))
          .not('zone_id', 'is', null);

        if (cached && cached.length > 0) {
          const zones = [...new Map(cached.map(z => [z.zone_id, z])).values()];
          return new Response(
            JSON.stringify({ data: zones, cached: true }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else if (type === 'areas' && zoneId) {
        const { data: cached } = await supabase
          .from('pathao_locations')
          .select('area_id, area_name')
          .eq('zone_id', parseInt(zoneId))
          .not('area_id', 'is', null);

        if (cached && cached.length > 0) {
          const areas = [...new Map(cached.map(a => [a.area_id, a])).values()];
          return new Response(
            JSON.stringify({ data: areas, cached: true }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Need to fetch from Pathao API
    const { data: credentials } = await supabase
      .from('courier_credentials')
      .select('*')
      .eq('provider', 'pathao')
      .eq('is_active', true);

    if (!credentials || credentials.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No Pathao credentials found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessTokenCred = credentials.find(c => c.credential_type === 'access_token');
    if (!accessTokenCred?.access_token) {
      return new Response(
        JSON.stringify({ error: 'Pathao access token not found. Please authenticate first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let apiUrl: string;
    if (type === 'cities') {
      apiUrl = 'https://api-hermes.pathao.com/aladdin/api/v1/countries/1/city-list';
    } else if (type === 'zones' && cityId) {
      apiUrl = `https://api-hermes.pathao.com/aladdin/api/v1/cities/${cityId}/zone-list`;
    } else if (type === 'areas' && zoneId) {
      apiUrl = `https://api-hermes.pathao.com/aladdin/api/v1/zones/${zoneId}/area-list`;
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid request. Provide type=cities, zones (with cityId), or areas (with zoneId)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessTokenCred.access_token}`,
      },
    });

    const data = await response.json();
    console.log(`Pathao ${type} response:`, { code: data.code, count: data.data?.data?.length });

    if (data.code !== 200 || !data.data?.data) {
      return new Response(
        JSON.stringify({ error: data.message || `Failed to fetch ${type}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const items = data.data.data;

    // Cache the results
    if (type === 'cities') {
      const locations = items.map((c: { city_id: number; city_name: string }) => ({
        city_id: c.city_id,
        city_name: c.city_name,
      }));
      
      // Upsert cities
      for (const loc of locations) {
        await supabase
          .from('pathao_locations')
          .upsert(loc, { onConflict: 'city_id,zone_id,area_id' });
      }
    } else if (type === 'zones' && cityId) {
      const locations = items.map((z: { zone_id: number; zone_name: string }) => ({
        city_id: parseInt(cityId),
        zone_id: z.zone_id,
        zone_name: z.zone_name,
      }));
      
      for (const loc of locations) {
        await supabase
          .from('pathao_locations')
          .upsert(loc, { onConflict: 'city_id,zone_id,area_id' });
      }
    } else if (type === 'areas' && zoneId) {
      // Get city_id for this zone
      const { data: zoneData } = await supabase
        .from('pathao_locations')
        .select('city_id')
        .eq('zone_id', parseInt(zoneId))
        .limit(1)
        .single();

      const locations = items.map((a: { area_id: number; area_name: string }) => ({
        city_id: zoneData?.city_id,
        zone_id: parseInt(zoneId),
        area_id: a.area_id,
        area_name: a.area_name,
      }));
      
      for (const loc of locations) {
        await supabase
          .from('pathao_locations')
          .upsert(loc, { onConflict: 'city_id,zone_id,area_id' });
      }
    }

    logRequest('pathao-locations', req, auth, 'success', `Fetched ${type}: ${items.length} items`);

    return new Response(
      JSON.stringify({ data: items, cached: false }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in pathao-locations:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
