import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useShop } from '@/contexts/ShopContext';
import { ShopLayout } from '@/components/shop';
import { ShopGuard } from '@/components/admin/ShopGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RotateCcw, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  requested: { label: 'অনুরোধ', variant: 'outline' },
  approved: { label: 'অনুমোদিত', variant: 'default' },
  rejected: { label: 'প্রত্যাখ্যাত', variant: 'destructive' },
  refunded: { label: 'রিফান্ড হয়েছে', variant: 'secondary' },
};

export default function ShopReturns() {
  const { currentShop } = useShop();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [reason, setReason] = useState('');
  const [refundAmount, setRefundAmount] = useState(0);
  const [processOpen, setProcessOpen] = useState<string | null>(null);
  const [processStatus, setProcessStatus] = useState('approved');
  const [adminNote, setAdminNote] = useState('');

  const { data: returns, isLoading } = useQuery({
    queryKey: ['order-returns', currentShop?.id],
    queryFn: async () => {
      if (!currentShop) return [];
      const { data, error } = await supabase
        .from('order_returns')
        .select('*, orders(customer_name, customer_phone, total)')
        .eq('shop_id', currentShop.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!currentShop,
  });

  const { data: orders } = useQuery({
    queryKey: ['shop-orders-for-return', currentShop?.id],
    queryFn: async () => {
      if (!currentShop) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('id, customer_name, customer_phone, total')
        .eq('shop_id', currentShop.id)
        .in('status', ['confirmed', 'shipped'])
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!currentShop && createOpen,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!currentShop || !selectedOrderId) throw new Error('Missing data');
      const { error } = await supabase.from('order_returns').insert({
        order_id: selectedOrderId,
        shop_id: currentShop.id,
        reason,
        refund_amount: refundAmount,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-returns'] });
      setCreateOpen(false);
      setReason('');
      setRefundAmount(0);
      setSelectedOrderId('');
      toast.success('রিটার্ন রিকোয়েস্ট তৈরি হয়েছে');
    },
    onError: (e) => toast.error(e.message),
  });

  const processMutation = useMutation({
    mutationFn: async () => {
      if (!processOpen) throw new Error('No return selected');
      const { error } = await supabase
        .from('order_returns')
        .update({
          status: processStatus,
          admin_note: adminNote,
          processed_at: new Date().toISOString(),
        })
        .eq('id', processOpen);
      if (error) throw error;

      // If refunded, update the order too
      if (processStatus === 'refunded') {
        const ret = returns?.find(r => r.id === processOpen);
        if (ret) {
          await supabase.from('orders').update({
            refund_amount: ret.refund_amount,
            refunded_at: new Date().toISOString(),
            refund_reason: ret.reason,
          }).eq('id', ret.order_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-returns'] });
      setProcessOpen(null);
      setAdminNote('');
      toast.success('রিটার্ন আপডেট হয়েছে');
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = returns?.filter(r =>
    (r as any).orders?.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    (r as any).orders?.customer_phone?.includes(search) ||
    r.reason.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const stats = {
    total: returns?.length || 0,
    pending: returns?.filter(r => r.status === 'requested').length || 0,
    refunded: returns?.filter(r => r.status === 'refunded').length || 0,
    totalRefunded: returns?.filter(r => r.status === 'refunded').reduce((s, r) => s + Number(r.refund_amount || 0), 0) || 0,
  };

  return (
    <ShopLayout>
      <ShopGuard>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <RotateCcw className="h-6 w-6" /> রিটার্ন ও রিফান্ড
              </h1>
              <p className="text-muted-foreground">অর্ডার রিটার্ন এবং রিফান্ড ম্যানেজ করুন</p>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> রিটার্ন রিকোয়েস্ট
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">মোট রিটার্ন</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">পেন্ডিং</p><p className="text-2xl font-bold text-orange-500">{stats.pending}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">রিফান্ড হয়েছে</p><p className="text-2xl font-bold text-green-600">{stats.refunded}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">মোট রিফান্ড</p><p className="text-2xl font-bold">৳{stats.totalRefunded.toLocaleString()}</p></CardContent></Card>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="সার্চ..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>কাস্টমার</TableHead>
                      <TableHead>কারণ</TableHead>
                      <TableHead className="text-right">রিফান্ড</TableHead>
                      <TableHead>স্ট্যাটাস</TableHead>
                      <TableHead>তারিখ</TableHead>
                      <TableHead className="text-right">অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(ret => {
                      const order = (ret as any).orders;
                      const sc = STATUS_MAP[ret.status] || STATUS_MAP.requested;
                      return (
                        <TableRow key={ret.id}>
                          <TableCell>
                            <p className="font-medium">{order?.customer_name || '—'}</p>
                            <p className="text-xs text-muted-foreground">{order?.customer_phone}</p>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{ret.reason}</TableCell>
                          <TableCell className="text-right font-medium">৳{Number(ret.refund_amount || 0).toLocaleString()}</TableCell>
                          <TableCell><Badge variant={sc.variant}>{sc.label}</Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{format(new Date(ret.created_at), 'dd/MM/yy')}</TableCell>
                          <TableCell className="text-right">
                            {ret.status === 'requested' && (
                              <Button size="sm" variant="outline" onClick={() => { setProcessOpen(ret.id); setProcessStatus('approved'); setAdminNote(''); }}>
                                প্রসেস
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filtered.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">কোনো রিটার্ন নেই</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Create Return Dialog */}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>নতুন রিটার্ন রিকোয়েস্ট</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>অর্ডার সিলেক্ট করুন</Label>
                  <Select value={selectedOrderId} onValueChange={v => {
                    setSelectedOrderId(v);
                    const o = orders?.find(o => o.id === v);
                    if (o) setRefundAmount(Number(o.total || 0));
                  }}>
                    <SelectTrigger><SelectValue placeholder="অর্ডার বাছুন" /></SelectTrigger>
                    <SelectContent>
                      {orders?.map(o => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.customer_name} — ৳{Number(o.total || 0).toLocaleString()} — {o.id.slice(0, 8)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>কারণ</Label>
                  <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="রিটার্নের কারণ লিখুন..." />
                </div>
                <div className="space-y-2">
                  <Label>রিফান্ড পরিমাণ (৳)</Label>
                  <Input type="number" min={0} value={refundAmount} onChange={e => setRefundAmount(Number(e.target.value))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>বাতিল</Button>
                <Button onClick={() => createMutation.mutate()} disabled={!selectedOrderId || !reason || createMutation.isPending}>
                  {createMutation.isPending ? 'তৈরি হচ্ছে...' : 'রিকোয়েস্ট তৈরি'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Process Return Dialog */}
          <Dialog open={!!processOpen} onOpenChange={open => !open && setProcessOpen(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>রিটার্ন প্রসেস করুন</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>স্ট্যাটাস</Label>
                  <Select value={processStatus} onValueChange={setProcessStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">অনুমোদিত</SelectItem>
                      <SelectItem value="rejected">প্রত্যাখ্যাত</SelectItem>
                      <SelectItem value="refunded">রিফান্ড সম্পন্ন</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>অ্যাডমিন নোট</Label>
                  <Textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="নোট (ঐচ্ছিক)..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setProcessOpen(null)}>বাতিল</Button>
                <Button onClick={() => processMutation.mutate()} disabled={processMutation.isPending}>
                  {processMutation.isPending ? 'আপডেট হচ্ছে...' : 'আপডেট করুন'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </ShopGuard>
    </ShopLayout>
  );
}
