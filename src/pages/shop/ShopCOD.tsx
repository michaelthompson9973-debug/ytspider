import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useShop } from '@/contexts/ShopContext';
import { ShopLayout } from '@/components/shop';
import { ShopGuard } from '@/components/admin/ShopGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Banknote, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ShopCOD() {
  const { currentShop } = useShop();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'pending' | 'collected'>('all');

  // Fetch delivered/shipped orders with COD data
  const { data: codOrders, isLoading } = useQuery({
    queryKey: ['cod-orders', currentShop?.id],
    queryFn: async () => {
      if (!currentShop) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('id, customer_name, customer_phone, customer_city, total, status, created_at, physical_order_shipping(cod_amount, cod_collected, cod_collected_at)')
        .eq('shop_id', currentShop.id)
        .in('status', ['confirmed', 'shipped', 'delivered'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data?.map(o => ({
        ...o,
        shipping: Array.isArray(o.physical_order_shipping) ? o.physical_order_shipping[0] : o.physical_order_shipping,
      })) || [];
    },
    enabled: !!currentShop,
  });

  const markCollectedMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('physical_order_shipping')
        .update({ cod_collected: true, cod_collected_at: new Date().toISOString() })
        .eq('order_id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cod-orders'] });
      toast.success('COD কালেকশন আপডেট হয়েছে');
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = codOrders?.filter(o => {
    if (filter === 'pending') return !o.shipping?.cod_collected;
    if (filter === 'collected') return o.shipping?.cod_collected;
    return true;
  }) || [];

  const totalCOD = codOrders?.reduce((s, o) => s + Number(o.shipping?.cod_amount || o.total || 0), 0) || 0;
  const collectedCOD = codOrders?.filter(o => o.shipping?.cod_collected).reduce((s, o) => s + Number(o.shipping?.cod_amount || o.total || 0), 0) || 0;
  const pendingCOD = totalCOD - collectedCOD;
  const pendingCount = codOrders?.filter(o => !o.shipping?.cod_collected).length || 0;

  return (
    <ShopLayout>
      <ShopGuard>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Banknote className="h-6 w-6" /> COD ম্যানেজমেন্ট
            </h1>
            <p className="text-muted-foreground">ক্যাশ অন ডেলিভারি কালেকশন ট্র্যাক করুন</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2"><Banknote className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">মোট COD</span></div>
                <p className="text-2xl font-bold mt-1">৳{totalCOD.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /><span className="text-sm text-muted-foreground">কালেক্টেড</span></div>
                <p className="text-2xl font-bold mt-1 text-green-600">৳{collectedCOD.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-orange-500" /><span className="text-sm text-muted-foreground">পেন্ডিং</span></div>
                <p className="text-2xl font-bold mt-1 text-orange-500">৳{pendingCOD.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" /><span className="text-sm text-muted-foreground">বকেয়া অর্ডার</span></div>
                <p className="text-2xl font-bold mt-1 text-red-500">{pendingCount}টি</p>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            {(['all', 'pending', 'collected'] as const).map(f => (
              <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
                {f === 'all' ? 'সব' : f === 'pending' ? 'পেন্ডিং' : 'কালেক্টেড'}
              </Button>
            ))}
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>কাস্টমার</TableHead>
                      <TableHead>শহর</TableHead>
                      <TableHead className="text-right">পরিমাণ</TableHead>
                      <TableHead>স্ট্যাটাস</TableHead>
                      <TableHead>তারিখ</TableHead>
                      <TableHead className="text-right">অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(order => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <p className="font-medium">{order.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                        </TableCell>
                        <TableCell>{order.customer_city}</TableCell>
                        <TableCell className="text-right font-medium">
                          ৳{Number(order.shipping?.cod_amount || order.total || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {order.shipping?.cod_collected ? (
                            <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> কালেক্টেড
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-orange-600 border-orange-300">
                              <Clock className="h-3 w-3 mr-1" /> পেন্ডিং
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(order.created_at), 'dd/MM/yy')}
                        </TableCell>
                        <TableCell className="text-right">
                          {!order.shipping?.cod_collected && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markCollectedMutation.mutate(order.id)}
                              disabled={markCollectedMutation.isPending}
                            >
                              কালেক্টেড
                            </Button>
                          )}
                          {order.shipping?.cod_collected && order.shipping.cod_collected_at && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(order.shipping.cod_collected_at), 'dd/MM/yy')}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">কোনো COD অর্ডার নেই</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </ShopGuard>
    </ShopLayout>
  );
}
