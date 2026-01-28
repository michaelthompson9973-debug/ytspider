import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DateFilter, DATE_FILTER_OPTIONS } from './types';
import { cn } from '@/lib/utils';

interface OrderFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  dateFilter: DateFilter;
  onDateFilterChange: (value: DateFilter) => void;
}

export const OrderFilters = React.forwardRef<HTMLDivElement, OrderFiltersProps>(
  ({ search, onSearchChange, dateFilter, onDateFilterChange }, ref) => {
    return (
      <div ref={ref} className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="অর্ডার নম্বর, নাম বা ফোন দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => onSearchChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Date Filter Buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          {DATE_FILTER_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={dateFilter === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onDateFilterChange(option.value)}
              className={cn(
                'text-xs',
                dateFilter === option.value && 'bg-primary text-primary-foreground'
              )}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    );
  }
);

OrderFilters.displayName = 'OrderFilters';
