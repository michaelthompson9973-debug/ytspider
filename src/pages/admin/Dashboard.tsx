import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, FileText, ShoppingCart, TrendingUp } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [products, pages, orders, newOrders] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('landing_pages').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'new'),
      ]);
      
      return {
        products: products.count ?? 0,
        pages: pages.count ?? 0,
        orders: orders.count ?? 0,
        newOrders: newOrders.count ?? 0,
      };
    },
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          customer_name,
          customer_city,
          status,
          created_at,
          products (name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
  });

  const statCards = [
    { title: 'Products', value: stats?.products ?? 0, icon: Package },
    { title: 'Landing Pages', value: stats?.pages ?? 0, icon: FileText },
    { title: 'Total Orders', value: stats?.orders ?? 0, icon: ShoppingCart },
    { title: 'New Orders', value: stats?.newOrders ?? 0, icon: TrendingUp },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left font-medium">Customer</th>
                    <th className="py-2 text-left font-medium">Product</th>
                    <th className="py-2 text-left font-medium">City</th>
                    <th className="py-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders?.map((order) => (
                    <tr key={order.id} className="border-b">
                      <td className="py-2">{order.customer_name}</td>
                      <td className="py-2">{order.products?.name ?? '-'}</td>
                      <td className="py-2">{order.customer_city}</td>
                      <td className="py-2">
                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                          order.status === 'new' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!recentOrders || recentOrders.length === 0) && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-muted-foreground">
                        No orders yet
                      </td>
                    </tr>
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
