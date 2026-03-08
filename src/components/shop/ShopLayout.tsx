import { useEffect, useState } from 'react';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { ShopSidebar } from './ShopSidebar';
import { ShopHeader } from './ShopHeader';

const STORAGE_KEY = 'ytspider-shop-sidebar-collapsed';

function getStoredSidebarState(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored !== 'false';
}

function ShopLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ShopSidebar />
      <SidebarInset>
        <ShopHeader />
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}

export function ShopLayout({ children }: { children: React.ReactNode }) {
  const [defaultOpen] = useState(() => getStoredSidebarState());

  return (
    <div className="shop-growth-workspace">
      <SidebarProvider defaultOpen={defaultOpen}>
        <ShopLayoutContent>{children}</ShopLayoutContent>
      </SidebarProvider>
    </div>
  );
}
