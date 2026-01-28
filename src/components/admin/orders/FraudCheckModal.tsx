import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomerCourierHistory } from './types';
import { formatRelativeTime, normalizePhone } from './utils';
import { cn } from '@/lib/utils';

interface FraudCheckModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone?: string;
  courierHistory: CustomerCourierHistory[];
  onCheckPhone: (phone: string) => Promise<void>;
  isChecking: boolean;
}

export const FraudCheckModal = React.forwardRef<HTMLDivElement, FraudCheckModalProps>(
  ({ open, onOpenChange, phone = '', courierHistory, onCheckPhone, isChecking }, ref) => {
    const [inputPhone, setInputPhone] = useState(phone);

    React.useEffect(() => {
      if (phone) {
        setInputPhone(phone);
      }
    }, [phone]);

    const handleCheck = () => {
      const normalized = normalizePhone(inputPhone);
      if (normalized.length >= 11) {
        onCheckPhone(normalized);
      }
    };

    // Calculate combined stats
    const calculateCombinedStats = () => {
      if (courierHistory.length === 0) {
        return { totalOrders: 0, totalDelivered: 0, totalCancelled: 0, successRate: 0 };
      }

      let totalOrders = 0;
      let totalDelivered = 0;
      let totalCancelled = 0;

      courierHistory.forEach((history) => {
        totalOrders += history.total_orders || 0;
        totalDelivered += history.total_delivered || 0;
        totalCancelled += history.total_cancelled || 0;
      });

      const successRate = totalOrders > 0 ? (totalDelivered / totalOrders) * 100 : 0;

      return { totalOrders, totalDelivered, totalCancelled, successRate };
    };

    const stats = calculateCombinedStats();
    const lastChecked = courierHistory.length > 0 
      ? courierHistory.reduce((latest, h) => 
          new Date(h.checked_at) > new Date(latest) ? h.checked_at : latest, 
          courierHistory[0].checked_at
        )
      : null;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent ref={ref} className="max-w-md bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-center">
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent text-xl font-bold">
                ফ্রড চেক
              </span>
              <p className="text-sm text-slate-400 font-normal mt-1">
                বাংলাদেশি নম্বরের ডেলিভারি ইতিহাস চেক করুন
              </p>
            </DialogTitle>
          </DialogHeader>

          {/* Phone Input */}
          <div className="space-y-4">
            <div className="relative">
              <Input
                value={inputPhone}
                onChange={(e) => setInputPhone(e.target.value)}
                placeholder="ফোন নম্বর লিখুন..."
                className="bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500 pr-12"
              />
              <Button
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-indigo-600 hover:bg-indigo-700"
                onClick={handleCheck}
                disabled={isChecking || inputPhone.length < 11}
              >
                {isChecking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Stats Grid */}
            {courierHistory.length > 0 && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
                    <p className="text-xs text-slate-400">মোট অর্ডার</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-400">{stats.totalDelivered}</p>
                    <p className="text-xs text-slate-400">ডেলিভারড</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-red-400">{stats.totalCancelled}</p>
                    <p className="text-xs text-slate-400">বাতিল</p>
                  </div>
                </div>

                {/* Success Rate Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">সাফল্যের হার</span>
                    <span className={cn(
                      'font-bold',
                      stats.successRate > 70 ? 'text-emerald-400' :
                      stats.successRate >= 50 ? 'text-yellow-400' : 'text-red-400'
                    )}>
                      {stats.successRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        stats.successRate > 70 ? 'bg-emerald-500' :
                        stats.successRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      )}
                      style={{ width: `${stats.successRate}%` }}
                    />
                  </div>
                </div>

                {/* Courier Breakdown */}
                <div className="space-y-3">
                  <h3 className="text-sm text-slate-400 border-b border-slate-700 pb-2">
                    কুরিয়ার বিস্তারিত
                  </h3>
                  {courierHistory.map((history) => (
                    <div key={history.id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                      <span className="font-medium capitalize">{history.provider}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                          {history.total_delivered || 0} ডেলিভারড
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                          {history.total_cancelled || 0} বাতিল
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Last Checked */}
                {lastChecked && (
                  <p className="text-xs text-slate-500 text-center">
                    শেষ চেক: {formatRelativeTime(lastChecked)}
                  </p>
                )}
              </>
            )}

            {/* No Data State */}
            {courierHistory.length === 0 && !isChecking && (
              <div className="text-center py-8 text-slate-400">
                <p>এই নম্বরের কোনো ইতিহাস পাওয়া যায়নি</p>
                <p className="text-sm mt-1">ফোন নম্বর দিয়ে চেক করুন</p>
              </div>
            )}

            {/* Loading State */}
            {isChecking && (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mx-auto" />
                <p className="text-sm text-slate-400 mt-2">চেক করা হচ্ছে...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

FraudCheckModal.displayName = 'FraudCheckModal';
