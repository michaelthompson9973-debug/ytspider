import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LandingPageProduct {
  id: string;
  product_id: string;
  sort_order: number;
  default_quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[] | null;
  };
}

export function useProducts(landingPageId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch products linked to this landing page
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['landing-page-products', landingPageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_page_products')
        .select(`
          id,
          product_id,
          sort_order,
          default_quantity,
          products (id, name, price, images)
        `)
        .eq('landing_page_id', landingPageId)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Transform the data to match our interface
      return (data || []).map(item => ({
        id: item.id,
        product_id: item.product_id,
        sort_order: item.sort_order,
        default_quantity: item.default_quantity,
        product: item.products as unknown as LandingPageProduct['product'],
      })) as LandingPageProduct[];
    },
    enabled: !!landingPageId,
  });

  // Fetch all available products for selection
  const { data: availableProducts = [] } = useQuery({
    queryKey: ['available-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, images')
        .eq('active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Add a product to the landing page
  const addProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const maxSortOrder = products.length > 0
        ? Math.max(...products.map(p => p.sort_order))
        : -1;

      const { error } = await supabase
        .from('landing_page_products')
        .insert({
          landing_page_id: landingPageId,
          product_id: productId,
          sort_order: maxSortOrder + 1,
          default_quantity: 1,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-page-products', landingPageId] });
      toast({ title: 'Product added' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error adding product',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Remove a product from the landing page
  const removeProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('landing_page_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-page-products', landingPageId] });
      toast({ title: 'Product removed' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error removing product',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update product default quantity
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, defaultQuantity }: { id: string; defaultQuantity: number }) => {
      const { error } = await supabase
        .from('landing_page_products')
        .update({ default_quantity: defaultQuantity })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-page-products', landingPageId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating quantity',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Reorder products
  const reorderProductsMutation = useMutation({
    mutationFn: async (reorderedProducts: LandingPageProduct[]) => {
      const updates = reorderedProducts.map((p, index) => ({
        id: p.id,
        landing_page_id: landingPageId,
        product_id: p.product_id,
        sort_order: index,
        default_quantity: p.default_quantity,
      }));

      const { error } = await supabase
        .from('landing_page_products')
        .upsert(updates, { onConflict: 'id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-page-products', landingPageId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error reordering products',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    products,
    availableProducts,
    isLoading,
    addProduct: addProductMutation.mutate,
    removeProduct: removeProductMutation.mutate,
    updateQuantity: (id: string, defaultQuantity: number) =>
      updateQuantityMutation.mutate({ id, defaultQuantity }),
    reorderProducts: reorderProductsMutation.mutate,
    isAdding: addProductMutation.isPending,
    isRemoving: removeProductMutation.isPending,
  };
}
