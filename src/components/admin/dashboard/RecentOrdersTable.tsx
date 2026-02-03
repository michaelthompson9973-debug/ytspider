import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Clock, ArrowRight, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { bn, enUS } from 'date-fns/locale';

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  processing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  pending: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

export function RecentOrdersTable() {
  const { t, language } = useLanguage();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['recent-orders-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          customer_name,
          customer_city,
          status,
          total,
          created_at,
          products (name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <RecentOrdersTableSkeleton />;
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold">
            {t('dashboard.recentOrders')}
          </CardTitle>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/orders" className="flex items-center gap-1">
            {t('dashboard.viewAll')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {!orders || orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <ShoppingBag className="h-12 w-12 mb-2 opacity-50" />
            <p>{t('dashboard.noOrders')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left text-xs font-medium text-muted-foreground">
                    {t('orders.customer')}
                  </th>
                  <th className="py-2 text-left text-xs font-medium text-muted-foreground">
                    {t('orders.product')}
                  </th>
                  <th className="py-2 text-left text-xs font-medium text-muted-foreground">
                    {t('orders.total')}
                  </th>
                  <th className="py-2 text-left text-xs font-medium text-muted-foreground">
                    {t('common.status')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr
                    key={order.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors animate-in fade-in slide-in-from-top-1"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="py-1.5">
                      <div>
                        <p className="text-sm font-heading">{order.customer_name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(order.created_at), {
                            addSuffix: true,
                            locale: language === 'bn' ? bn : enUS,
                          })}
                        </p>
                      </div>
                    </td>
                    <td className="py-1.5">
                      <p className="text-sm truncate max-w-[150px]">
                        {order.products?.name ?? '-'}
                      </p>
                    </td>
                    <td className="py-1.5 text-sm">
                      ৳{order.total?.toLocaleString() ?? 0}
                    </td>
                    <td className="py-1.5">
                      <Badge
                        variant="secondary"
                        className={`text-[11px] px-1.5 py-0 ${statusColors[order.status] || ''}`}
                      >
                        {order.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RecentOrdersTableSkeleton() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="h-6 w-40 bg-muted rounded animate-pulse" />
        <div className="h-8 w-24 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              {[1, 2, 3, 4].map((i) => (
                <th key={i} className="py-3">
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b animate-pulse">
                <td className="py-3">
                  <div className="space-y-1">
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-3 w-16 bg-muted rounded" />
                  </div>
                </td>
                <td className="py-3">
                  <div className="h-4 w-32 bg-muted rounded" />
                </td>
                <td className="py-3">
                  <div className="h-4 w-16 bg-muted rounded" />
                </td>
                <td className="py-3">
                  <div className="h-6 w-20 bg-muted rounded-full" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
