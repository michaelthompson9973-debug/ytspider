/**
 * ShopStatusGuard — Blocks dashboard access for suspended shops
 */

import { useLocation } from 'react-router-dom';
import { useShopStatus } from '@/hooks/useShopStatus';
import { AlertTriangle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ShopStatusGuardProps { children: React.ReactNode; }

export function ShopStatusGuard({ children }: ShopStatusGuardProps) {
  const { status, gracePeriodEndsAt, isSuspended, isGracePeriod, isLoading } = useShopStatus();
  const location = useLocation();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Skeleton className="h-8 w-48" /></div>;

  const isBillingPage = location.pathname === '/shop/subscription';

  if (isSuspended && !isBillingPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10"><Lock className="h-8 w-8 text-destructive" /></div>
            <CardTitle className="text-xl text-destructive">Your shop has been suspended</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Your subscription has expired. Renew your plan to reactivate your shop.</p>
            <p className="text-sm text-muted-foreground">Your landing pages have been temporarily disabled.</p>
            <Button onClick={() => window.location.href = '/shop/subscription'} className="w-full">Renew Plan</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isGracePeriod) {
    const daysLeft = gracePeriodEndsAt ? Math.max(0, Math.ceil((new Date(gracePeriodEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
    return (
      <>
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Your subscription has expired. You have {daysLeft} days of grace period remaining.</span>
            <Button variant="outline" size="sm" className="ml-2 border-amber-500/30 text-amber-700 hover:bg-amber-500/10" onClick={() => window.location.href = '/shop/subscription'}>Renew</Button>
          </div>
        </div>
        {children}
      </>
    );
  }

  return <>{children}</>;
}
