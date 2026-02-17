import { useState } from 'react';
import { ShopLayout } from '@/components/shop';
import { useShop } from '@/contexts/ShopContext';
import { useShopAnalytics } from '@/hooks/useShopAnalytics';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package, ShoppingCart, FileText, TrendingUp, Clock,
  ArrowUpRight, ArrowDownRight, BarChart3, Crown
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';

export default function ShopDashboard() {
  const { currentShop } = useShop();
  const [dateRange, setDateRange] = useState<'7d' | '30d'>('7d');
  const { kpis, chartData, topProducts, isLoading: analyticsLoading } = useShopAnalytics(dateRange);

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
    new: 'নতুন',
    pending: 'অপেক্ষমান',
    confirmed: 'কনফার্মড',
    processing: 'প্রসেসিং',
    shipped: 'শিপড',
    delivered: 'ডেলিভার্ড',
    cancelled: 'বাতিল',
    returned: 'রিটার্ন',
  };

  const ChangeIndicator = ({ value }: { value: number }) => {
    if (value === 0) return <span className="text-xs text-muted-foreground">—</span>;
    const isPositive = value > 0;
    return (
      <span className={`inline-flex items-center text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
        {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border bg-card px-3 py-2 shadow-md text-sm">
        <p className="font-medium text-card-foreground mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color }} className="text-xs">
            {entry.name === 'revenue' ? 'রেভিনিউ' : 'অর্ডার'}: {entry.name === 'revenue' ? `৳${Number(entry.value).toLocaleString()}` : entry.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <ShopLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">স্বাগতম, {currentShop?.name}!</h1>
            <p className="text-muted-foreground">আপনার শপের বিস্তারিত বিবরণ</p>
          </div>
          <Tabs value={dateRange} onValueChange={(v) => setDateRange(v as '7d' | '30d')}>
            <TabsList>
              <TabsTrigger value="7d">৭ দিন</TabsTrigger>
              <TabsTrigger value="30d">৩০ দিন</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'মোট অর্ডার', value: kpis.totalOrders, change: kpis.ordersChange, icon: ShoppingCart, format: (v: number) => v.toString() },
            { title: 'রেভিনিউ', value: kpis.totalRevenue, change: kpis.revenueChange, icon: TrendingUp, format: (v: number) => `৳${v.toLocaleString()}` },
            { title: 'প্রোডাক্ট', value: kpis.totalVisitors, change: kpis.visitorsChange, icon: Package, format: (v: number) => v.toString(), hideOnMobile: true },
            { title: 'কনভার্শন', value: kpis.conversionRate, change: kpis.conversionChange, icon: FileText, format: (v: number) => `${v.toFixed(1)}%`, hideOnMobile: true },
          ].map((kpi) => (
            <Card key={kpi.title} className={kpi.hideOnMobile ? 'hidden lg:block' : ''}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
                <kpi.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold tracking-tight">{kpi.format(kpi.value)}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <ChangeIndicator value={kpi.change} />
                      <span className="text-xs text-muted-foreground">আগের তুলনায়</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" />
                রেভিনিউ ও অর্ডার
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Skeleton className="h-[280px] w-full" />
              ) : chartData.length === 0 ? (
                <p className="text-muted-foreground text-center py-16">ডাটা নেই</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      fill="url(#revenueGradient)"
                      strokeWidth={2}
                      name="revenue"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Order Count Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="h-4 w-4" />
                দৈনিক অর্ডার
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Skeleton className="h-[280px] w-full" />
              ) : chartData.length === 0 ? (
                <p className="text-muted-foreground text-center py-16">ডাটা নেই</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} className="text-muted-foreground" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="orders"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                      name="orders"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row: Top Products + Recent Orders */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Crown className="h-4 w-4" />
                টপ সেলিং প্রোডাক্ট
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : topProducts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">এখনো ডাটা নেই</p>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((product, idx) => (
                    <div key={product.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          idx === 0 ? 'bg-amber-100 text-amber-700' :
                          idx === 1 ? 'bg-slate-100 text-slate-600' :
                          'bg-orange-50 text-orange-600'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.sold} টি বিক্রি</p>
                        </div>
                      </div>
                      <p className="font-semibold text-sm">৳{product.revenue.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                সাম্প্রতিক অর্ডার
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">এখনো কোনো অর্ডার নেই</p>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{order.customer_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: bn })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">৳{Number(order.total).toLocaleString()}</p>
                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                          order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
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
      </div>
    </ShopLayout>
  );
}
