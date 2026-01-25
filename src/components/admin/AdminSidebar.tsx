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
  PanelLeftClose,
  Key,
  PanelLeft,
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

const STORAGE_KEY = 'ytspider-sidebar-collapsed';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
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
      { href: '/admin/pages', label: 'Landing Pages', icon: FileText },
      { href: '/admin/media', label: 'Media', icon: Image },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
      { href: '/admin/tracking', label: 'Tracking', icon: Activity },
    ],
  },
  {
    label: 'Settings',
    items: [
      { href: '/admin/domains', label: 'Domains', icon: Globe },
      { href: '/admin/webhooks', label: 'Webhooks', icon: Bell },
      { href: '/admin/api', label: 'API', icon: Key },
    ],
  },
];

function NavGroupCollapsible({ group }: { group: NavGroup }) {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const hasActiveItem = group.items.some(
    (item) => location.pathname === item.href
  );
  const [isOpen, setIsOpen] = useState(hasActiveItem);

  // Keep group open if it contains the active route
  useEffect(() => {
    if (hasActiveItem) {
      setIsOpen(true);
    }
  }, [hasActiveItem]);

  // For single-item groups like Dashboard, render without collapsible
  if (group.items.length === 1) {
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

