import React from 'react';
import { Eye, Edit, Printer, Truck, Trash2, ExternalLink, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Order, OrderStatus, STATUS_CONFIG, CustomerCourierHistory } from './types';
import { TrustBadge } from './TrustBadge';
import { formatCurrency, formatRelativeTime, getShortOrderId, truncateText } from './utils';
import { cn } from '@/lib/utils';

interface OrderGridProps {
  orders: Order[];
  selectedIds: string[];
  onSelectChange: (ids: string[]) => void;
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

export const OrderGrid = React.forwardRef<HTMLDivElement, OrderGridProps>(
  (
    {
      orders,
      selectedIds,
      onSelectChange,
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
    const handleRowSelect = (orderId: string, checked: boolean) => {
      if (checked) {
        onSelectChange([...selectedIds, orderId]);
      } else {
        onSelectChange(selectedIds.filter((id) => id !== orderId));
      }
    };

    if (isLoading) {
      return (
        <div ref={ref} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      );
    }

    if (orders.length === 0) {
      return (
        <div ref={ref} className="text-center py-12">
          <p className="text-muted-foreground">No orders found</p>
        </div>
      );
    }

    return (
      <div ref={ref} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {orders.map((order) => {
          const isSelected = selectedIds.includes(order.id);
          const courierHistory = courierHistoryMap[order.customer_phone] || null;
          const isRefreshing = refreshingPhones.includes(order.customer_phone);
          const statusConfig = STATUS_CONFIG[order.status];

          return (
            <Card
              key={order.id}
              className={cn(
                'transition-all hover:shadow-md cursor-pointer',
                isSelected && 'ring-2 ring-primary'
              )}
              onClick={() => onViewDetails(order)}
            >
              <CardContent className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleRowSelect(order.id, !!checked)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select ${order.customer_name}`}
                    />
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">
                        {getShortOrderId(order.id)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(order.created_at)}
                      </p>
                    </div>
                  </div>
                  <Badge className={cn(statusConfig.bgColor, statusConfig.color, 'text-xs')}>
                    {statusConfig.label}
                  </Badge>
                </div>

                {/* Customer */}
                <div className="space-y-1">
                  <p className="font-medium">{order.customer_name}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {order.customer_phone}
                  </div>
                  <div className="flex items-start gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                    {truncateText(order.customer_address, 40)}
                  </div>
                </div>

                {/* Trust & Total */}
                <div className="flex items-center justify-between">
                  <div onClick={(e) => e.stopPropagation()}>
                    <TrustBadge
                      courierHistory={courierHistory}
                      phone={order.customer_phone}
                      onClick={() => onTrustBadgeClick(order.customer_phone)}
                      onRefresh={() => onRefreshTrust(order.customer_phone)}
                      isRefreshing={isRefreshing}
                    />
                  </div>
                  <p className="font-bold text-lg">
                    {formatCurrency(order.total, order.currency)}
                  </p>
                </div>

                {/* Courier Status */}
                {order.tracking_code && (
                  <div
                    className="flex items-center gap-2 text-xs text-primary"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Truck className="h-3 w-3" />
                    <a
                      href={`https://steadfast.com.bd/t/${order.tracking_code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      {order.tracking_code}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {/* Actions */}
                <div
                  className="flex items-center gap-1 pt-2 border-t"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => onEdit(order)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    এডিট
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => onPrint(order)}
                  >
                    <Printer className="h-3 w-3 mr-1" />
                    প্রিন্ট
                  </Button>
                  {!order.tracking_code && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-xs text-primary"
                      onClick={() => onSendToCourier(order)}
                    >
                      <Truck className="h-3 w-3 mr-1" />
                      কুরিয়ার
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => onDelete(order)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }
);

OrderGrid.displayName = 'OrderGrid';
