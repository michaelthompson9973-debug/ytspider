import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

/**
 * ProtectedRoute - For Super Admin / Platform Admin routes only
 * This protects /admin/* routes and requires platform admin privileges
 */
export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // For admin routes, require platform admin role
  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            আপনার প্ল্যাটফর্ম অ্যাডমিন এক্সেস নেই।
          </p>
          <p className="text-sm text-muted-foreground">
            শপ ওনার হলে <a href="/shop" className="text-primary hover:underline">/shop</a> এ যান
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
