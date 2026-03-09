import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useShop } from '@/contexts/ShopContext';
import { useShopAnalytics } from '@/hooks/useShopAnalytics';
import { DynamicLayout } from '@/components/DynamicLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, TrendingUp, TrendingDown, Users, ShoppingCart, Eye, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ShopAnalytics() {
  const { t } = useLanguage();
  const { currentShop } = useShop();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'custom'>('7d');
  
  const { kpis, chartData, topPages, topProducts, isLoading } = useShopAnalytics(dateRange);

  if (!currentShop) {
    return (
      <DynamicLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No shop selected</p>
        </div>
      </AdminLayout>
    );
  }

  const stats = [
    { 
      label: 'Total Visitors', 
      value: kpis.totalVisitors.toLocaleString(), 
      change: `${kpis.visitorsChange >= 0 ? '+' : ''}${kpis.visitorsChange.toFixed(0)}%`, 
      up: kpis.visitorsChange >= 0, 
      icon: Users 
    },
    { 
      label: 'Total Orders', 
      value: kpis.totalOrders.toLocaleString(), 
      change: `${kpis.ordersChange >= 0 ? '+' : ''}${kpis.ordersChange.toFixed(0)}%`, 
      up: kpis.ordersChange >= 0, 
      icon: ShoppingCart 
    },
    { 
      label: 'Conversion Rate', 
      value: `${kpis.conversionRate.toFixed(1)}%`, 
      change: `${kpis.conversionChange >= 0 ? '+' : ''}${kpis.conversionChange.toFixed(1)}%`, 
      up: kpis.conversionChange >= 0, 
      icon: Eye 
    },
    { 
      label: 'Revenue', 
      value: `৳${kpis.totalRevenue.toLocaleString()}`, 
      change: `${kpis.revenueChange >= 0 ? '+' : ''}${kpis.revenueChange.toFixed(0)}%`, 
      up: kpis.revenueChange >= 0, 
      icon: DollarSign 
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">{t('sidebar.shopAnalytics')}</h1>
              <p className="text-muted-foreground">Track your shop's performance</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={dateRange === '7d' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setDateRange('7d')}
            >
              Last 7 Days
            </Button>
            <Button 
              variant={dateRange === '30d' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setDateRange('30d')}
            >
              Last 30 Days
            </Button>
            <Button 
              variant={dateRange === 'custom' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setDateRange('custom')}
            >
              Custom Range
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-5" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <stat.icon className="h-5 w-5 text-muted-foreground" />
                      <div className={`flex items-center gap-1 text-sm ${stat.up ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        {stat.change}
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Traffic Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Traffic & Orders</CardTitle>
            <CardDescription>Daily visitors and orders over time</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : chartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available for this period
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis yAxisId="left" className="text-xs" />
                    <YAxis yAxisId="right" orientation="right" className="text-xs" />
                    <Tooltip />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="visitors" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Visitors"
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="orders" 
                      stroke="hsl(var(--chart-2))" 
                      strokeWidth={2}
                      name="Orders"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Two Column Layout */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Landing Pages */}
          <Card>
            <CardHeader>
              <CardTitle>Top Landing Pages</CardTitle>
              <CardDescription>Most visited pages by views</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-10 w-48" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))}
                </div>
              ) : topPages.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No landing pages data yet
                </div>
              ) : (
                <div className="space-y-4">
                  {topPages.map((page, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground font-mono text-sm">{idx + 1}</span>
                        <div>
                          <p className="font-medium text-sm">{page.path}</p>
                          <p className="text-xs text-muted-foreground">{page.views.toLocaleString()} views</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-green-600">{page.conversion}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>Best selling products by units sold</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-10 w-48" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : topProducts.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No sales data yet
                </div>
              ) : (
                <div className="space-y-4">
                  {topProducts.map((product, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground font-mono text-sm">{idx + 1}</span>
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.sold} sold</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium">৳{product.revenue.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
