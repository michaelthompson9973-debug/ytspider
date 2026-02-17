import React, { useState, useEffect } from 'react';
import { Search, Loader2, RefreshCw } from 'lucide-react';
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomerCourierHistory } from './types';
import { formatRelativeTime, normalizePhone } from './utils';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface FraudCheckModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone?: string;
  courierHistory: CustomerCourierHistory[];
  onCheckPhone: (phone: string) => Promise<void>;
  isChecking: boolean;
}

export const FraudCheckModal = React.forwardRef<HTMLDivElement, FraudCheckModalProps>(
  ({ open, onOpenChange, phone = '', courierHistory: externalHistory, onCheckPhone, isChecking }, ref) => {
    const [inputPhone, setInputPhone] = useState(phone);
    const [lastCheckedPhone, setLastCheckedPhone] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const normalizedInputPhone = normalizePhone(inputPhone);
    const { data: fetchedHistory = [], refetch, isRefetching } = useQuery({
      queryKey: ['fraud-check-modal-history', normalizedInputPhone],
      queryFn: async () => {
        if (!normalizedInputPhone || normalizedInputPhone.length < 11) return [];
        const { data, error } = await supabase
          .from('customer_courier_history')
          .select('*')
          .eq('phone', normalizedInputPhone);
        if (error) throw error;
        return data as CustomerCourierHistory[];
      },
      enabled: open && normalizedInputPhone.length >= 11,
      staleTime: 0,
    });

    const courierHistory = fetchedHistory.length > 0 ? fetchedHistory : externalHistory;

    useEffect(() => { if (phone) setInputPhone(phone); }, [phone]);

    useEffect(() => {
      if (!isChecking && lastCheckedPhone) {
        const timer = setTimeout(() => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ['courier-history'] });
        }, 600);
        setLastCheckedPhone(null);
        return () => clearTimeout(timer);
      }
    }, [isChecking, lastCheckedPhone, refetch, queryClient]);

    const handleCheck = async () => {
      const normalized = normalizePhone(inputPhone);
      if (normalized.length >= 11) {
        setLastCheckedPhone(normalized);
        await onCheckPhone(normalized);
      }
    };

    const calculateCombinedStats = () => {
      if (courierHistory.length === 0) return { totalOrders: 0, totalDelivered: 0, totalCancelled: 0, successRate: 0 };
      let totalOrders = 0, totalDelivered = 0, totalCancelled = 0;
      courierHistory.forEach((h) => { totalOrders += h.total_orders || 0; totalDelivered += h.total_delivered || 0; totalCancelled += h.total_cancelled || 0; });
      return { totalOrders, totalDelivered, totalCancelled, successRate: totalOrders > 0 ? (totalDelivered / totalOrders) * 100 : 0 };
    };

    const stats = calculateCombinedStats();
    const lastChecked = courierHistory.length > 0
      ? courierHistory.reduce((latest, h) => new Date(h.checked_at) > new Date(latest) ? h.checked_at : latest, courierHistory[0].checked_at)
      : null;
    const showLoading = isChecking || isRefetching;

    return (
      <ResponsiveModal open={open} onOpenChange={onOpenChange}>
        <ResponsiveModalContent ref={ref} className="max-w-md bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700" drawerClassName="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle className="text-center">
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent text-xl font-bold">
                ফ্রড চেক
              </span>
              <p className="text-sm text-slate-400 font-normal mt-1">ডেলিভারি ইতিহাস চেক করুন</p>
            </ResponsiveModalTitle>
          </ResponsiveModalHeader>

          <div className="space-y-4">
            <div className="relative">
              <Input value={inputPhone} onChange={(e) => setInputPhone(e.target.value)} placeholder="ফোন নম্বর..." className="bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500 pr-12" />
              <Button size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-indigo-600 hover:bg-indigo-700" onClick={handleCheck} disabled={isChecking || inputPhone.length < 11}>
                {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            {courierHistory.length > 0 && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
                    <p className="text-xs text-slate-400">মোট</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-400">{stats.totalDelivered}</p>
                    <p className="text-xs text-slate-400">ডেলিভারড</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-red-400">{stats.totalCancelled}</p>
                    <p className="text-xs text-slate-400">বাতিল</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">সাফল্যের হার</span>
                    <span className={cn('font-bold', stats.successRate > 70 ? 'text-emerald-400' : stats.successRate >= 50 ? 'text-yellow-400' : 'text-red-400')}>
                      {stats.successRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all duration-500', stats.successRate > 70 ? 'bg-emerald-500' : stats.successRate >= 50 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: `${stats.successRate}%` }} />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm text-slate-400 border-b border-slate-700 pb-2">কুরিয়ার বিস্তারিত</h3>
                  {courierHistory.map((history) => (
                    <div key={history.id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                      <span className="font-medium capitalize">{history.provider}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">{history.total_delivered || 0}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">{history.total_cancelled || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {lastChecked && <p className="text-xs text-slate-500 text-center">শেষ চেক: {formatRelativeTime(lastChecked)}</p>}
              </>
            )}
            {courierHistory.length === 0 && !showLoading && (
              <div className="text-center py-6 text-slate-400">
                <p>কোনো ইতিহাস পাওয়া যায়নি</p>
              </div>
            )}
            {showLoading && (
              <div className="text-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mx-auto" />
                <p className="text-sm text-slate-400 mt-2">চেক করা হচ্ছে...</p>
              </div>
            )}
          </div>
        </ResponsiveModalContent>
      </ResponsiveModal>
    );
  }
);

FraudCheckModal.displayName = 'FraudCheckModal';
