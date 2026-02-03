import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { TrendingUp } from 'lucide-react';
import { format, subDays } from 'date-fns';

type DateRange = '7days' | '30days';

export function SalesChart() {
  const { t } = useLanguage();
  const [dateRange, setDateRange] = useState<DateRange>('7days');

  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales-chart', dateRange],
    queryFn: async () => {
      const daysAgo = dateRange === '7days' ? 7 : 30;
      const startDate = subDays(new Date(), daysAgo).toISOString();

      const { data, error } = await supabase
        .from('orders')
        .select('created_at, total')
        .gte('created_at', startDate)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const chartData = useMemo(() => {
    if (!salesData) return [];

    const daysAgo = dateRange === '7days' ? 7 : 30;
    const grouped: Record<string, { date: string; revenue: number; orders: number }> = {};

    // Initialize all days
    for (let i = daysAgo - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      grouped[date] = { date, revenue: 0, orders: 0 };
    }

    // Fill with actual data
    salesData.forEach((order) => {
      const date = format(new Date(order.created_at), 'yyyy-MM-dd');
      if (grouped[date]) {
        grouped[date].revenue += Number(order.total) || 0;
        grouped[date].orders += 1;
      }
    });

    return Object.values(grouped).map((item) => ({
      ...item,
      displayDate: format(new Date(item.date), 'dd MMM'),
    }));
  }, [salesData, dateRange]);

  if (isLoading) {
    return <SalesChartSkeleton />;
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold">
            {t('dashboard.salesOverview')}
          </CardTitle>
        </div>
        <div className="flex gap-1">
          <Button
            variant={dateRange === '7days' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setDateRange('7days')}
          >
            {t('dashboard.last7Days')}
          </Button>
          <Button
            variant={dateRange === '30days' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setDateRange('30days')}
          >
            {t('dashboard.last30Days')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="displayDate"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `৳${value}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-lg">
                        <p className="font-medium">৳{payload[0].value}</p>
                        <p className="text-xs text-muted-foreground">
                          {payload[0].payload.displayDate}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function SalesChartSkeleton() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="h-6 w-40 bg-muted rounded animate-pulse" />
        <div className="flex gap-1">
          <div className="h-8 w-20 bg-muted rounded animate-pulse" />
          <div className="h-8 w-20 bg-muted rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] bg-muted/30 rounded-lg animate-pulse flex items-end gap-1 p-4">
          {[40, 60, 35, 80, 45, 70, 55].map((h, i) => (
            <div
              key={i}
              style={{ height: `${h}%` }}
              className="flex-1 bg-muted rounded-t"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
