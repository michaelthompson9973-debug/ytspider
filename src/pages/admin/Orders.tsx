import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Download, Search } from 'lucide-react';
import { format } from 'date-fns';

type OrderStatus = 'new' | 'confirmed' | 'shipped' | 'cancelled';

export default function Orders() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', statusFilter, productFilter, search],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          products (name),
          landing_pages (slug)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'new' | 'confirmed' | 'shipped' | 'cancelled');
      }
      if (productFilter !== 'all') {
        query = query.eq('product_id', productFilter);
      }
      if (search) {
        query = query.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,customer_city.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ['products-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: 'Order status updated' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const exportCSV = () => {
    if (!orders || orders.length === 0) {
      toast({ title: 'No orders to export', variant: 'destructive' });
      return;
    }

    const headers = ['ID', 'Customer', 'Phone', 'Address', 'City', 'Product', 'Page', 'Status', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Created'];
    const rows = orders.map(o => [
      o.id,
      o.customer_name,
      o.customer_phone,
      o.customer_address,
      o.customer_city,
      o.products?.name ?? '',
      o.landing_pages?.slug ?? '',
      o.status,
      o.utm_source ?? '',
      o.utm_medium ?? '',
      o.utm_campaign ?? '',
      format(new Date(o.created_at), 'yyyy-MM-dd HH:mm'),
    ]);

    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusColors: Record<OrderStatus, string> = {
    new: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-green-100 text-green-800',
    shipped: 'bg-purple-100 text-purple-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Orders</h1>
          <Button onClick={exportCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Product" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              {products?.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Customer</th>
                    <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Phone</th>
                    <th className="px-4 py-3 text-left font-medium whitespace-nowrap">City</th>
                    <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Product</th>
                    <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Page</th>
                    <th className="px-4 py-3 text-left font-medium whitespace-nowrap">UTM</th>
                    <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Date</th>
                    <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                        Loading...
                      </td>
                    </tr>
                  ) : orders?.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                        No orders found
                      </td>
                    </tr>
                  ) : (
                    orders?.map((order) => (
                      <tr key={order.id} className="border-b">
                        <td className="px-4 py-3 font-medium whitespace-nowrap">{order.customer_name}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{order.customer_phone}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{order.customer_city}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{order.products?.name ?? '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">/{order.landing_pages?.slug ?? '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                          {order.utm_source && <span className="block">src: {order.utm_source}</span>}
                          {order.utm_medium && <span className="block">med: {order.utm_medium}</span>}
                          {order.utm_campaign && <span className="block">cmp: {order.utm_campaign}</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                          {format(new Date(order.created_at), 'MMM dd, HH:mm')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Select
                            value={order.status}
                            onValueChange={(status: OrderStatus) => 
                              updateStatusMutation.mutate({ id: order.id, status })
                            }
                          >
                            <SelectTrigger className={`h-8 w-28 text-xs ${statusColors[order.status as OrderStatus]}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
