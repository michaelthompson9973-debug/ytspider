import { ShopLayout } from '@/components/shop';
import { useShop } from '@/contexts/ShopContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, ShoppingCart, FileText, TrendingUp, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';

export default function ShopDashboard() {
  const { currentShop } = useShop();

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['shop-dashboard-stats', currentShop?.id],
    queryFn: async () => {
      if (!currentShop) return null;
      
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const [ordersResult, productsResult, pagesResult] = await Promise.all([
        supabase
          .from('orders')
          .select('id, total, created_at')
          .eq('shop_id', currentShop.id)
          .gte('created_at', startOfMonth.toISOString()),
        supabase
          .from('products')
          .select('id')
          .eq('shop_id', currentShop.id)
          .eq('active', true),
        supabase
          .from('landing_pages')
          .select('id')
          .eq('shop_id', currentShop.id)
          .eq('published', true),
      ]);

      const orders = ordersResult.data ?? [];
      const revenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

      return {
        ordersThisMonth: orders.length,
        activeProducts: productsResult.data?.length ?? 0,
        publishedPages: pagesResult.data?.length ?? 0,
        revenueThisMonth: revenue,
      };
    },
    enabled: !!currentShop,
  });

  // Fetch recent orders
  const { data: recentOrders = [] } = useQuery({
    queryKey: ['shop-recent-orders', currentShop?.id],
    queryFn: async () => {
      if (!currentShop) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('id, customer_name, total, status, created_at')
        .eq('shop_id', currentShop.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!currentShop,
  });

  const statusLabels: Record<string, string> = {
    pending: 'অপেক্ষমান',
    confirmed: 'কনফার্মড',
    processing: 'প্রসেসিং',
    shipped: 'শিপড',
    delivered: 'ডেলিভার্ড',
    cancelled: 'বাতিল',
    returned: 'রিটার্ন',
  };

  return (
    <ShopLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">স্বাগতম, {currentShop?.name}!</h1>
          <p className="text-muted-foreground">আপনার শপের সংক্ষিপ্ত বিবরণ</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">মোট অর্ডার</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.ordersThisMonth ?? 0}</div>
                  <p className="text-xs text-muted-foreground">এই মাসে</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">প্রোডাক্ট</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.activeProducts ?? 0}</div>
                  <p className="text-xs text-muted-foreground">সক্রিয় প্রোডাক্ট</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ল্যান্ডিং পেজ</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.publishedPages ?? 0}</div>
                  <p className="text-xs text-muted-foreground">পাবলিশড</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">রেভিনিউ</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">৳{(stats?.revenueThisMonth ?? 0).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">এই মাসে</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              সাম্প্রতিক অর্ডার
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                এখনো কোনো অর্ডার নেই
              </p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: bn })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">৳{Number(order.total).toLocaleString()}</p>
                      <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ShopLayout>
  );
}
