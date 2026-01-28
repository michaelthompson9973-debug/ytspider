import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TrustLevel, CustomerCourierHistory } from './types';
import { getTrustLevel, getTrustBadgeConfig, formatRelativeTime } from './utils';
import { cn } from '@/lib/utils';

interface TrustBadgeProps {
  courierHistory: CustomerCourierHistory[] | null;
  phone: string;
  onRefresh?: () => void;
  onClick?: () => void;
  isRefreshing?: boolean;
  size?: 'sm' | 'md';
}

export const TrustBadge = React.forwardRef<HTMLDivElement, TrustBadgeProps>(
  ({ courierHistory, phone, onRefresh, onClick, isRefreshing = false, size = 'sm' }, ref) => {
    // Calculate combined success rate from all providers
    const calculateCombinedStats = () => {
      if (!courierHistory || courierHistory.length === 0) {
        return { successRate: null, totalOrders: 0, totalDelivered: 0, totalCancelled: 0, lastChecked: null };
      }

      let totalOrders = 0;
      let totalDelivered = 0;
      let totalCancelled = 0;
      let lastChecked: string | null = null;

      courierHistory.forEach((history) => {
        totalOrders += history.total_orders || 0;
        totalDelivered += history.total_delivered || 0;
        totalCancelled += history.total_cancelled || 0;
        
        if (!lastChecked || new Date(history.checked_at) > new Date(lastChecked)) {
          lastChecked = history.checked_at;
        }
      });

      const successRate = totalOrders > 0 ? (totalDelivered / totalOrders) * 100 : null;

      return { successRate, totalOrders, totalDelivered, totalCancelled, lastChecked };
    };

    const stats = calculateCombinedStats();
    const trustLevel = getTrustLevel(stats.successRate);
    const config = getTrustBadgeConfig(trustLevel);

    const handleRefreshClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onRefresh?.();
    };

    return (
      <div ref={ref} className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onClick}
              className={cn(
                'inline-flex items-center gap-1 rounded-full font-medium transition-colors cursor-pointer hover:opacity-80',
                config.bgColor,
                config.color,
                size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
              )}
            >
              <span>{config.emoji}</span>
              <span>{config.label}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1 text-xs">
              {stats.totalOrders > 0 ? (
                <>
                  <p>মোট অর্ডার: {stats.totalOrders}</p>
                  <p>ডেলিভারড: {stats.totalDelivered}</p>
                  <p>বাতিল: {stats.totalCancelled}</p>
                  <p>সাফল্যের হার: {stats.successRate?.toFixed(1)}%</p>
                  {stats.lastChecked && (
                    <p className="text-muted-foreground">
                      শেষ চেক: {formatRelativeTime(stats.lastChecked)}
                    </p>
                  )}
                </>
              ) : (
                <p>এই নম্বরের কোনো ইতিহাস নেই। চেক করতে ক্লিক করুন।</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={handleRefreshClick}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('h-3 w-3', isRefreshing && 'animate-spin')} />
          </Button>
        )}
      </div>
    );
  }
);

TrustBadge.displayName = 'TrustBadge';
