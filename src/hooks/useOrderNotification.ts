import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Order } from '@/components/admin/orders/types';

const NOTIFICATION_SOUND = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU' + 
  'tvT19AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  '/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////';

interface UseOrderNotificationOptions {
  enabled: boolean;
  onNewOrder?: (order: Order) => void;
}

export function useOrderNotification({ enabled, onNewOrder }: UseOrderNotificationOptions) {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isInitialLoadRef = useRef(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('orderNotificationsEnabled') !== 'false';
    }
    return true;
  });

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  const playSound = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(NOTIFICATION_SOUND);
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, []);

  const showBrowserNotification = useCallback((order: Order) => {
    if (Notification.permission === 'granted') {
      const notification = new Notification('New Order!', {
        body: `${order.customer_name} - ৳${order.total?.toLocaleString() || '0'}`,
        icon: '/favicon.ico',
        tag: order.id,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setTimeout(() => notification.close(), 5000);
    }
  }, []);

  const handleNewOrder = useCallback((order: Order) => {
    if (!notificationsEnabled) return;
    if (isInitialLoadRef.current) return;

    playSound();
    showBrowserNotification(order);

    toast({
      title: '🔔 New Order!',
      description: `${order.customer_name} - ৳${order.total?.toLocaleString() || '0'}`,
    });

    onNewOrder?.(order);
  }, [notificationsEnabled, playSound, showBrowserNotification, toast, onNewOrder]);

  const toggleNotifications = useCallback(() => {
    setNotificationsEnabled((prev) => {
      const newValue = !prev;
      localStorage.setItem('orderNotificationsEnabled', String(newValue));
      
      if (newValue) {
        requestPermission();
        toast({
          title: 'Notifications Enabled',
          description: 'You will be notified when new orders arrive',
        });
      } else {
        toast({
          title: 'Notifications Disabled',
          description: 'You will no longer receive new order notifications',
        });
      }
      
      return newValue;
    });
  }, [requestPermission, toast]);

  useEffect(() => {
    if (!enabled) return;

    if (notificationsEnabled) {
      requestPermission();
    }

    const timeout = setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 2000);

    const channel = supabase
      .channel('orders-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          handleNewOrder(payload.new as Order);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timeout);
      supabase.removeChannel(channel);
    };
  }, [enabled, notificationsEnabled, handleNewOrder, requestPermission]);

  return {
    notificationsEnabled,
    toggleNotifications,
    requestPermission,
  };
}