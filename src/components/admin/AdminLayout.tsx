import { useEffect, useState } from 'react';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import AdminSidebar from './AdminSidebar';
import { NotificationPanel } from './dashboard/NotificationPanel';
import { ShopSwitcher } from './ShopSwitcher';

const STORAGE_KEY = 'ytspider-sidebar-collapsed';

function getStoredSidebarState(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored !== 'false'; // Default to open (true)
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { state, setOpen } = useSidebar();

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, state === 'expanded' ? 'true' : 'false');
  }, [state]);

  return (
    <>
      <AdminSidebar />
      <SidebarInset>
        {/* Header with trigger, shop switcher (center), and notifications */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b bg-background px-4">
          {/* Left - Mobile trigger and branding */}
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-1 md:hidden" />
            <span className="font-bold text-lg md:hidden">Ytspider</span>
          </div>
          
          {/* Center - Shop Controls */}
          <div className="flex items-center gap-2">
            <ShopSwitcher />
          </div>
          
          {/* Right - Notifications */}
          <div className="flex items-center gap-2">
            <NotificationPanel />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [defaultOpen] = useState(() => getStoredSidebarState());

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SidebarProvider>
  );
}
