import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useShop } from '@/contexts/ShopContext';
import { Skeleton } from '@/components/ui/skeleton';

interface ShopProtectedRouteProps {
  children: React.ReactNode;
}

export function ShopProtectedRoute({ children }: ShopProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { currentShop, availableShops, isLoading: shopLoading } = useShop();

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
    return <Navigate to="/login" replace />;
  }

  // No shops available - redirect to create shop
  if (availableShops.length === 0) {
    return <Navigate to="/shop/onboarding" replace />;
  }

  // No shop selected - auto-select first shop
  if (!currentShop && availableShops.length > 0) {
    // This will trigger the shop selection, component will re-render
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
