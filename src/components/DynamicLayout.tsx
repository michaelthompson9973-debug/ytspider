import { useLocation } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { ShopLayout } from '@/components/shop';

interface DynamicLayoutProps {
  children: React.ReactNode;
}

/**
 * DynamicLayout - Automatically selects the correct layout based on route
 * - /shop/* routes use ShopLayout (for business owners)
 * - /admin/* routes use AdminLayout (for platform admins)
 */
export function DynamicLayout({ children }: DynamicLayoutProps) {
  const location = useLocation();
  
  // Check if we're in shop owner area
  const isShopArea = location.pathname.startsWith('/shop');
  
  if (isShopArea) {
    return <ShopLayout>{children}</ShopLayout>;
  }
  
  return <AdminLayout>{children}</AdminLayout>;
}
