import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useShop } from '@/contexts/ShopContext';
import { Skeleton } from '@/components/ui/skeleton';

interface ShopProtectedRouteProps {
  children: React.ReactNode;
}

export function ShopProtectedRoute({ children }: ShopProtectedRouteProps) {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { currentShop, availableShops, isLoading: shopLoading, switchShop } = useShop();

  // Auto-select first shop if none selected but shops available
  useEffect(() => {
    if (!shopLoading && !currentShop && availableShops.length > 0) {
      switchShop(availableShops[0].id);
    }
  }, [shopLoading, currentShop, availableShops, switchShop]);

  // Still loading
  if (authLoading || shopLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/shop/login" replace />;
  }

  // Platform admins are not allowed in /shop area
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // No shops available - redirect to onboarding
  if (availableShops.length === 0) {
    return <Navigate to="/shop/onboarding" replace />;
  }

  // No shop selected but shops are available - show loading while auto-selecting
  if (!currentShop && availableShops.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">শপ লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
