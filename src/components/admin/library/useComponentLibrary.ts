import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LibraryComponent } from './types';

export function useComponentLibrary() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: components = [], isLoading } = useQuery({
    queryKey: ['component-library', selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('component_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LibraryComponent[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (component: { name: string; category: string; html: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('component_library')
        .insert({
          name: component.name,
          category: component.category,
          html: component.html,
          created_by: userData.user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['component-library'] });
      toast.success('Component added to library');
    },
    onError: (error) => {
      toast.error('Failed to add component: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LibraryComponent> & { id: string }) => {
      const { error } = await supabase
        .from('component_library')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['component-library'] });
      toast.success('Component updated');
    },
    onError: (error) => {
      toast.error('Failed to update component: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('component_library')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['component-library'] });
      toast.success('Component deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete component: ' + error.message);
    },
  });

  return {
    components,
    isLoading,
    selectedCategory,
    setSelectedCategory,
    createComponent: createMutation.mutate,
    updateComponent: updateMutation.mutate,
    deleteComponent: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
