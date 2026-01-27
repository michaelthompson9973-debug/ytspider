import { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DomainNotAuthorized } from './DomainNotAuthorized';

interface DomainGuardProps {
  children: ReactNode;
}

// Domains that bypass the check (development/preview)
const BYPASS_PATTERNS = [
  'localhost',
  '127.0.0.1',
  '.lovable.app',
  '.lovableproject.com',
  '.webcontainer.io',
  '.vercel.app',
];

const shouldBypassCheck = (hostname: string): boolean => {
  return BYPASS_PATTERNS.some(pattern => 
    hostname === pattern.replace(/^\./, '') || hostname.includes(pattern)
  );
};

// Check if domain is allowed (exact match or wildcard match)
const checkDomainAllowed = async (hostname: string): Promise<boolean> => {
  // Step 1: Check exact match
  const { data: exactMatch, error: exactError } = await supabase
    .from('allowed_domains')
    .select('id')
    .eq('domain', hostname)
    .eq('enabled', true)
    .maybeSingle();
  
  if (exactError) {
    console.error('Domain exact match check error:', exactError);
    return false;
  }
  
  if (exactMatch) return true;
  
  // Step 2: Check wildcard match
  // hostname: shop.onegallerybd.com → wildcard: *.onegallerybd.com
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    const parentDomain = parts.slice(1).join('.'); // onegallerybd.com
    const wildcardDomain = `*.${parentDomain}`;    // *.onegallerybd.com
    
    const { data: wildcardMatch, error: wildcardError } = await supabase
      .from('allowed_domains')
      .select('id')
      .eq('domain', wildcardDomain)
      .eq('enabled', true)
      .eq('is_wildcard', true)
      .maybeSingle();
    
    if (wildcardError) {
      console.error('Domain wildcard check error:', wildcardError);
      return false;
    }
    
    return !!wildcardMatch;
  }
  
  return false;
};

export function DomainGuard({ children }: DomainGuardProps) {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  // Skip check for development/preview domains
  const shouldBypass = shouldBypassCheck(hostname);

  const { data: isAllowed, isLoading, error } = useQuery({
    queryKey: ['domain-check', hostname],
    queryFn: () => checkDomainAllowed(hostname),
    enabled: !shouldBypass && !!hostname,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  // Bypass for development domains
  if (shouldBypass) {
    return <>{children}</>;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  // Error or not allowed
  if (error || !isAllowed) {
    return <DomainNotAuthorized hostname={hostname} />;
  }

  // Domain is allowed, render children
  return <>{children}</>;
}
