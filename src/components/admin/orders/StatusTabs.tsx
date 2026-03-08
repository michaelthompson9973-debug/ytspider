import React from 'react';
import { OrderStatus, STATUS_CONFIG } from './types';
import { cn } from '@/lib/utils';

interface StatusCount {
  status: OrderStatus | 'all';
  count: number;
}

interface StatusTabsProps {
  counts: StatusCount[];
  selectedStatus: OrderStatus | 'all';
  onStatusChange: (status: OrderStatus | 'all') => void;
}

export const StatusTabs = React.forwardRef<HTMLDivElement, StatusTabsProps>(
  ({ counts, selectedStatus, onStatusChange }, ref) => {
    const allCount = counts.find((c) => c.status === 'all')?.count || 0;

    return (
      <div ref={ref} className="flex items-center gap-2 flex-wrap">
        {/* All Tab */}
        <button
          onClick={() => onStatusChange('all')}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            selectedStatus === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
          )}
        >
          <span>All</span>
          <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-background/20 text-xs">
            {allCount}
          </span>
        </button>

        {/* Status Tabs */}
        {counts
          .filter((c) => c.status !== 'all')
          .map((item) => {
            const config = STATUS_CONFIG[item.status as OrderStatus];
            if (!config) return null;

            return (
              <button
                key={item.status}
                onClick={() => onStatusChange(item.status as OrderStatus)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  selectedStatus === item.status
                    ? `${config.bgColor} ${config.color}`
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                )}
              >
                <span>{config.label}</span>
                <span
                  className={cn(
                    'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-xs',
                    selectedStatus === item.status
                      ? 'bg-background/30'
                      : 'bg-background/50'
                  )}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
      </div>
    );
  }
);

StatusTabs.displayName = 'StatusTabs';
