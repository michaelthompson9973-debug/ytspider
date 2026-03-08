import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  Image,
  MessageCircle,
  Shield,
  Settings,
  Users,
  CreditCard,
  BarChart3,
  Target,
  Truck,
  Sparkles,
  Library,
  ChevronDown,
  Wallet,
  UserCheck,
  Ticket,
  RotateCcw,
  Banknote,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useShop, ShopType } from '@/contexts/ShopContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState, useMemo } from 'react';

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  children?: NavItem[];
  /** 'physical' | 'digital' | undefined (both) */
  shopType?: ShopType;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

function getNavGroups(shopType: ShopType): NavGroup[] {
  const allGroups: NavGroup[] = [
    {
      label: 'ওভারভিউ',
      items: [
        { title: 'ড্যাশবোর্ড', url: '/shop', icon: LayoutDashboard },
      ],
    },
    {
      label: 'ব্যবসা',
      items: [
        { title: 'প্রোডাক্ট', url: '/shop/products', icon: Package },
        { title: 'অর্ডার', url: '/shop/orders', icon: ShoppingCart },
        { title: 'কাস্টমার', url: '/shop/customers', icon: UserCheck },
        { title: 'কুপন', url: '/shop/coupons', icon: Ticket },
        { title: 'রিটার্ন/রিফান্ড', url: '/shop/returns', icon: RotateCcw, shopType: 'physical' },
        { title: 'COD', url: '/shop/cod', icon: Banknote, shopType: 'physical' },
        {
          title: 'ল্যান্ডিং পেজ',
          url: '/shop/pages',
          icon: FileText,
          children: [
            { title: 'লাইব্রেরী', url: '/shop/pages/library', icon: Library },
            { title: 'পেজ সমূহ', url: '/shop/pages/manage', icon: FileText },
          ],
        },
        { title: 'মিডিয়া', url: '/shop/media', icon: Image },
      ],
    },
    {
      label: 'যোগাযোগ',
      items: [
        {
          title: 'ইনবক্স',
          url: '/shop/inbox',
          icon: MessageCircle,
          children: [
            { title: 'মেসেঞ্জার', url: '/shop/inbox/messenger', icon: MessageCircle },
          ],
        },
      ],
    },
    {
      label: 'ইন্টিগ্রেশন',
      items: [
        { title: 'ট্র্যাকিং', url: '/shop/tracking', icon: Target },
        { title: 'কুরিয়ার', url: '/shop/courier', icon: Truck, shopType: 'physical' },
        { title: 'পেমেন্ট', url: '/shop/payments', icon: Wallet, shopType: 'digital' },
        { title: 'AI সেটিংস', url: '/shop/ai', icon: Sparkles },
      ],
    },
    {
      label: 'সেটিংস',
      items: [
        { title: 'টিম', url: '/shop/team', icon: Users },
        { title: 'সিকিউরিটি', url: '/shop/security', icon: Shield },
        { title: 'সাবস্ক্রিপশন', url: '/shop/subscription', icon: CreditCard },
        { title: 'অ্যানালিটিক্স', url: '/shop/analytics', icon: BarChart3 },
        { title: 'সেটিংস', url: '/shop/settings', icon: Settings },
      ],
    },
  ];

  // Filter items based on shop type
  return allGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (!item.shopType) return true;
      return item.shopType === shopType;
    }),
  })).filter(group => group.items.length > 0);
}

function NavItemComponent({ item, isCollapsed }: { item: NavItem; isCollapsed: boolean }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(
    item.children?.some(child => location.pathname.startsWith(child.url)) || false
  );

  if (item.children) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton className="w-full justify-between">
              <span className="flex items-center gap-2">
                <item.icon className="h-4 w-4" />
                {!isCollapsed && <span>{item.title}</span>}
              </span>
              {!isCollapsed && (
                <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
              )}
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenu className="pl-6 mt-1">
              {item.children.map((child) => (
                <SidebarMenuItem key={child.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={child.url}
                      className={({ isActive }) =>
                        cn("flex items-center gap-2", isActive && "bg-accent text-accent-foreground")
                      }
                    >
                      <child.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{child.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <NavLink
          to={item.url}
          end={item.url === '/shop'}
          className={({ isActive }) =>
            cn("flex items-center gap-2", isActive && "bg-accent text-accent-foreground")
          }
        >
          <item.icon className="h-4 w-4" />
          {!isCollapsed && <span>{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function ShopSidebar() {
  const { state } = useSidebar();
  const { currentShop } = useShop();
  const isCollapsed = state === 'collapsed';

  const shopType = currentShop?.shop_type || 'physical';
  const navGroups = useMemo(() => getNavGroups(shopType), [shopType]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          {currentShop?.logo_url ? (
            <img
              src={currentShop.logo_url}
              alt={currentShop.name}
              className="h-8 w-8 rounded-md object-cover ring-2 ring-white/20"
            />
          ) : (
            <div className="h-8 w-8 rounded-md bg-white/20 flex items-center justify-center text-white font-bold text-sm">
              {currentShop?.name?.charAt(0) || 'S'}
            </div>
          )}
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm truncate max-w-[140px] text-white">
                {currentShop?.name || 'Shop'}
              </span>
              <span className="text-xs text-sidebar-foreground/70 capitalize">
                {shopType === 'digital' ? 'Digital' : 'Physical'} • {currentShop?.plan || 'free'}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            {!isCollapsed && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <NavItemComponent key={item.url} item={item} isCollapsed={isCollapsed} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <div className="text-xs text-sidebar-foreground/50 text-center">
          Powered by YTSpider
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
