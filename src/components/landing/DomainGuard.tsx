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
];

const shouldBypassCheck = (hostname: string): boolean => {
  return BYPASS_PATTERNS.some(pattern => 
    hostname === pattern.replace(/^\./, '') || hostname.includes(pattern)
  );
};

export function DomainGuard({ children }: DomainGuardProps) {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  // Skip check for development/preview domains
  const shouldBypass = shouldBypassCheck(hostname);

  const { data: isAllowed, isLoading, error } = useQuery({
    queryKey: ['domain-check', hostname],
    queryFn: async () => {
      // Query allowed_domains table for this hostname
      const { data, error } = await supabase
        .from('allowed_domains')
        .select('id, enabled')
        .eq('domain', hostname)
        .eq('enabled', true)
        .maybeSingle();
      
      if (error) {
        console.error('Domain check error:', error);
        return false;
      }
      
      return !!data;
    },
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
