import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  FileText, 
  Store,
  ExternalLink,
  ShoppingCart,
  Eye,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface LandingPageWithStats {
  id: string;
  slug: string;
  published: boolean;
  shop_id: string;
  shop_name: string;
  order_count: number;
  total_revenue: number;
  created_at: string;
}

export default function PlatformLandingPageLibrary() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all landing pages across all shops with order stats
  const { data: pages, isLoading } = useQuery({
    queryKey: ['platform-landing-pages'],
    queryFn: async () => {
      // Get landing pages with their shops
      const { data: pagesData, error: pagesError } = await supabase
        .from('landing_pages')
        .select(`
          id,
          slug,
          published,
          created_at,
          shop_id,
          shops!inner(name)
        `)
        .order('created_at', { ascending: false });

      if (pagesError) throw pagesError;

      // Get order counts per landing page
      const { data: orderStats, error: orderError } = await supabase
        .from('orders')
        .select('landing_page_id, quantity, total');

      if (orderError) throw orderError;

      // Calculate stats per page
      const statsMap = new Map<string, { count: number; revenue: number }>();
      orderStats?.forEach(order => {
        if (order.landing_page_id) {
          const current = statsMap.get(order.landing_page_id) || { count: 0, revenue: 0 };
          statsMap.set(order.landing_page_id, {
            count: current.count + 1,
            revenue: current.revenue + (order.total || 0),
          });
        }
      });

      // Combine data
      return (pagesData || []).map(p => ({
        id: p.id,
        slug: p.slug,
        published: p.published,
        shop_id: p.shop_id,
        shop_name: (p.shops as any)?.name || 'Unknown',
        order_count: statsMap.get(p.id)?.count || 0,
        total_revenue: statsMap.get(p.id)?.revenue || 0,
        created_at: p.created_at,
      })) as LandingPageWithStats[];
    },
  });

  // Filter pages
  const filteredPages = pages?.filter(p => 
    p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.shop_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Sort by order count (best performing)
  const sortedPages = [...filteredPages].sort((a, b) => b.order_count - a.order_count);

  // Stats
  const totalPages = pages?.length || 0;
  const publishedPages = pages?.filter(p => p.published).length || 0;
  const totalOrders = pages?.reduce((sum, p) => sum + p.order_count, 0) || 0;
  const totalRevenue = pages?.reduce((sum, p) => sum + p.total_revenue, 0) || 0;

  const formatPrice = (price: number) => `৳${price.toLocaleString()}`;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">{t('sidebar.landingPageLibrary')}</h1>
          <p className="text-muted-foreground">সব শপের ল্যান্ডিং পেজ এবং পারফরম্যান্স</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">মোট পেজ</span>
              </div>
              <p className="text-2xl font-bold mt-1">{totalPages}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">পাবলিশড</span>
              </div>
              <p className="text-2xl font-bold mt-1">{publishedPages}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">মোট অর্ডার</span>
              </div>
              <p className="text-2xl font-bold mt-1">{totalOrders}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-muted-foreground">মোট আয়</span>
              </div>
              <p className="text-2xl font-bold mt-1">{formatPrice(totalRevenue)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="পেজ বা শপ সার্চ করুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Pages Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">সব ল্যান্ডিং পেজ</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>স্লাগ</TableHead>
                    <TableHead>শপ</TableHead>
                    <TableHead className="text-right">অর্ডার</TableHead>
                    <TableHead className="text-right">আয়</TableHead>
                    <TableHead>স্ট্যাটাস</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPages.slice(0, 50).map((page, index) => (
                    <TableRow key={page.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {index < 3 && page.order_count > 0 && (
                            <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              #{index + 1}
                            </Badge>
                          )}
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            /{page.slug}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Store className="h-3.5 w-3.5" />
                          {page.shop_name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {page.order_count > 0 ? (
                          <span className="font-medium">{page.order_count}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {page.total_revenue > 0 ? (
                          <span className="font-medium text-green-600">
                            {formatPrice(page.total_revenue)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={page.published ? 'default' : 'secondary'}>
                          {page.published ? 'পাবলিশড' : 'ড্রাফট'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {page.published && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={`/p/${page.slug}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {sortedPages.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        কোনো ল্যান্ডিং পেজ পাওয়া যায়নি
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}