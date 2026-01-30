import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SendToCourierParams {
  orderId: string;
  provider: 'steadfast' | 'pathao';
  cityId?: number;
  zoneId?: number;
  areaId?: number;
  weight?: number;
  specialInstructions?: string;
}

interface SendToCourierResult {
  success: boolean;
  consignment_id?: string;
  tracking_code?: string;
  courier_status?: string;
  error?: string;
}

interface SyncStatusResult {
  success: boolean;
  courier_status?: string;
  order_status?: string;
  status_changed?: boolean;
  order_status_changed?: boolean;
  error?: string;
}

export function useCourierActions() {
  const [isSending, setIsSending] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { toast } = useToast();

  const sendToCourier = async (params: SendToCourierParams): Promise<SendToCourierResult> => {
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('courier-create-order', {
        body: params,
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: 'Error',
          description: data.error,
          variant: 'destructive',
        });
        return { success: false, error: data.error };
      }

      toast({
        title: 'Success',
        description: `Order sent to ${params.provider}. Consignment: ${data.consignment_id}`,
      });

      return {
        success: true,
        consignment_id: data.consignment_id,
        tracking_code: data.tracking_code,
        courier_status: data.courier_status,
      };
    } catch (error) {
      console.error('Error sending to courier:', error);
      const message = error instanceof Error ? error.message : 'Failed to send to courier';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return { success: false, error: message };
    } finally {
      setIsSending(false);
    }
  };

  const syncStatus = async (orderId: string): Promise<SyncStatusResult> => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('courier-sync-status', {
        body: { orderId },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: 'Error',
          description: data.error,
          variant: 'destructive',
        });
        return { success: false, error: data.error };
      }

      if (data.status_changed) {
        toast({
          title: 'Status Updated',
          description: `Courier status: ${data.courier_status}`,
        });
      } else {
        toast({
          title: 'No Change',
          description: 'Status is already up to date',
        });
      }

      return {
        success: true,
        courier_status: data.courier_status,
        order_status: data.order_status,
        status_changed: data.status_changed,
        order_status_changed: data.order_status_changed,
      };
    } catch (error) {
      console.error('Error syncing status:', error);
      const message = error instanceof Error ? error.message : 'Failed to sync status';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return { success: false, error: message };
    } finally {
      setIsSyncing(false);
    }
  };

  const authenticatePathao = async (): Promise<boolean> => {
    setIsAuthenticating(true);
    try {
      const { data, error } = await supabase.functions.invoke('pathao-auth', {
        body: {},
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: 'Authentication Failed',
          description: data.error,
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Authentication Successful',
        description: `Token valid until ${new Date(data.expires_at).toLocaleString()}`,
      });

      return true;
    } catch (error) {
      console.error('Error authenticating Pathao:', error);
      const message = error instanceof Error ? error.message : 'Failed to authenticate';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  return {
    sendToCourier,
    syncStatus,
    authenticatePathao,
    isSending,
    isSyncing,
    isAuthenticating,
  };
}
