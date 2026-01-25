import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import AdminSidebar from './AdminSidebar';

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
        {/* Mobile header with trigger */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
          <SidebarTrigger className="-ml-1" />
          <span className="font-bold text-lg">Ytspider</span>
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
