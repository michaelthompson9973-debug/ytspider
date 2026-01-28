import React from 'react';
import { Bell, BellOff, Download, LayoutGrid, List, UserSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ViewMode } from './types';
import { cn } from '@/lib/utils';

interface OrdersHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  onExportCSV: () => void;
  onOpenFraudCheck: () => void;
  isExporting?: boolean;
}

export const OrdersHeader = React.forwardRef<HTMLDivElement, OrdersHeaderProps>(
  (
    {
      viewMode,
      onViewModeChange,
      notificationsEnabled,
      onToggleNotifications,
      onExportCSV,
      onOpenFraudCheck,
      isExporting = false,
    },
    ref
  ) => {
    return (
      <div ref={ref} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">অর্ডার ম্যানেজমেন্ট</h1>

        <div className="flex items-center gap-2">
          {/* Fraud Check Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={onOpenFraudCheck}>
                <UserSearch className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>ফ্রড চেক</TooltipContent>
          </Tooltip>

          {/* Notification Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={notificationsEnabled ? 'default' : 'outline'}
                size="icon"
                onClick={onToggleNotifications}
              >
                {notificationsEnabled ? (
                  <Bell className="h-4 w-4" />
                ) : (
                  <BellOff className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {notificationsEnabled ? 'নোটিফিকেশন বন্ধ করুন' : 'নোটিফিকেশন চালু করুন'}
            </TooltipContent>
          </Tooltip>

          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-md">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'rounded-r-none',
                    viewMode === 'table' && 'bg-muted'
                  )}
                  onClick={() => onViewModeChange('table')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>টেবিল ভিউ</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'rounded-l-none',
                    viewMode === 'grid' && 'bg-muted'
                  )}
                  onClick={() => onViewModeChange('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>গ্রিড ভিউ</TooltipContent>
            </Tooltip>
          </div>

          {/* Export CSV */}
          <Button variant="outline" onClick={onExportCSV} disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
        </div>
      </div>
    );
  }
);

OrdersHeader.displayName = 'OrdersHeader';
