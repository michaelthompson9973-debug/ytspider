import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CustomerProfile, CustomerLabel } from '../types';
import { useToast } from '@/hooks/use-toast';

export function useCustomerProfile(psid: string | null, connectionId: string | null) {
  return useQuery({
    queryKey: ['customer-profile', psid, connectionId],
    queryFn: async (): Promise<CustomerProfile | null> => {
      if (!psid || !connectionId) return null;

      const { data, error } = await supabase
        .from('customer_profiles')
        .select(`
          *,
          labels:customer_label_assignments(
            *,
            label:customer_labels(*)
          )
        `)
        .eq('psid', psid)
        .eq('connection_id', connectionId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        // Transform nested labels - handle Json type from Supabase
        const transformedLabels = data.labels?.map((assignment: Record<string, unknown>) => {
          const label = assignment.label as Record<string, unknown>;
          return {
            id: label.id as string,
            name: label.name as string,
            color: label.color as string,
            description: label.description as string | null,
            is_system: label.is_system as boolean,
            auto_rule: label.auto_rule as Record<string, unknown> | null,
            created_at: label.created_at as string,
          } as CustomerLabel;
        }) || [];
        return { 
          ...data, 
          labels: transformedLabels,
          metadata: (data.metadata || {}) as Record<string, unknown>,
        } as CustomerProfile;
      }
      
      return null;
    },
    enabled: !!psid && !!connectionId,
  });
}

export function useCreateOrUpdateCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (customer: { 
      psid: string; 
      connection_id: string;
      name?: string;
      phone?: string;
      email?: string;
      address?: string;
      city?: string;
    }) => {
      const { data: existing } = await supabase
        .from('customer_profiles')
        .select('id')
        .eq('psid', customer.psid)
        .eq('connection_id', customer.connection_id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('customer_profiles')
          .update({
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            address: customer.address,
            city: customer.city,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
        return existing.id;
      } else {
        const { data, error } = await supabase
          .from('customer_profiles')
          .insert({
            psid: customer.psid,
            connection_id: customer.connection_id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            address: customer.address,
            city: customer.city,
            first_contact_at: new Date().toISOString(),
            last_contact_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (error) throw error;
        return data.id;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-profile'] });
      toast({
        title: 'সফল',
        description: 'কাস্টমার তথ্য আপডেট হয়েছে',
      });
    },
    onError: (error) => {
      toast({
        title: 'ব্যর্থ',
        description: error instanceof Error ? error.message : 'অজানা সমস্যা',
        variant: 'destructive',
      });
    },
  });
}

export function useCustomerLabels() {
  return useQuery({
    queryKey: ['customer-labels'],
    queryFn: async (): Promise<CustomerLabel[]> => {
      const { data, error } = await supabase
        .from('customer_labels')
        .select('*')
        .order('is_system', { ascending: false })
        .order('name');

      if (error) throw error;
      return data as CustomerLabel[];
    },
  });
}

export function useAssignLabelToCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, labelId }: { customerId: string; labelId: string }) => {
      const { error } = await supabase
        .from('customer_label_assignments')
        .upsert(
          { customer_id: customerId, label_id: labelId },
          { onConflict: 'customer_id,label_id' }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-profile'] });
    },
  });
}

export function useRemoveLabelFromCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, labelId }: { customerId: string; labelId: string }) => {
      const { error } = await supabase
        .from('customer_label_assignments')
        .delete()
        .eq('customer_id', customerId)
        .eq('label_id', labelId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-profile'] });
    },
  });
}

export function useCustomerOrders(customerId: string | null) {
  return useQuery({
    queryKey: ['customer-orders', customerId],
    queryFn: async () => {
      if (!customerId) return [];

      // Get customer phone first
      const { data: customer } = await supabase
        .from('customer_profiles')
        .select('phone')
        .eq('id', customerId)
        .single();

      if (!customer?.phone) return [];

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_phone', customer.phone)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });
}
