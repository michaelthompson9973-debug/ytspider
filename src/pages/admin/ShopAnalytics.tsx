import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useShop } from '@/contexts/ShopContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, TrendingDown, Users, ShoppingCart, Eye, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const mockChartData = [
  { date: 'Jan 28', visitors: 1200, orders: 45 },
  { date: 'Jan 29', visitors: 1350, orders: 52 },
  { date: 'Jan 30', visitors: 1100, orders: 38 },
  { date: 'Jan 31', visitors: 1450, orders: 61 },
  { date: 'Feb 1', visitors: 1800, orders: 78 },
  { date: 'Feb 2', visitors: 1650, orders: 65 },
  { date: 'Feb 3', visitors: 1900, orders: 82 },
];

const mockTopPages = [
  { path: '/p/winter-jacket', views: 4520, conversion: '4.2%' },
  { path: '/p/summer-sale', views: 3180, conversion: '3.8%' },
  { path: '/p/bundle-offer', views: 2450, conversion: '5.1%' },
  { path: '/p/new-arrivals', views: 1890, conversion: '2.9%' },
];

const mockTopProducts = [
  { name: 'Premium Winter Jacket', sold: 156, revenue: 234000 },
  { name: 'Summer T-Shirt Pack', sold: 142, revenue: 71000 },
  { name: 'Casual Sneakers', sold: 98, revenue: 196000 },
  { name: 'Denim Jeans', sold: 87, revenue: 130500 },
];

export default function ShopAnalytics() {
  const { t } = useLanguage();
  const { currentShop } = useShop();
  const [dateRange, setDateRange] = useState('7d');

  if (!currentShop) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No shop selected</p>
        </div>
      </AdminLayout>
    );
  }

  const stats = [
    { label: 'Total Visitors', value: '12,450', change: '+12%', up: true, icon: Users },
    { label: 'Total Orders', value: '856', change: '+8%', up: true, icon: ShoppingCart },
    { label: 'Conversion Rate', value: '3.2%', change: '+0.5%', up: true, icon: Eye },
    { label: 'Revenue', value: '৳4,52,000', change: '+15%', up: true, icon: DollarSign },
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
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockChartData}>
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
              <div className="space-y-4">
                {mockTopPages.map((page, idx) => (
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
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>Best selling products by units sold</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTopProducts.map((product, idx) => (
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
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
