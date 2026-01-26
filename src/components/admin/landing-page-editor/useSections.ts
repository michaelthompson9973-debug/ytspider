import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Section, SectionType, CheckoutConfig } from './types';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

interface UpdateSectionResult {
  id: string;
  name: string;
  html: string;
  config?: CheckoutConfig | null;
}

// Helper to transform DB response to Section type
function transformSection(data: {
  id: string;
  landing_page_id: string;
  name: string;
  html: string;
  sort_order: number;
  created_at: string;
  type: string;
  config: Json;
}): Section {
  return {
    ...data,
    type: (data.type === 'checkout' ? 'checkout' : 'html') as SectionType,
    config: data.config as unknown as CheckoutConfig | null,
  };
}

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
      return (data ?? []).map(transformSection);
    },
    enabled: !!landingPageId,
  });

  const addSectionMutation = useMutation({
    mutationFn: async ({ name, html, type, config }: { name: string; html: string; type: SectionType; config: unknown }) => {
      if (!landingPageId) throw new Error('No landing page selected');
      const maxOrder = sections.length > 0 ? Math.max(...sections.map(s => s.sort_order)) : -1;
      const { data, error } = await supabase
        .from('landing_page_sections')
        .insert([{
          landing_page_id: landingPageId,
          name,
          html,
          type,
          config: config as Json,
          sort_order: maxOrder + 1,
        }])
        .select()
        .single();
      if (error) throw error;
      return transformSection(data);
    },
    onSuccess: (newSection) => {
      queryClient.invalidateQueries({ queryKey: ['landing-page-sections', landingPageId] });
      toast({ title: 'Section added' });
      return newSection;
    },
    onError: (error) => {
      toast({ title: 'Error adding section', description: error.message, variant: 'destructive' });
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({ id, name, html, config }: { id: string; name: string; html?: string; config?: CheckoutConfig | null }): Promise<UpdateSectionResult> => {
      const updateData: { name: string; html?: string; config?: Json } = { name };
      if (html !== undefined) updateData.html = html;
      if (config !== undefined) updateData.config = config as unknown as Json;
      
      const { error } = await supabase
        .from('landing_page_sections')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
      return { id, name, html: html ?? '', config };
    },
    onSuccess: (updatedData) => {
      // Update the cache immediately for better UX
      queryClient.setQueryData(
        ['landing-page-sections', landingPageId],
        (oldData: Section[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map((section) =>
            section.id === updatedData.id
              ? { ...section, name: updatedData.name, html: updatedData.html || section.html, config: updatedData.config ?? section.config }
              : section
          );
        }
      );
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
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove from cache immediately
      queryClient.setQueryData(
        ['landing-page-sections', landingPageId],
        (oldData: Section[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.filter((section) => section.id !== deletedId);
        }
      );
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
      const { data, error } = await supabase
        .from('landing_page_sections')
        .insert([{
          landing_page_id: landingPageId,
          name: `${section.name} (copy)`,
          html: section.html,
          type: section.type,
          config: section.config as unknown as Json,
          sort_order: maxOrder + 1,
        }])
        .select()
        .single();
      if (error) throw error;
      return transformSection(data);
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
      return newOrder;
    },
    onMutate: async (newOrder) => {
      // Optimistic update for better UX
      await queryClient.cancelQueries({ queryKey: ['landing-page-sections', landingPageId] });
      
      const previousSections = queryClient.getQueryData<Section[]>(['landing-page-sections', landingPageId]);
      
      if (previousSections) {
        const reorderedSections = [...previousSections].sort((a, b) => {
          const aOrder = newOrder.find(o => o.id === a.id)?.sort_order ?? a.sort_order;
          const bOrder = newOrder.find(o => o.id === b.id)?.sort_order ?? b.sort_order;
          return aOrder - bOrder;
        });
        queryClient.setQueryData(['landing-page-sections', landingPageId], reorderedSections);
      }
      
      return { previousSections };
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousSections) {
        queryClient.setQueryData(['landing-page-sections', landingPageId], context.previousSections);
      }
      toast({ title: 'Error reordering sections', description: error.message, variant: 'destructive' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-page-sections', landingPageId] });
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
