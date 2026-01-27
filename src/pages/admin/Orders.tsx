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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Download, Search, Eye } from 'lucide-react';
import { format } from 'date-fns';

type OrderStatus = 'new' | 'confirmed' | 'shipped' | 'cancelled';

interface OrderItem {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export default function Orders() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
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

  // Fetch order items for the selected order
  const { data: orderItems = [] } = useQuery<OrderItem[]>({
    queryKey: ['order-items', selectedOrderId],
    queryFn: async () => {
      if (!selectedOrderId) return [];
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', selectedOrderId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as OrderItem[];
    },
    enabled: !!selectedOrderId,
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

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (amount === null || amount === undefined) return '-';
    const symbol = currency === 'USD' ? '$' : currency === 'INR' ? '₹' : '৳';
    return `${symbol}${Number(amount).toLocaleString()}`;
  };

  const exportCSV = () => {
    if (!orders || orders.length === 0) {
      toast({ title: 'No orders to export', variant: 'destructive' });
      return;
    }

    const headers = [
      'ID', 'Customer', 'Phone', 'Address', 'City', 'Product', 'Page',
      'Qty', 'Unit Price', 'Subtotal', 'Delivery', 'Total', 'Currency',
      'Status', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Created'
    ];
    const rows = orders.map(o => [
      o.id,
      o.customer_name,
      o.customer_phone,
      o.customer_address,
      o.customer_city,
      o.products?.name ?? '',
      o.landing_pages?.slug ?? '',
      o.quantity ?? 1,
      o.unit_price ?? '',
      o.subtotal ?? '',
      o.delivery_charge ?? '',
      o.total ?? '',
      o.currency ?? 'BDT',
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

  // Get the selected order for the dialog
  const selectedOrder = orders?.find(o => o.id === selectedOrderId);

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
                    <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Products</th>
                    <th className="px-4 py-3 text-right font-medium whitespace-nowrap">Total</th>
                    <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Date</th>
                    <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 text-center font-medium whitespace-nowrap">Details</th>
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
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs text-muted-foreground">
                            {order.quantity ?? 1} item{(order.quantity ?? 1) !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap font-semibold">
                          {formatCurrency(order.total, order.currency)}
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
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSelectedOrderId(order.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrderId} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
            </DialogHeader>
            
            {selectedOrder && (
              <div className="space-y-4">
                {/* Customer Info */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Customer</h4>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Name:</span> {selectedOrder.customer_name}</p>
                    <p><span className="text-muted-foreground">Phone:</span> {selectedOrder.customer_phone}</p>
                    <p><span className="text-muted-foreground">Address:</span> {selectedOrder.customer_address}</p>
                    <p><span className="text-muted-foreground">City:</span> {selectedOrder.customer_city}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Products</h4>
                  {orderItems.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50 border-b">
                            <th className="px-3 py-2 text-left font-medium">Product</th>
                            <th className="px-3 py-2 text-right font-medium">Price</th>
                            <th className="px-3 py-2 text-right font-medium">Qty</th>
                            <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderItems.map((item) => (
                            <tr key={item.id} className="border-b last:border-b-0">
                              <td className="px-3 py-2">{item.product_name}</td>
                              <td className="px-3 py-2 text-right">
                                {formatCurrency(item.unit_price, selectedOrder.currency)}
                              </td>
                              <td className="px-3 py-2 text-right">{item.quantity}</td>
                              <td className="px-3 py-2 text-right font-medium">
                                {formatCurrency(item.subtotal, selectedOrder.currency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.products?.name || 'Legacy order - no item details'}
                    </p>
                  )}
                </div>

                {/* Order Summary */}
                <div className="space-y-2 border-t pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>{formatCurrency(selectedOrder.subtotal, selectedOrder.currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery:</span>
                    <span>{formatCurrency(selectedOrder.delivery_charge, selectedOrder.currency)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedOrder.total, selectedOrder.currency)}</span>
                  </div>
                </div>

                {/* UTM Info */}
                {(selectedOrder.utm_source || selectedOrder.utm_medium || selectedOrder.utm_campaign) && (
                  <div className="space-y-2 border-t pt-3">
                    <h4 className="font-semibold text-sm">UTM Parameters</h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {selectedOrder.utm_source && <p>Source: {selectedOrder.utm_source}</p>}
                      {selectedOrder.utm_medium && <p>Medium: {selectedOrder.utm_medium}</p>}
                      {selectedOrder.utm_campaign && <p>Campaign: {selectedOrder.utm_campaign}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
