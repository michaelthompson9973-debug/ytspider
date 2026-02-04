import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useShop } from '@/contexts/ShopContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

export interface ActivityLogEntry {
  id: string;
  shop_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export type ActionType = 
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'export'
  | 'login'
  | 'login_failed'
  | 'logout'
  | 'invite'
  | 'role_change'
  | 'settings_change'
  | 'theme_change';

export type EntityType = 
  | 'product'
  | 'order'
  | 'landing_page'
  | 'section'
  | 'messenger'
  | 'team_member'
  | 'shop_settings'
  | 'shop_theme'
  | 'invitation'
  | 'security';

interface LogActivityParams {
  action: ActionType;
  entityType: EntityType;
  entityId?: string;
  oldData?: Json;
  newData?: Json;
}

export function useActivityLog() {
  const { currentShop } = useShop();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch activity logs
  const { data: logs = [], isLoading, error, refetch } = useQuery({
    queryKey: ['activity-log', currentShop?.id],
    queryFn: async () => {
      if (!currentShop) return [];

      const { data, error } = await supabase
        .from('shop_activity_log')
        .select('*')
        .eq('shop_id', currentShop.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as ActivityLogEntry[];
    },
    enabled: !!currentShop,
  });

  // Log an activity
  const logMutation = useMutation({
    mutationFn: async (params: LogActivityParams) => {
      if (!currentShop || !user) {
        console.warn('Cannot log activity: no shop or user');
        return;
      }

      const insertData = {
        shop_id: currentShop.id,
        user_id: user.id,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId || null,
        old_data: params.oldData || null,
        new_data: params.newData || null,
        user_agent: navigator.userAgent,
      };

      const { error } = await supabase
        .from('shop_activity_log')
        .insert([insertData]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-log', currentShop?.id] });
    },
  });

  // Helper function to log activity
  const logActivity = (params: LogActivityParams) => {
    return logMutation.mutateAsync(params);
  };

  // Get logs filtered by entity type
  const getLogsByEntity = (entityType: EntityType) => {
    return logs.filter(log => log.entity_type === entityType);
  };

  // Get logs filtered by action
  const getLogsByAction = (action: ActionType) => {
    return logs.filter(log => log.action === action);
  };

  // Get recent logs (last 24 hours)
  const getRecentLogs = () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return logs.filter(log => new Date(log.created_at) > oneDayAgo);
  };

  return {
    logs,
    isLoading,
    error,
    refetch,
    logActivity,
    isLogging: logMutation.isPending,
    getLogsByEntity,
    getLogsByAction,
    getRecentLogs,
  };
}

// Utility hook for auto-logging on mutations
export function useLoggedMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    action: ActionType;
    entityType: EntityType;
    getEntityId?: (variables: TVariables, data: TData) => string;
    getOldData?: (variables: TVariables) => Json;
    getNewData?: (variables: TVariables, data: TData) => Json;
  }
) {
  const { logActivity } = useActivityLog();

  return useMutation({
    mutationFn,
    onSuccess: async (data, variables) => {
      await logActivity({
        action: options.action,
        entityType: options.entityType,
        entityId: options.getEntityId?.(variables, data),
        oldData: options.getOldData?.(variables),
        newData: options.getNewData?.(variables, data),
      });
    },
  });
}
