import { useState } from 'react';
import { ShopLayout } from '@/components/shop';
import { ShopGuard } from '@/components/admin/ShopGuard';
import { useShop } from '@/contexts/ShopContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Search, Star, Phone, ShoppingCart, TrendingUp } from 'lucide-react';

interface CustomerRow {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  is_vip: boolean | null;
  total_orders: number | null;
  total_spent: number | null;
  first_contact_at: string | null;
  last_contact_at: string | null;
}

export default function ShopCustomers() {
  const { currentShop } = useShop();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'vip' | 'repeat'>('all');

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['shop-customers', currentShop?.id],
    queryFn: async () => {
      if (!currentShop) return [];
      const { data, error } = await supabase
        .from('customer_profiles')
        .select('id, name, phone, email, city, is_vip, total_orders, total_spent, first_contact_at, last_contact_at')
        .eq('shop_id', currentShop.id)
        .order('last_contact_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as CustomerRow[];
    },
    enabled: !!currentShop,
  });

  const filtered = customers.filter(c => {
    const matchesSearch = !search ||
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || '').includes(search) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === 'all' ? true :
      filter === 'vip' ? c.is_vip :
      filter === 'repeat' ? (c.total_orders || 0) > 1 :
      true;

    return matchesSearch && matchesFilter;
  });

  const totalCustomers = customers.length;
  const vipCount = customers.filter(c => c.is_vip).length;
  const repeatCount = customers.filter(c => (c.total_orders || 0) > 1).length;
  const totalRevenue = customers.reduce((s, c) => s + (c.total_spent || 0), 0);

  return (
    <ShopLayout>
      <ShopGuard>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" /> কাস্টমার তালিকা
            </h1>
            <p className="text-muted-foreground hidden sm:block">আপনার সব কাস্টমারদের তথ্য</p>
          </div>

          {/* KPI row */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'মোট কাস্টমার', value: totalCustomers, icon: Users },
              { label: 'VIP কাস্টমার', value: vipCount, icon: Star },
              { label: 'রিপিট কাস্টমার', value: repeatCount, icon: ShoppingCart },
              { label: 'মোট খরচ', value: `৳${totalRevenue.toLocaleString()}`, icon: TrendingUp },
            ].map(k => (
              <Card key={k.label}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{k.label}</p>
                    <k.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xl font-bold mt-1">{k.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="নাম, ফোন বা ইমেইল খুঁজুন..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব কাস্টমার</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="repeat">রিপিট</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Customer List */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">কোনো কাস্টমার পাওয়া যায়নি</p>
              ) : (
                <div className="divide-y">
                  {filtered.map(customer => (
                    <div key={customer.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                          {(customer.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{customer.name || 'অজ্ঞাত'}</p>
                            {customer.is_vip && (
                              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                <Star className="h-3 w-3 mr-1" /> VIP
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {customer.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {customer.phone}
                              </span>
                            )}
                            {customer.city && <span>• {customer.city}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="font-semibold text-sm">৳{(customer.total_spent || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{customer.total_orders || 0} অর্ডার</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ShopGuard>
    </ShopLayout>
  );
}
