import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { SectionBuilder } from '@/components/admin/landing-page-editor';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

export default function LandingPageBuilder() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();

  // Determine correct back path
  const isShopRoute = location.pathname.startsWith('/shop');
  const backPath = isShopRoute ? '/shop/pages/manage' : '/admin/pages/manage';

  const { data: page, isLoading } = useQuery({
    queryKey: ['landing-page-meta', pageId],
    queryFn: async () => {
      if (!pageId) return null;
      const { data, error } = await supabase
        .from('landing_pages')
        .select('id, slug, gtm_id')
        .eq('id', pageId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!pageId,
  });

  if (isLoading || !page) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[60vh] w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <SectionBuilder
        landingPageId={page.id}
        gtmId={page.gtm_id ?? undefined}
        slug={page.slug}
        onBack={() => navigate(backPath)}
      />
    </AdminLayout>
  );
}
