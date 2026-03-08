import AdminLayout from '@/components/admin/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DollarSign,
  TrendingUp,
  Store,
  CreditCard,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function PlatformRevenue() {
  const { t } = useLanguage();

  const { data: purchases, isLoading } = useQuery({
    queryKey: ['platform-revenue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchases')
        .select(`id, amount, currency, payment_status, created_at, completed_at, shop_name, plan_snapshot`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const completedPurchases = purchases?.filter(p => p.payment_status === 'completed') || [];
  const totalRevenue = completedPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);
  const thisMonthRevenue = completedPurchases
    .filter(p => {
      const purchaseDate = new Date(p.completed_at || p.created_at);
      const now = new Date();
      return purchaseDate.getMonth() === now.getMonth() && purchaseDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const formatPrice = (price: number, currency = 'BDT') => 
    `${currency === 'BDT' ? '৳' : '$'}${price.toLocaleString()}`;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t('sidebar.revenueReport')}</h1>
          <p className="text-muted-foreground">Subscription revenue and payment history</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Revenue</span>
              </div>
              <p className="text-2xl font-bold mt-1">{formatPrice(totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">This Month</span>
              </div>
              <p className="text-2xl font-bold mt-1">{formatPrice(thisMonthRevenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Successful Payments</span>
              </div>
              <p className="text-2xl font-bold mt-1">{completedPurchases.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-muted-foreground">Total Transactions</span>
              </div>
              <p className="text-2xl font-bold mt-1">{purchases?.length || 0}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Shop</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases?.slice(0, 50).map((purchase) => {
                    const planName = (purchase.plan_snapshot as any)?.name || 'Unknown';
                    return (
                      <TableRow key={purchase.id}>
                        <TableCell className="text-sm">{formatDate(purchase.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Store className="h-3.5 w-3.5 text-muted-foreground" />
                            {purchase.shop_name}
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{planName}</Badge></TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPrice(purchase.amount, purchase.currency || 'BDT')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            purchase.payment_status === 'completed' ? 'default' :
                            purchase.payment_status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {purchase.payment_status === 'completed' ? 'Completed' :
                             purchase.payment_status === 'pending' ? 'Pending' : 'Failed'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!purchases || purchases.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No payment records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}