import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { PieChartIcon } from 'lucide-react';

const statusColors: Record<string, string> = {
  new: '#3B82F6',
  confirmed: '#10B981',
  processing: '#F59E0B',
  shipped: '#8B5CF6',
  delivered: '#059669',
  cancelled: '#EF4444',
  pending: '#F97316',
};

export function OrderStatusChart() {
  const { t } = useLanguage();

  const { data: statusCounts, isLoading } = useQuery({
    queryKey: ['order-status-distribution'],
    queryFn: async () => {
      const statuses = ['new', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'pending'] as const;
      
      const counts = await Promise.all(
        statuses.map(async (status) => {
          const { count } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', status);
          return { status: status as string, count: count ?? 0 };
        })
      );

      return counts.filter((item) => item.count > 0);
    },
  });

  const chartData = useMemo(() => {
    if (!statusCounts) return [];
    return statusCounts.map((item) => ({
      name: item.status,
      value: item.count,
      color: statusColors[item.status] || '#6B7280',
    }));
  }, [statusCounts]);

  if (isLoading) {
    return <OrderStatusChartSkeleton />;
  }

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <PieChartIcon className="h-5 w-5 text-primary" />
        <CardTitle className="text-lg font-semibold">
          {t('dashboard.orderStatus')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            {t('dashboard.noOrders')}
          </div>
        ) : (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const percentage = ((data.value / total) * 100).toFixed(1);
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-lg">
                          <p className="font-medium capitalize">{data.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {data.value} ({percentage}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-sm capitalize">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function OrderStatusChartSkeleton() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <div className="h-6 w-40 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-[250px] flex items-center justify-center">
          <div className="relative animate-pulse">
            <div className="h-44 w-44 rounded-full border-[20px] border-muted" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-24 w-24 rounded-full bg-background" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
