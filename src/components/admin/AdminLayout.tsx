import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  FileText,
  ShoppingCart,
  Image,
  Menu,
  X,
  LogOut,
  Activity,
  Bell,
  Globe,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/pages', label: 'Landing Pages', icon: FileText },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/media', label: 'Media', icon: Image },
  { href: '/admin/tracking', label: 'Tracking', icon: Activity },
  { href: '/admin/webhooks', label: 'Webhooks', icon: Bell },
  { href: '/admin/domains', label: 'Domains', icon: Globe },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background px-4 lg:hidden">
        <span className="font-bold text-lg">Ytspider</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-background transition-transform duration-200 lg:static lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex h-14 items-center border-b px-6 max-lg:hidden">
            <span className="font-bold text-lg">Ytspider</span>
          </div>
          <nav className="flex flex-col gap-1 p-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="absolute bottom-4 left-4 right-4">
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6 max-lg:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
