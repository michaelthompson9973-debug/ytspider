import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PricingPlan {
  id: string;
  name: string;
  name_en: string;
  slug: string;
  description: string | null;
  description_en: string | null;
  price_monthly: number;
  price_yearly: number | null;
  currency: string;
  duration_days: number;
  max_shops: number;
  max_orders_per_month: number | null;
  max_team_members: number;
  max_landing_pages: number;
  max_products: number;
  features: string[];
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  is_featured: boolean;
  is_active: boolean;
  is_contact_sales: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PricingPlanInput {
  name: string;
  name_en: string;
  slug: string;
  description?: string;
  description_en?: string;
  price_monthly: number;
  price_yearly?: number;
  currency?: string;
  duration_days: number;
  max_shops: number;
  max_orders_per_month?: number | null;
  max_team_members: number;
  max_landing_pages: number;
  max_products: number;
  features?: string[];
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
  is_featured?: boolean;
  is_active?: boolean;
  is_contact_sales?: boolean;
  sort_order?: number;
}

export function usePricingPlans(activeOnly = false) {
  return useQuery({
    queryKey: ['pricing-plans', activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('pricing_plans')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as PricingPlan[];
    },
  });
}

export function usePricingPlan(slug: string) {
  return useQuery({
    queryKey: ['pricing-plan', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      return data as PricingPlan;
    },
    enabled: !!slug,
  });
}

export function useCreatePricingPlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (input: PricingPlanInput) => {
      const { data, error } = await supabase
        .from('pricing_plans')
        .insert(input)
        .select()
        .single();
      
      if (error) throw error;
      return data as PricingPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
      toast({
        title: 'Plan Created',
        description: 'New pricing plan has been created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create pricing plan',
        variant: 'destructive',
      });
      console.error('Error creating plan:', error);
    },
  });
}

export function useUpdatePricingPlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: PricingPlanInput & { id: string }) => {
      const { data, error } = await supabase
        .from('pricing_plans')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as PricingPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
      toast({
        title: 'Plan Updated',
        description: 'Pricing plan has been updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update pricing plan',
        variant: 'destructive',
      });
      console.error('Error updating plan:', error);
    },
  });
}

export function useDeletePricingPlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pricing_plans')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
      toast({
        title: 'Plan Deleted',
        description: 'Pricing plan has been deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete pricing plan',
        variant: 'destructive',
      });
      console.error('Error deleting plan:', error);
    },
  });
}

export function isUnlimited(value: number | null): boolean {
  return value === null || value >= 999999;
}

export function formatLimit(value: number | null, unlimitedText = 'Unlimited'): string {
  if (isUnlimited(value)) return unlimitedText;
  return value?.toLocaleString() || '0';
}
