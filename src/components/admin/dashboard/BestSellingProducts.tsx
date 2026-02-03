import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Trophy, ArrowRight, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProductSale {
  id: string;
  name: string;
  images: string[] | null;
  total_sold: number;
  revenue: number;
}

export function BestSellingProducts() {
  const { t } = useLanguage();

  const { data: products, isLoading } = useQuery({
    queryKey: ['best-selling-products'],
    queryFn: async () => {
      // Get all orders with product info
      const { data: orders, error } = await supabase
        .from('orders')
        .select('product_id, quantity, total, products(id, name, images)')
        .not('product_id', 'is', null);

      if (error) throw error;

      // Aggregate by product
      const productMap = new Map<string, ProductSale>();

      orders?.forEach((order) => {
        if (!order.products || !order.product_id) return;

        const existing = productMap.get(order.product_id);
        if (existing) {
          existing.total_sold += order.quantity;
          existing.revenue += Number(order.total) || 0;
        } else {
          productMap.set(order.product_id, {
            id: order.product_id,
            name: order.products.name,
            images: order.products.images,
            total_sold: order.quantity,
            revenue: Number(order.total) || 0,
          });
        }
      });

      // Sort by total_sold and take top 5
      return Array.from(productMap.values())
        .sort((a, b) => b.total_sold - a.total_sold)
        .slice(0, 5);
    },
  });

  if (isLoading) {
    return <BestSellingProductsSkeleton />;
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-lg font-semibold">
            {t('dashboard.bestSelling')}
          </CardTitle>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/products" className="flex items-center gap-1">
            {t('dashboard.viewAll')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {!products || products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mb-2 opacity-50" />
            <p>{t('products.noProducts')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                  {index + 1}
                </div>
                <div className="flex-shrink-0">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {product.total_sold} {t('dashboard.sold')} • ৳
                    {product.revenue.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function BestSellingProductsSkeleton() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        <div className="h-8 w-24 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
              <div className="h-10 w-10 rounded-lg bg-muted" />
              <div className="h-12 w-12 rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-3 w-24 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
