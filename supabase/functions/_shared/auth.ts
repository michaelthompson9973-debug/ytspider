import { createClient } from "npm:@supabase/supabase-js@2.91.1";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiter (resets on function cold start)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export function checkRateLimit(
  ip: string,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 30 }
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const key = ip;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1 };
  }

  if (record.count >= config.maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: config.maxRequests - record.count };
}

export function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  isAdmin?: boolean;
  isServiceRole?: boolean;
  error?: string;
}

export async function verifyAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization');
  
  // Check for service role key (internal calls)
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (authHeader === `Bearer ${serviceRoleKey}`) {
    return { authenticated: true, isServiceRole: true };
  }

  if (!authHeader?.startsWith('Bearer ')) {
    return { authenticated: false, error: 'Missing or invalid Authorization header' };
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return { authenticated: false, error: 'Invalid token' };
    }

    const userId = claimsData.claims.sub as string;

    // Check admin status using the has_role function
    const { data: isAdminData, error: adminError } = await supabase
      .rpc('has_role', { _user_id: userId, _role: 'admin' });

    if (adminError) {
      console.error('Error checking admin status:', adminError);
    }

    return {
      authenticated: true,
      userId,
      isAdmin: !!isAdminData,
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { authenticated: false, error: 'Token verification failed' };
  }
}

export function logRequest(
  functionName: string,
  req: Request,
  auth: AuthResult,
  result: 'success' | 'error' | 'unauthorized' | 'rate_limited',
  details?: string
) {
  const ip = getClientIp(req);
  const logEntry = {
    timestamp: new Date().toISOString(),
    function: functionName,
    method: req.method,
    ip,
    userId: auth.userId || 'anonymous',
    isAdmin: auth.isAdmin || false,
    isServiceRole: auth.isServiceRole || false,
    result,
    details,
  };
  console.log(JSON.stringify(logEntry));
}

export function unauthorizedResponse(message = 'Unauthorized'): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

export function rateLimitedResponse(): Response {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
