import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Bell, Package, CheckCircle, XCircle, Eye, Truck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { bn, enUS } from 'date-fns/locale';
import { Link } from 'react-router-dom';

interface Notification {
  id: string;
  type: 'new_order' | 'status_change' | 'delivered' | 'cancelled';
  title: string;
  message: string;
  orderId?: string;
  createdAt: Date;
  read: boolean;
}

export function NotificationPanel() {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Fetch recent orders as notifications
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, customer_name, total, status, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return data.map((order): Notification => {
        let type: Notification['type'] = 'new_order';
        let title = t('dashboard.notifications');
        
        if (order.status === 'delivered') {
          type = 'delivered';
          title = 'Order Delivered';
        } else if (order.status === 'cancelled') {
          type = 'cancelled';
          title = 'Order Cancelled';
        } else if (order.status === 'shipped') {
          type = 'status_change';
          title = 'Order Shipped';
        }

        return {
          id: order.id,
          type,
          title: order.status === 'new' ? 'New Order' : title,
          message: `${order.customer_name} - ৳${order.total?.toLocaleString() ?? 0}`,
          orderId: order.id,
          createdAt: new Date(order.created_at),
          read: readIds.has(order.id),
        };
      });
    },
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  const handleMarkAllRead = () => {
    if (notifications) {
      setReadIds(new Set(notifications.map((n) => n.id)));
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'new_order':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'status_change':
        return <Truck className="h-5 w-5 text-purple-500" />;
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 text-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader className="flex flex-row items-center justify-between">
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('dashboard.notifications')}
          </SheetTitle>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          )}
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-100px)] mt-4">
          <div className="space-y-3">
            {!notifications || notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={`/admin/orders`}
                  onClick={() => {
                    setReadIds((prev) => new Set([...prev, notification.id]));
                    setOpen(false);
                  }}
                  className={`flex items-start gap-3 p-4 rounded-lg border transition-colors hover:bg-muted/50 ${
                    notification.read ? 'opacity-60' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(notification.createdAt, {
                        addSuffix: true,
                        locale: language === 'bn' ? bn : enUS,
                      })}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  )}
                </Link>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
