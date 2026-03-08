import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Users, Store, ShoppingCart, CheckCircle, AlertTriangle, XCircle, Phone, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface CustomerWithStats { phone: string; name: string | null; city: string | null; shop_id: string | null; shop_name: string; total_orders: number; delivered_orders: number; cancelled_orders: number; total_spent: number; trust_score: 'trusted' | 'medium' | 'risky' | 'new'; }

export default function PlatformCustomerBase() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: customers, isLoading } = useQuery({
    queryKey: ['platform-customers'],
    queryFn: async () => {
      const { data: ordersData, error: ordersError } = await supabase.from('orders')
        .select(`id, customer_name, customer_phone, customer_city, status, total, shop_id, shops!inner(name)`)
        .order('created_at', { ascending: false });
      if (ordersError) throw ordersError;
      const customerMap = new Map<string, CustomerWithStats>();
      ordersData?.forEach(order => {
        const phone = order.customer_phone;
        const existing = customerMap.get(phone);
        const isDelivered = order.status === 'delivered';
        const isCancelled = order.status === 'cancelled';
        if (existing) {
          existing.total_orders += 1; existing.delivered_orders += isDelivered ? 1 : 0; existing.cancelled_orders += isCancelled ? 1 : 0;
          existing.total_spent += isDelivered ? (order.total || 0) : 0;
        } else {
          customerMap.set(phone, { phone, name: order.customer_name, city: order.customer_city, shop_id: order.shop_id, shop_name: (order.shops as any)?.name || 'Unknown', total_orders: 1, delivered_orders: isDelivered ? 1 : 0, cancelled_orders: isCancelled ? 1 : 0, total_spent: isDelivered ? (order.total || 0) : 0, trust_score: 'new' });
        }
      });
      customerMap.forEach((customer) => {
        const successRate = customer.total_orders > 0 ? customer.delivered_orders / customer.total_orders : 0;
        const cancelRate = customer.total_orders > 0 ? customer.cancelled_orders / customer.total_orders : 0;
        if (customer.total_orders >= 3 && successRate >= 0.8) customer.trust_score = 'trusted';
        else if (cancelRate >= 0.5 || (customer.total_orders >= 2 && cancelRate >= 0.4)) customer.trust_score = 'risky';
        else if (customer.total_orders >= 1) customer.trust_score = 'medium';
      });
      return Array.from(customerMap.values());
    },
  });

  const filteredCustomers = customers?.filter(c => (c.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery) || (c.city?.toLowerCase() || '').includes(searchQuery.toLowerCase())) || [];
  const sortedCustomers = [...filteredCustomers].sort((a, b) => b.total_orders - a.total_orders);
  const totalCustomers = customers?.length || 0;
  const trustedCount = customers?.filter(c => c.trust_score === 'trusted').length || 0;
  const riskyCount = customers?.filter(c => c.trust_score === 'risky').length || 0;
  const totalRevenue = customers?.reduce((sum, c) => sum + c.total_spent, 0) || 0;
  const formatPrice = (price: number) => `৳${price.toLocaleString()}`;

  const getTrustBadge = (score: CustomerWithStats['trust_score']) => {
    switch (score) {
      case 'trusted': return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Trusted</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><AlertTriangle className="h-3 w-3 mr-1" />Medium</Badge>;
      case 'risky': return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />Risky</Badge>;
      default: return <Badge variant="outline">New</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">{t('sidebar.customerBase')}</h1><p className="text-muted-foreground">All shop customers and trust scores</p></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Total Customers</span></div><p className="text-2xl font-bold mt-1">{totalCustomers}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /><span className="text-sm text-muted-foreground">Trusted</span></div><p className="text-2xl font-bold mt-1">{trustedCount}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-500" /><span className="text-sm text-muted-foreground">Risky</span></div><p className="text-2xl font-bold mt-1">{riskyCount}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-blue-500" /><span className="text-sm text-muted-foreground">Total Revenue</span></div><p className="text-2xl font-bold mt-1">{formatPrice(totalRevenue)}</p></CardContent></Card>
        </div>
        <div className="flex gap-4"><div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by name, phone, or city..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div></div>
        <Card>
          <CardHeader><CardTitle className="text-lg">All Customers</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (<div className="space-y-3">{[...Array(5)].map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}</div>) : (
              <Table>
                <TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>City</TableHead><TableHead>Shop</TableHead><TableHead className="text-right">Orders</TableHead><TableHead className="text-right">Delivered</TableHead><TableHead className="text-right">Cancelled</TableHead><TableHead className="text-right">Spent</TableHead><TableHead>Trust</TableHead></TableRow></TableHeader>
                <TableBody>
                  {sortedCustomers.slice(0, 100).map((customer) => (
                    <TableRow key={customer.phone}>
                      <TableCell><div><div className="font-medium">{customer.name || 'Unknown'}</div><div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{customer.phone}</div></div></TableCell>
                      <TableCell>{customer.city ? (<div className="flex items-center gap-1 text-sm"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{customer.city}</div>) : (<span className="text-muted-foreground">—</span>)}</TableCell>
                      <TableCell><div className="flex items-center gap-1.5 text-sm text-muted-foreground"><Store className="h-3.5 w-3.5" />{customer.shop_name}</div></TableCell>
                      <TableCell className="text-right font-medium">{customer.total_orders}</TableCell>
                      <TableCell className="text-right text-green-600">{customer.delivered_orders}</TableCell>
                      <TableCell className="text-right text-red-500">{customer.cancelled_orders}</TableCell>
                      <TableCell className="text-right">{customer.total_spent > 0 ? <span className="font-medium">{formatPrice(customer.total_spent)}</span> : <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>{getTrustBadge(customer.trust_score)}</TableCell>
                    </TableRow>
                  ))}
                  {sortedCustomers.length === 0 && (<TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No customers found</TableCell></TableRow>)}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}