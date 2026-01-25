import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Section } from './types';
import { useToast } from '@/hooks/use-toast';

export function useSections(landingPageId: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['landing-page-sections', landingPageId],
    queryFn: async () => {
      if (!landingPageId) return [];
      const { data, error } = await supabase
        .from('landing_page_sections')
        .select('*')
        .eq('landing_page_id', landingPageId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as Section[];
    },
    enabled: !!landingPageId,
  });

  const addSectionMutation = useMutation({
    mutationFn: async ({ name, html }: { name: string; html: string }) => {
      if (!landingPageId) throw new Error('No landing page selected');
      const maxOrder = sections.length > 0 ? Math.max(...sections.map(s => s.sort_order)) : -1;
      const { data, error } = await supabase
        .from('landing_page_sections')
        .insert({
          landing_page_id: landingPageId,
          name,
          html,
          sort_order: maxOrder + 1,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-page-sections', landingPageId] });
      toast({ title: 'Section added' });
    },
    onError: (error) => {
      toast({ title: 'Error adding section', description: error.message, variant: 'destructive' });
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({ id, name, html }: { id: string; name: string; html: string }) => {
      const { error } = await supabase
        .from('landing_page_sections')
        .update({ name, html })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-page-sections', landingPageId] });
      toast({ title: 'Section updated' });
    },
    onError: (error) => {
      toast({ title: 'Error updating section', description: error.message, variant: 'destructive' });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('landing_page_sections')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-page-sections', landingPageId] });
      toast({ title: 'Section deleted' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting section', description: error.message, variant: 'destructive' });
    },
  });

  const duplicateSectionMutation = useMutation({
    mutationFn: async (section: Section) => {
      const maxOrder = sections.length > 0 ? Math.max(...sections.map(s => s.sort_order)) : -1;
      const { error } = await supabase
        .from('landing_page_sections')
        .insert({
          landing_page_id: landingPageId,
          name: `${section.name} (copy)`,
          html: section.html,
          sort_order: maxOrder + 1,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-page-sections', landingPageId] });
      toast({ title: 'Section duplicated' });
    },
    onError: (error) => {
      toast({ title: 'Error duplicating section', description: error.message, variant: 'destructive' });
    },
  });

  const reorderSectionsMutation = useMutation({
    mutationFn: async (newOrder: { id: string; sort_order: number }[]) => {
      const updates = newOrder.map(({ id, sort_order }) =>
        supabase.from('landing_page_sections').update({ sort_order }).eq('id', id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-page-sections', landingPageId] });
    },
    onError: (error) => {
      toast({ title: 'Error reordering sections', description: error.message, variant: 'destructive' });
    },
  });

  return {
    sections,
    isLoading,
    addSection: addSectionMutation.mutate,
    updateSection: updateSectionMutation.mutate,
    deleteSection: deleteSectionMutation.mutate,
    duplicateSection: duplicateSectionMutation.mutate,
    reorderSections: reorderSectionsMutation.mutate,
    isAdding: addSectionMutation.isPending,
    isUpdating: updateSectionMutation.isPending,
  };
}
