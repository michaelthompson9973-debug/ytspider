import React from 'react';
import { Eye, Edit, Printer, Truck, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Order, OrderStatus, STATUS_CONFIG, CustomerCourierHistory } from './types';
import { TrustBadge } from './TrustBadge';
import { formatCurrency, formatRelativeTime, getShortOrderId, truncateText } from './utils';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface OrderTableProps {
  orders: Order[];
  selectedIds: string[];
  onSelectChange: (ids: string[]) => void;
  onSelectAll: (selected: boolean) => void;
  onViewDetails: (order: Order) => void;
  onEdit: (order: Order) => void;
  onPrint: (order: Order) => void;
  onSendToCourier: (order: Order) => void;
  onDelete: (order: Order) => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onTrustBadgeClick: (phone: string) => void;
  onRefreshTrust: (phone: string) => void;
  courierHistoryMap: Record<string, CustomerCourierHistory[]>;
  refreshingPhones: string[];
  isLoading?: boolean;
}

export const OrderTable = React.forwardRef<HTMLDivElement, OrderTableProps>(
  (
    {
      orders,
      selectedIds,
      onSelectChange,
      onSelectAll,
      onViewDetails,
      onEdit,
      onPrint,
      onSendToCourier,
      onDelete,
      onStatusChange,
      onTrustBadgeClick,
      onRefreshTrust,
      courierHistoryMap,
      refreshingPhones,
      isLoading = false,
    },
    ref
  ) => {
    const { t } = useLanguage();
    const allSelected = orders.length > 0 && selectedIds.length === orders.length;
    const someSelected = selectedIds.length > 0 && selectedIds.length < orders.length;

    const handleRowSelect = (orderId: string, checked: boolean) => {
      if (checked) {
        onSelectChange([...selectedIds, orderId]);
      } else {
        onSelectChange(selectedIds.filter((id) => id !== orderId));
      }
    };

    if (isLoading) {
      return (
        <div ref={ref} className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      );
    }

    if (orders.length === 0) {
      return (
        <div ref={ref} className="text-center py-12">
          <p className="text-muted-foreground">{t('orders.noOrders')}</p>
        </div>
      );
    }

    return (
      <div ref={ref} className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-accent/50 text-accent-foreground">
              <th className="px-4 py-3 text-left">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onSelectAll}
                  aria-label={t('orders.selectAll')}
                  className={someSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                />
              </th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">{t('orders.order')}</th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">{t('orders.customer')}</th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">{t('orders.trust')}</th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">{t('orders.product')}</th>
              <th className="px-4 py-3 text-right font-medium whitespace-nowrap">{t('orders.total')}</th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">{t('common.status')}</th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">{t('orders.courier')}</th>
              <th className="px-4 py-3 text-center font-medium whitespace-nowrap">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const isSelected = selectedIds.includes(order.id);
              const courierHistory = courierHistoryMap[order.customer_phone] || null;
              const isRefreshing = refreshingPhones.includes(order.customer_phone);
              const statusConfig = STATUS_CONFIG[order.status];

              return (
                <tr
                  key={order.id}
                  className={cn(
                    'border-b transition-colors',
                    isSelected && 'bg-primary/5'
                  )}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleRowSelect(order.id, !!checked)}
                      aria-label={`${t('orders.selectAll')} ${order.customer_name}`}
                    />
                  </td>

                  {/* Order Info */}
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      <p className="font-mono text-xs text-muted-foreground">
                        {getShortOrderId(order.id)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(order.created_at)}
                      </p>
                    </div>
                  </td>

                  {/* Customer Info */}
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                      <p className="text-xs text-muted-foreground">
                        {truncateText(order.customer_address, 25)}
                      </p>
                    </div>
                  </td>

                  {/* Trust Badge */}
                  <td className="px-4 py-3">
                    <TrustBadge
                      courierHistory={courierHistory}
                      phone={order.customer_phone}
                      onClick={() => onTrustBadgeClick(order.customer_phone)}
                      onRefresh={() => onRefreshTrust(order.customer_phone)}
                      isRefreshing={isRefreshing}
                    />
                  </td>

                  {/* Product */}
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      <p className="text-sm">
                        {order.products?.name || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.quantity || 1} {t('orders.pieces')}
                      </p>
                    </div>
                  </td>

                  {/* Total */}
                  <td className="px-4 py-3 text-right">
                    <p className="font-semibold">
                      {formatCurrency(order.total, order.currency)}
                    </p>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <Select
                      value={order.status}
                      onValueChange={(status: OrderStatus) => onStatusChange(order.id, status)}
                    >
                      <SelectTrigger
                        className={cn(
                          'h-8 w-28 text-xs',
                          statusConfig.bgColor,
                          statusConfig.color
                        )}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                          <SelectItem key={value} value={value}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>

                  {/* Courier */}
                  <td className="px-4 py-3">
                    {order.tracking_code ? (
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium">{order.courier_provider}</p>
                        <a
                          href={`https://steadfast.com.bd/t/${order.tracking_code}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          {order.tracking_code}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onViewDetails(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('orders.details')}</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onEdit(order)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('common.edit')}</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onPrint(order)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('common.print')}</TooltipContent>
                      </Tooltip>

                      {!order.tracking_code && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary"
                              onClick={() => onSendToCourier(order)}
                            >
                              <Truck className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('orders.sendToCourier')}</TooltipContent>
                        </Tooltip>
                      )}

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => onDelete(order)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('common.delete')}</TooltipContent>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
);

OrderTable.displayName = 'OrderTable';
