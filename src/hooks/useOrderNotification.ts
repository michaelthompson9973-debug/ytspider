import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Order } from '@/components/admin/orders/types';

// Base64 encoded notification sound (short beep)
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

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }, []);

  // Play notification sound
  const playSound = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(NOTIFICATION_SOUND);
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {
      // Ignore autoplay errors
    });
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((order: Order) => {
    if (Notification.permission === 'granted') {
      const notification = new Notification('নতুন অর্ডার!', {
        body: `${order.customer_name} - ৳${order.total?.toLocaleString('bn-BD') || '0'}`,
        icon: '/favicon.ico',
        tag: order.id, // Prevents duplicate notifications
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    }
  }, []);

  // Handle new order
  const handleNewOrder = useCallback((order: Order) => {
    if (!notificationsEnabled) return;
    
    // Skip initial load
    if (isInitialLoadRef.current) return;

    // Play sound
    playSound();

    // Show browser notification
    showBrowserNotification(order);

    // Show toast
    toast({
      title: '🔔 নতুন অর্ডার!',
      description: `${order.customer_name} - ৳${order.total?.toLocaleString('bn-BD') || '0'}`,
    });

    // Callback
    onNewOrder?.(order);
  }, [notificationsEnabled, playSound, showBrowserNotification, toast, onNewOrder]);

  // Toggle notifications
  const toggleNotifications = useCallback(() => {
    setNotificationsEnabled((prev) => {
      const newValue = !prev;
      localStorage.setItem('orderNotificationsEnabled', String(newValue));
      
      if (newValue) {
        requestPermission();
        toast({
          title: 'নোটিফিকেশন চালু',
          description: 'নতুন অর্ডার আসলে আপনাকে জানানো হবে',
        });
      } else {
        toast({
          title: 'নোটিফিকেশন বন্ধ',
          description: 'নতুন অর্ডারের নোটিফিকেশন আর আসবে না',
        });
      }
      
      return newValue;
    });
  }, [requestPermission, toast]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!enabled) return;

    // Request permission on mount if enabled
    if (notificationsEnabled) {
      requestPermission();
    }

    // Mark initial load complete after a delay
    const timeout = setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 2000);

    // Subscribe to new orders
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
