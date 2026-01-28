import React from 'react';
import { ArrowRight } from 'lucide-react';
import { OrderStatusHistory } from './types';
import { STATUS_CONFIG } from './types';
import { formatDateBengali } from './utils';
import { cn } from '@/lib/utils';

interface OrderTimelineProps {
  history: OrderStatusHistory[];
  isLoading?: boolean;
}

export const OrderTimeline = React.forwardRef<HTMLDivElement, OrderTimelineProps>(
  ({ history, isLoading = false }, ref) => {
    if (isLoading) {
      return (
        <div ref={ref} className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded" />
          ))}
        </div>
      );
    }

    if (history.length === 0) {
      return (
        <div ref={ref} className="text-center py-4 text-sm text-muted-foreground">
          কোনো স্ট্যাটাস পরিবর্তনের ইতিহাস নেই
        </div>
      );
    }

    // Sort by created_at descending (newest first)
    const sortedHistory = [...history].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return (
      <div ref={ref} className="space-y-3">
        {sortedHistory.map((item, index) => {
          const oldConfig = item.old_status ? STATUS_CONFIG[item.old_status as keyof typeof STATUS_CONFIG] : null;
          const newConfig = STATUS_CONFIG[item.new_status as keyof typeof STATUS_CONFIG];

          return (
            <div
              key={item.id}
              className={cn(
                'relative pl-6 pb-3',
                index !== sortedHistory.length - 1 && 'border-l-2 border-muted'
              )}
            >
              {/* Timeline dot */}
              <div
                className={cn(
                  'absolute left-0 top-0 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-background',
                  newConfig?.bgColor || 'bg-muted'
                )}
              />

              <div className="space-y-1">
                {/* Status change */}
                <div className="flex items-center gap-2 text-sm">
                  {oldConfig ? (
                    <>
                      <span className={cn('px-2 py-0.5 rounded text-xs', oldConfig.bgColor, oldConfig.color)}>
                        {oldConfig.label}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">অর্ডার তৈরি →</span>
                  )}
                  <span className={cn('px-2 py-0.5 rounded text-xs', newConfig?.bgColor, newConfig?.color)}>
                    {newConfig?.label || item.new_status}
                  </span>
                </div>

                {/* Date & note */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDateBengali(item.created_at, 'dd MMM yyyy, hh:mm a')}</span>
                  {item.note && (
                    <>
                      <span>•</span>
                      <span>{item.note}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);

OrderTimeline.displayName = 'OrderTimeline';
