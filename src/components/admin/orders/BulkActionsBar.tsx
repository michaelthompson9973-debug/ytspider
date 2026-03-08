import React from 'react';
import { X, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OrderStatus, STATUS_CONFIG } from './types';

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkStatusChange: (status: OrderStatus) => void;
  onBulkSendToCourier: () => void;
  isProcessing?: boolean;
}

export const BulkActionsBar = React.forwardRef<HTMLDivElement, BulkActionsBarProps>(
  (
    { selectedCount, onClearSelection, onBulkStatusChange, onBulkSendToCourier, isProcessing = false },
    ref
  ) => {
    if (selectedCount === 0) return null;

    return (
      <div
        ref={ref}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-background border rounded-lg shadow-lg px-4 py-3"
      >
        {/* Selected Count */}
        <div className="flex items-center gap-2">
          <span className="font-medium">{selectedCount} selected</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Bulk Status Change */}
        <Select onValueChange={(status: OrderStatus) => onBulkStatusChange(status)} disabled={isProcessing}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Change Status" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_CONFIG).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Bulk Send to Courier */}
        <Button onClick={onBulkSendToCourier} disabled={isProcessing}>
          <Truck className="mr-2 h-4 w-4" />
          Send to Courier
        </Button>
      </div>
    );
  }
);

BulkActionsBar.displayName = 'BulkActionsBar';
