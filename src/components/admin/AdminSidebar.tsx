import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: 'available' | 'N/A';
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavSubItem[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/products', label: 'Products', icon: Package },
      { 
        href: '/admin/pages', 
        label: 'Landing Pages', 
        icon: FileText,
        children: [
          { href: '/admin/pages/library', label: 'Library', icon: BookOpen },
          { href: '/admin/pages/manage', label: 'Pages', icon: FileText },
        ]
      },
      { href: '/admin/media', label: 'Media', icon: Image },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
      { 
        href: '/admin/tracking', 
        label: 'Tracking', 
        icon: Activity,
        children: [
          { href: '/admin/tracking', label: 'Events', icon: BarChart3 },
          { href: '/admin/tracking/profiles', label: 'Profiles', icon: Target },
        ]
      },
      { 
        href: '/admin/inbox', 
        label: 'Inbox', 
        icon: Inbox,
        children: [
          { href: '/admin/inbox/messenger', label: 'Messenger', icon: MessageCircle },
          { href: '/admin/inbox/whatsapp', label: 'WhatsApp', icon: MessageSquare },
        ]
      },
    ],
  },
  {
    label: 'Settings',
    items: [
      { href: '/admin/domains', label: 'Allowed Domains', icon: Globe },
      { href: '/admin/webhooks', label: 'Webhooks', icon: Bell },
      { href: '/admin/settings', label: 'Appearance', icon: Palette },
      { 
        href: '/admin/api', 
        label: 'API', 
        icon: Key,
        children: [
          { href: '/admin/api/ai', label: 'AI', icon: Bot, badge: 'available' },
          { href: '/admin/api/fraud-check', label: 'Fraud Check', icon: ShieldAlert, badge: 'available' },
          { href: '/admin/api/courier', label: 'Courier', icon: Truck, badge: 'N/A' },
          { href: '/admin/api/messaging/messenger', label: 'Messenger', icon: MessageCircle },
          { href: '/admin/api/messaging/whatsapp', label: 'WhatsApp', icon: MessageSquare },
        ]
      },
    ],
  },
];

function ApiSubMenu({ item }: { item: NavItem }) {
  const location = useLocation();
  const { state } = useSidebar();
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
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </TooltipTrigger>
        <TooltipContent side="right" className="flex flex-col gap-1 p-2">
          <span className="font-medium mb-1">{item.label}</span>
          {item.children?.map((child) => (
            <Link 
              key={child.href} 
              to={child.href}
              className={cn(
                "text-sm px-2 py-1 rounded hover:bg-accent",
                location.pathname === child.href && "bg-accent font-medium"
              )}
            >
              {child.label}
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
            <span>{item.label}</span>
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
                      <span>{child.label}</span>
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
              tooltip={item.label}
            >
              <Link to={item.href}>
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
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
                  tooltip={item.label}
                >
                  <Link to={item.href}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
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
            <span className="flex-1">{group.label}</span>
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
                        <span>{item.label}</span>
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
          <div key={group.label}>
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
              tooltip="Sign Out"
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

