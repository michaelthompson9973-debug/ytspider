import AdminLayout from '@/components/admin/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  Palette,
  Store,
  CheckCircle,
  Clock,
  Eye,
  Plus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface ComponentWithShop {
  id: string;
  name: string;
  category: string;
  is_approved: boolean;
  usage_count: number;
  shop_id: string | null;
  shop_name: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

export default function PlatformComponentLibrary() {
  const { t } = useLanguage();

  // Fetch all components
  const { data: components, isLoading } = useQuery({
    queryKey: ['platform-components'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('component_library')
        .select(`
          id,
          name,
          category,
          is_approved,
          usage_count,
          shop_id,
          thumbnail_url,
          created_at,
          shops(name)
        `)
        .order('usage_count', { ascending: false });

      if (error) throw error;

      return (data || []).map(c => ({
        id: c.id,
        name: c.name,
        category: c.category,
        is_approved: c.is_approved,
        usage_count: c.usage_count || 0,
        shop_id: c.shop_id,
        shop_name: c.shop_id ? (c.shops as any)?.name : null,
        thumbnail_url: c.thumbnail_url,
        created_at: c.created_at,
      })) as ComponentWithShop[];
    },
  });

  // Stats
  const totalComponents = components?.length || 0;
  const platformComponents = components?.filter(c => !c.shop_id).length || 0;
  const shopComponents = components?.filter(c => c.shop_id).length || 0;
  const pendingApproval = components?.filter(c => c.shop_id && !c.is_approved).length || 0;

  // Group by type
  const platformLibrary = components?.filter(c => !c.shop_id) || [];
  const shopContributions = components?.filter(c => c.shop_id) || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('sidebar.componentLibrary')}</h1>
            <p className="text-muted-foreground">প্ল্যাটফর্ম কম্পোনেন্ট এবং শপ কন্ট্রিবিউশন</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            নতুন কম্পোনেন্ট
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">মোট কম্পোনেন্ট</span>
              </div>
              <p className="text-2xl font-bold mt-1">{totalComponents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">প্ল্যাটফর্ম</span>
              </div>
              <p className="text-2xl font-bold mt-1">{platformComponents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">শপ থেকে</span>
              </div>
              <p className="text-2xl font-bold mt-1">{shopComponents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-muted-foreground">অনুমোদন বাকি</span>
              </div>
              <p className="text-2xl font-bold mt-1">{pendingApproval}</p>
            </CardContent>
          </Card>
        </div>

        {/* Platform Library */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="h-5 w-5" />
              প্ল্যাটফর্ম লাইব্রেরী
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : platformLibrary.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {platformLibrary.map((component) => (
                  <Card key={component.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                    <div className="aspect-video bg-muted relative">
                      {component.thumbnail_url ? (
                        <img 
                          src={component.thumbnail_url} 
                          alt={component.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Palette className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <Badge className="absolute top-2 right-2" variant="secondary">
                        {component.category}
                      </Badge>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-medium truncate">{component.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Eye className="h-3 w-3" />
                        {component.usage_count} বার ব্যবহৃত
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                কোনো প্ল্যাটফর্ম কম্পোনেন্ট নেই
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shop Contributions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Store className="h-5 w-5" />
              শপ কন্ট্রিবিউশন
              {pendingApproval > 0 && (
                <Badge variant="outline" className="ml-2 bg-orange-50 text-orange-600">
                  {pendingApproval} অনুমোদন বাকি
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : shopContributions.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {shopContributions.map((component) => (
                  <Card key={component.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                    <div className="aspect-video bg-muted relative">
                      {component.thumbnail_url ? (
                        <img 
                          src={component.thumbnail_url} 
                          alt={component.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Palette className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 right-2 flex justify-between">
                        <Badge variant="secondary">
                          {component.category}
                        </Badge>
                        {!component.is_approved && (
                          <Badge className="bg-orange-100 text-orange-600 border-orange-200">
                            <Clock className="h-3 w-3 mr-1" />
                            অপেক্ষমান
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-medium truncate">{component.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Store className="h-3 w-3" />
                        {component.shop_name}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                কোনো শপ কন্ট্রিবিউশন নেই
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}