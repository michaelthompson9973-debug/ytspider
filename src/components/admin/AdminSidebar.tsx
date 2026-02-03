import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  FileText,
  ShoppingCart,
  Image,
  LogOut,
  Activity,
  Bell,
  Globe,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  Key,
  PanelLeft,
  Bot,
  ShieldAlert,
  Truck,
  Inbox,
  MessageCircle,
  MessageSquare,
  BookOpen,
  Target,
  BarChart3,
  Palette,
  Store,
  Settings,
  Users,
  CreditCard,
  Shield,
  ClipboardList,
  Building2,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

const STORAGE_KEY = 'ytspider-sidebar-collapsed';

interface NavSubItem {
  href: string;
  labelKey: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: 'available' | 'N/A';
}

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavSubItem[];
}

interface NavGroup {
  labelKey: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    labelKey: 'sidebar.overview',
    items: [
      { href: '/admin', labelKey: 'sidebar.dashboard', icon: LayoutDashboard },
    ],
  },
  {
    labelKey: 'sidebar.business',
    items: [
      { 
        href: '/admin/business', 
        labelKey: 'sidebar.businessManagement', 
        icon: Building2,
        children: [
          { href: '/admin/business/shops', labelKey: 'sidebar.allShops', icon: Store },
          { href: '/admin/business/team', labelKey: 'sidebar.shopTeam', icon: Users },
          { href: '/admin/business/billing', labelKey: 'sidebar.shopBilling', icon: CreditCard },
          { href: '/admin/business/security', labelKey: 'sidebar.shopSecurity', icon: Shield },
          { href: '/admin/business/analytics', labelKey: 'sidebar.shopAnalytics', icon: BarChart3 },
          { href: '/admin/business/audit-log', labelKey: 'sidebar.shopAuditLog', icon: ClipboardList },
        ]
      },
    ],
  },
  {
    labelKey: 'sidebar.content',
    items: [
      { href: '/admin/products', labelKey: 'sidebar.products', icon: Package },
      { 
        href: '/admin/pages', 
        labelKey: 'sidebar.landingPages', 
        icon: FileText,
        children: [
          { href: '/admin/pages/library', labelKey: 'sidebar.library', icon: BookOpen },
          { href: '/admin/pages/manage', labelKey: 'sidebar.pages', icon: FileText },
        ]
      },
      { href: '/admin/media', labelKey: 'sidebar.media', icon: Image },
    ],
  },
  {
    labelKey: 'sidebar.operations',
    items: [
      { href: '/admin/orders', labelKey: 'sidebar.orders', icon: ShoppingCart },
      { 
        href: '/admin/tracking', 
        labelKey: 'sidebar.tracking', 
        icon: Activity,
        children: [
          { href: '/admin/tracking', labelKey: 'sidebar.events', icon: BarChart3 },
          { href: '/admin/tracking/profiles', labelKey: 'sidebar.profiles', icon: Target },
        ]
      },
      { 
        href: '/admin/inbox', 
        labelKey: 'sidebar.inbox', 
        icon: Inbox,
        children: [
          { href: '/admin/inbox/messenger', labelKey: 'sidebar.messenger', icon: MessageCircle },
          { href: '/admin/inbox/whatsapp', labelKey: 'sidebar.whatsapp', icon: MessageSquare },
        ]
      },
    ],
  },
  {
    labelKey: 'sidebar.settings',
    items: [
      { href: '/admin/domains', labelKey: 'sidebar.allowedDomains', icon: Globe },
      { href: '/admin/webhooks', labelKey: 'sidebar.webhooks', icon: Bell },
      { href: '/admin/settings', labelKey: 'sidebar.appearance', icon: Palette },
      { 
        href: '/admin/api', 
        labelKey: 'sidebar.api', 
        icon: Key,
        children: [
          { href: '/admin/api/ai', labelKey: 'sidebar.ai', icon: Bot, badge: 'available' },
          { href: '/admin/api/fraud-check', labelKey: 'sidebar.fraudCheck', icon: ShieldAlert, badge: 'available' },
          { href: '/admin/api/courier', labelKey: 'sidebar.courier', icon: Truck, badge: 'N/A' },
          { href: '/admin/api/messaging/messenger', labelKey: 'sidebar.messenger', icon: MessageCircle },
          { href: '/admin/api/messaging/whatsapp', labelKey: 'sidebar.whatsapp', icon: MessageSquare },
        ]
      },
    ],
  },
];

function ApiSubMenu({ item }: { item: NavItem }) {
  const location = useLocation();
  const { state } = useSidebar();
  const { t } = useLanguage();
  const isCollapsed = state === 'collapsed';
  
  const hasActiveChild = item.children?.some(
    (child) => location.pathname === child.href
  ) || false;
  const [isOpen, setIsOpen] = useState(hasActiveChild);

  useEffect(() => {
    if (hasActiveChild) {
      setIsOpen(true);
    }
  }, [hasActiveChild]);

  const getBadge = (badge?: 'available' | 'N/A') => {
    if (!badge) return null;
    if (badge === 'available') {
      return (
        <Badge className="ml-auto text-[10px] px-1.5 py-0 h-4 bg-primary text-primary-foreground">
          ✓
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-4">
        N/A
      </Badge>
    );
  };

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={hasActiveChild}>
              <Link to={item.children?.[0]?.href || item.href}>
                <item.icon className="h-4 w-4" />
                <span>{t(item.labelKey)}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </TooltipTrigger>
        <TooltipContent side="right" className="flex flex-col gap-1 p-2">
          <span className="font-medium mb-1">{t(item.labelKey)}</span>
          {item.children?.map((child) => (
            <Link 
              key={child.href} 
              to={child.href}
              className={cn(
                "text-sm px-2 py-1 rounded hover:bg-accent",
                location.pathname === child.href && "bg-accent font-medium"
              )}
            >
              {t(child.labelKey)}
            </Link>
          ))}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={hasActiveChild}>
            <item.icon className="h-4 w-4" />
            <span>{t(item.labelKey)}</span>
            <ChevronRight
              className={cn(
                'ml-auto h-4 w-4 transition-transform duration-200',
                isOpen && 'rotate-90'
              )}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children?.map((child) => {
              const isActive = location.pathname === child.href;
              return (
                <SidebarMenuSubItem key={child.href}>
                  <SidebarMenuSubButton asChild isActive={isActive}>
                    <Link to={child.href} className="flex items-center gap-2">
                      {child.icon && <child.icon className="h-3.5 w-3.5" />}
                      <span>{t(child.labelKey)}</span>
                      {getBadge(child.badge)}
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function NavGroupCollapsible({ group }: { group: NavGroup }) {
  const location = useLocation();
  const { state } = useSidebar();
  const { t } = useLanguage();
  const isCollapsed = state === 'collapsed';

  const hasActiveItem = group.items.some(
    (item) => location.pathname === item.href || 
              item.children?.some(child => location.pathname === child.href)
  );
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (hasActiveItem) {
      setIsOpen(true);
    }
  }, [hasActiveItem]);

  // For single-item groups like Dashboard, render without collapsible
  if (group.items.length === 1 && !group.items[0].children) {
    const item = group.items[0];
    const isActive = location.pathname === item.href;

    return (
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={t(item.labelKey)}
            >
              <Link to={item.href}>
                <item.icon className="h-4 w-4" />
                <span>{t(item.labelKey)}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  // Collapsed state - show icons with tooltips
  if (isCollapsed) {
    return (
      <SidebarGroup>
        <SidebarMenu>
          {group.items.map((item) => {
            if (item.children) {
              return <ApiSubMenu key={item.href} item={item} />;
            }
            const isActive = location.pathname === item.href;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={t(item.labelKey)}
                >
                  <Link to={item.href}>
                    <item.icon className="h-4 w-4" />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="group/collapsible">
      <SidebarGroup>
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors">
            <span className="flex-1">{t(group.labelKey)}</span>
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                if (item.children) {
                  return <ApiSubMenu key={item.href} item={item} />;
                }
                const isActive = location.pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{t(item.labelKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

function SidebarCollapseButton() {
  const { state, toggleSidebar } = useSidebar();
  const { t } = useLanguage();
  const isCollapsed = state === 'collapsed';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        {isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      </TooltipContent>
    </Tooltip>
  );
}

export default function AdminSidebar() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { state } = useSidebar();
  const { t } = useLanguage();
  const isCollapsed = state === 'collapsed';

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <Sidebar collapsible="icon">
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-between px-2 py-1">
          {!isCollapsed && (
            <span className="font-bold text-lg text-sidebar-foreground">
              Ytspider
            </span>
          )}
          <SidebarCollapseButton />
        </div>
      </SidebarHeader>

      {/* Content - scrollable */}
      <SidebarContent>
        {navGroups.map((group, index) => (
          <div key={group.labelKey}>
            {index > 0 && !isCollapsed && <SidebarSeparator className="my-1" />}
            <NavGroupCollapsible group={group} />
          </div>
        ))}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              tooltip={t('common.signOut')}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span>{t('common.signOut')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
