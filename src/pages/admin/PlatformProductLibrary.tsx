import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  TrendingUp, 
  Package, 
  Store,
  ArrowUpRight,
  Star,
  ShoppingCart
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

interface ProductWithStats {
  id: string;
  name: string;
  price: number;
  images: string[] | null;
  shop_id: string;
  shop_name: string;
  order_count: number;
  total_revenue: number;
  active: boolean;
}

export default function PlatformProductLibrary() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all products across all shops with order stats
  const { data: products, isLoading } = useQuery({
    queryKey: ['platform-products'],
    queryFn: async () => {
      // Get products with their shops
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          images,
          active,
          shop_id,
          shops!inner(name)
        `)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // Get order counts per product
      const { data: orderStats, error: orderError } = await supabase
        .from('orders')
        .select('product_id, quantity, total');

      if (orderError) throw orderError;

      // Calculate stats per product
      const statsMap = new Map<string, { count: number; revenue: number }>();
      orderStats?.forEach(order => {
        if (order.product_id) {
          const current = statsMap.get(order.product_id) || { count: 0, revenue: 0 };
          statsMap.set(order.product_id, {
            count: current.count + (order.quantity || 1),
            revenue: current.revenue + (order.total || 0),
          });
        }
      });

      // Combine data
      return (productsData || []).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        images: p.images,
        shop_id: p.shop_id,
        shop_name: (p.shops as any)?.name || 'Unknown',
        order_count: statsMap.get(p.id)?.count || 0,
        total_revenue: statsMap.get(p.id)?.revenue || 0,
        active: p.active,
      })) as ProductWithStats[];
    },
  });

  // Filter products
  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.shop_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Sort by order count (trending)
  const sortedProducts = [...filteredProducts].sort((a, b) => b.order_count - a.order_count);

  // Stats
  const totalProducts = products?.length || 0;
  const activeProducts = products?.filter(p => p.active).length || 0;
  const totalRevenue = products?.reduce((sum, p) => sum + p.total_revenue, 0) || 0;
  const trendingCount = products?.filter(p => p.order_count > 5).length || 0;

  const formatPrice = (price: number) => `৳${price.toLocaleString()}`;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">{t('sidebar.productLibrary')}</h1>
          <p className="text-muted-foreground">সব শপের প্রোডাক্ট এবং ট্রেন্ডিং বিশ্লেষণ</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">মোট প্রোডাক্ট</span>
              </div>
              <p className="text-2xl font-bold mt-1">{totalProducts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">সক্রিয়</span>
              </div>
              <p className="text-2xl font-bold mt-1">{activeProducts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-muted-foreground">ট্রেন্ডিং</span>
              </div>
              <p className="text-2xl font-bold mt-1">{trendingCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">মোট বিক্রয়</span>
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
              placeholder="প্রোডাক্ট বা শপ সার্চ করুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">সব প্রোডাক্ট</CardTitle>
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
                    <TableHead>প্রোডাক্ট</TableHead>
                    <TableHead>শপ</TableHead>
                    <TableHead className="text-right">মূল্য</TableHead>
                    <TableHead className="text-right">বিক্রিত</TableHead>
                    <TableHead className="text-right">আয়</TableHead>
                    <TableHead>স্ট্যাটাস</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProducts.slice(0, 50).map((product, index) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {index < 3 && product.order_count > 0 && (
                            <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              #{index + 1}
                            </Badge>
                          )}
                          {product.images?.[0] ? (
                            <img 
                              src={product.images[0]} 
                              alt={product.name}
                              className="h-10 w-10 object-cover rounded"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Store className="h-3.5 w-3.5" />
                          {product.shop_name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(product.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.order_count > 0 ? (
                          <span className="font-medium">{product.order_count}টি</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.total_revenue > 0 ? (
                          <span className="font-medium text-green-600">
                            {formatPrice(product.total_revenue)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.active ? 'default' : 'secondary'}>
                          {product.active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sortedProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        কোনো প্রোডাক্ট পাওয়া যায়নি
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