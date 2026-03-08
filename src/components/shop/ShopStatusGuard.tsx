/**
 * ShopStatusGuard — Blocks dashboard access for suspended shops
 * 
 * - Active: passes through
 * - Grace Period: shows warning banner + passes through
 * - Suspended: locks all pages except /shop/subscription
 */

import { useLocation, Navigate } from 'react-router-dom';
import { useShopStatus } from '@/hooks/useShopStatus';
import { AlertTriangle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ShopStatusGuardProps {
  children: React.ReactNode;
}

export function ShopStatusGuard({ children }: ShopStatusGuardProps) {
  const { status, gracePeriodEndsAt, isSuspended, isGracePeriod, isLoading } = useShopStatus();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  // Allow billing page access always
  const isBillingPage = location.pathname === '/shop/subscription';

  // Suspended → lock everything except billing
  if (isSuspended && !isBillingPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <Lock className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-xl text-destructive">
              আপনার শপ সাসপেন্ড করা হয়েছে
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              আপনার সাবস্ক্রিপশন মেয়াদ শেষ হয়ে গেছে। শপ পুনরায় সক্রিয় করতে আপনার প্ল্যান রিনিউ করুন।
            </p>
            <p className="text-sm text-muted-foreground">
              আপনার ল্যান্ডিং পেজগুলো সাময়িকভাবে বন্ধ করা হয়েছে।
            </p>
            <Button 
              onClick={() => window.location.href = '/shop/subscription'}
              className="w-full"
            >
              প্ল্যান রিনিউ করুন
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Grace period → show warning banner + allow access
  if (isGracePeriod) {
    const daysLeft = gracePeriodEndsAt 
      ? Math.max(0, Math.ceil((new Date(gracePeriodEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;

    return (
      <>
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              আপনার সাবস্ক্রিপশন মেয়াদ শেষ হয়ে গেছে। আরও {daysLeft} দিন গ্রেস পিরিয়ড আছে।
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2 border-amber-500/30 text-amber-700 hover:bg-amber-500/10"
              onClick={() => window.location.href = '/shop/subscription'}
            >
              রিনিউ করুন
            </Button>
          </div>
        </div>
        {children}
      </>
    );
  }

  return <>{children}</>;
}
