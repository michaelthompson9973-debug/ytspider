import { useState } from 'react';
import { ShopLayout } from '@/components/shop';
import { ShopGuard } from '@/components/admin/ShopGuard';
import { useShop } from '@/contexts/ShopContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Ticket, Plus, Trash2, Edit2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

const emptyCoupon = {
  code: '',
  description: '',
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: 0,
  min_order_amount: 0,
  max_discount_amount: null as number | null,
  usage_limit: null as number | null,
  expires_at: '',
};

export default function ShopCoupons() {
  const { currentShop } = useShop();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyCoupon);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['shop-coupons', currentShop?.id],
    queryFn: async () => {
      if (!currentShop) return [];
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('shop_id', currentShop.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Coupon[];
    },
    enabled: !!currentShop,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      if (!currentShop) throw new Error('No shop');
      const payload = {
        shop_id: currentShop.id,
        code: values.code.toUpperCase().trim(),
        description: values.description || null,
        discount_type: values.discount_type,
        discount_value: values.discount_value,
        min_order_amount: values.min_order_amount || 0,
        max_discount_amount: values.max_discount_amount || null,
        usage_limit: values.usage_limit || null,
        expires_at: values.expires_at || null,
      };

      if (editId) {
        const { error } = await supabase.from('coupons').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('coupons').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-coupons'] });
      toast.success(editId ? 'কুপন আপডেট হয়েছে' : 'কুপন তৈরি হয়েছে');
      setIsOpen(false);
      setEditId(null);
      setForm(emptyCoupon);
    },
    onError: (err: any) => {
      if (err?.message?.includes('23505') || err?.code === '23505') {
        toast.error('এই কোড ইতোমধ্যে ব্যবহৃত');
      } else {
        toast.error('সমস্যা হয়েছে: ' + err.message);
      }
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('coupons').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shop-coupons'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-coupons'] });
      toast.success('কুপন মুছে ফেলা হয়েছে');
    },
  });

  const openEdit = (coupon: Coupon) => {
    setEditId(coupon.id);
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type as 'percentage' | 'fixed',
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount || 0,
      max_discount_amount: coupon.max_discount_amount,
      usage_limit: coupon.usage_limit,
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 10) : '',
    });
    setIsOpen(true);
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('কোড কপি হয়েছে');
  };

  const isExpired = (c: Coupon) => c.expires_at && new Date(c.expires_at) < new Date();

  return (
    <ShopLayout>
      <ShopGuard>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Ticket className="h-6 w-6" /> কুপন ম্যানেজমেন্ট
              </h1>
              <p className="text-muted-foreground">ডিসকাউন্ট কুপন তৈরি ও পরিচালনা করুন</p>
            </div>
            <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) { setEditId(null); setForm(emptyCoupon); } }}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" /> নতুন কুপন</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editId ? 'কুপন এডিট' : 'নতুন কুপন তৈরি'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <Label>কুপন কোড</Label>
                    <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="SAVE20" className="uppercase" />
                  </div>
                  <div>
                    <Label>বিবরণ (ঐচ্ছিক)</Label>
                    <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="গ্রীষ্মকালীন ছাড়" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>ডিসকাউন্ট টাইপ</Label>
                      <Select value={form.discount_type} onValueChange={v => setForm(f => ({ ...f, discount_type: v as 'percentage' | 'fixed' }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">পার্সেন্টেজ (%)</SelectItem>
                          <SelectItem value="fixed">ফিক্সড (৳)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>পরিমাণ</Label>
                      <Input type="number" value={form.discount_value || ''} onChange={e => setForm(f => ({ ...f, discount_value: Number(e.target.value) }))} placeholder="20" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>সর্বনিম্ন অর্ডার (৳)</Label>
                      <Input type="number" value={form.min_order_amount || ''} onChange={e => setForm(f => ({ ...f, min_order_amount: Number(e.target.value) || 0 }))} placeholder="500" />
                    </div>
                    <div>
                      <Label>সর্বোচ্চ ছাড় (৳)</Label>
                      <Input type="number" value={form.max_discount_amount || ''} onChange={e => setForm(f => ({ ...f, max_discount_amount: Number(e.target.value) || null }))} placeholder="200" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>ব্যবহার সীমা</Label>
                      <Input type="number" value={form.usage_limit || ''} onChange={e => setForm(f => ({ ...f, usage_limit: Number(e.target.value) || null }))} placeholder="100" />
                    </div>
                    <div>
                      <Label>মেয়াদ শেষ</Label>
                      <Input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => saveMutation.mutate(form)}
                    disabled={!form.code || !form.discount_value || saveMutation.isPending}
                  >
                    {saveMutation.isPending ? 'সেভ হচ্ছে...' : editId ? 'আপডেট করুন' : 'তৈরি করুন'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Coupon List */}
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : coupons.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                এখনো কোনো কুপন তৈরি করা হয়নি
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {coupons.map(coupon => (
                <Card key={coupon.id} className={`transition-opacity ${!coupon.is_active || isExpired(coupon) ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-lg font-bold tracking-wider bg-muted px-2 py-0.5 rounded">{coupon.code}</code>
                          <button onClick={() => copyCode(coupon.code, coupon.id)} className="text-muted-foreground hover:text-foreground">
                            {copiedId === coupon.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                          </button>
                          {coupon.is_active && !isExpired(coupon) ? (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">সক্রিয়</Badge>
                          ) : isExpired(coupon) ? (
                            <Badge variant="destructive">মেয়াদোত্তীর্ণ</Badge>
                          ) : (
                            <Badge variant="secondary">নিষ্ক্রিয়</Badge>
                          )}
                        </div>
                        {coupon.description && <p className="text-sm text-muted-foreground mt-1">{coupon.description}</p>}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                          <span>
                            ছাড়: <strong className="text-foreground">
                              {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `৳${coupon.discount_value}`}
                            </strong>
                          </span>
                          {coupon.min_order_amount ? <span>সর্বনিম্ন: ৳{coupon.min_order_amount}</span> : null}
                          {coupon.max_discount_amount ? <span>সর্বোচ্চ ছাড়: ৳{coupon.max_discount_amount}</span> : null}
                          <span>ব্যবহার: {coupon.used_count}{coupon.usage_limit ? `/${coupon.usage_limit}` : ''}</span>
                          {coupon.expires_at && <span>মেয়াদ: {format(new Date(coupon.expires_at), 'dd/MM/yyyy')}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch
                          checked={coupon.is_active}
                          onCheckedChange={v => toggleMutation.mutate({ id: coupon.id, is_active: v })}
                        />
                        <Button variant="ghost" size="icon" onClick={() => openEdit(coupon)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(coupon.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ShopGuard>
    </ShopLayout>
  );
}
