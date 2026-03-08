import { SidebarTrigger } from '@/components/ui/sidebar';
import { ShopSwitcher } from './ShopSwitcher';
import { UserMenu } from './UserMenu';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ShopHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b bg-background px-4">
      {/* Left - Mobile trigger */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
      </div>

      {/* Center - Shop Switcher */}
      <div className="flex items-center gap-2">
        <ShopSwitcher />
      </div>

      {/* Right - Notifications & User */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
        </Button>
        <UserMenu />
      </div>
    </header>
  );
}
