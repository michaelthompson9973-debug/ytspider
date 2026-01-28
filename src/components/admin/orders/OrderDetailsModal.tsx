import React from 'react';
import { Phone, MapPin, Mail, ExternalLink, Truck, Clock, Calendar, Printer, Edit, Package } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Order, OrderItem, OrderStatus, OrderStatusHistory, CustomerCourierHistory, STATUS_CONFIG } from './types';
import { TrustBadge } from './TrustBadge';
import { OrderTimeline } from './OrderTimeline';
import { OrderItemsEditor } from './OrderItemsEditor';
import { formatCurrency, formatDateBengali, getShortOrderId } from './utils';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  price: number;
}

interface OrderDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  orderItems: OrderItem[];
  statusHistory: OrderStatusHistory[];
  courierHistory: CustomerCourierHistory[];
  products: Product[];
  onStatusChange: (status: OrderStatus) => void;
  onSendToCourier: () => void;
  onPrint: () => void;
  onEdit: () => void;
  onSaveItems: (items: OrderItem[]) => void;
  onTrustBadgeClick: () => void;
  onRefreshTrust: () => void;
  isRefreshingTrust?: boolean;
  isSavingItems?: boolean;
  isSendingToCourier?: boolean;
  isLoadingHistory?: boolean;
}

export const OrderDetailsModal = React.forwardRef<HTMLDivElement, OrderDetailsModalProps>(
  (
    {
      open,
      onOpenChange,
      order,
      orderItems,
      statusHistory,
      courierHistory,
      products,
      onStatusChange,
      onSendToCourier,
      onPrint,
      onEdit,
      onSaveItems,
      onTrustBadgeClick,
      onRefreshTrust,
      isRefreshingTrust = false,
      isSavingItems = false,
      isSendingToCourier = false,
      isLoadingHistory = false,
    },
    ref
  ) => {
    const [isEditingItems, setIsEditingItems] = React.useState(false);

    if (!order) return null;

    const statusConfig = STATUS_CONFIG[order.status];

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent ref={ref} className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <span>অর্ডার {getShortOrderId(order.id)}</span>
                <span className={cn('text-sm px-2 py-0.5 rounded', statusConfig.bgColor, statusConfig.color)}>
                  {statusConfig.label}
                </span>
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onPrint}>
                  <Printer className="h-4 w-4 mr-1" />
                  প্রিন্ট
                </Button>
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-1" />
                  এডিট
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Customer Info Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>কাস্টমার তথ্য</span>
                  <TrustBadge
                    courierHistory={courierHistory}
                    phone={order.customer_phone}
                    onClick={onTrustBadgeClick}
                    onRefresh={onRefreshTrust}
                    isRefreshing={isRefreshingTrust}
                    size="md"
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium text-base">{order.customer_name}</p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${order.customer_phone}`} className="hover:underline">
                    {order.customer_phone}
                  </a>
                </div>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{order.customer_address}, {order.customer_city}</span>
                </div>
                {order.note && (
                  <div className="mt-2 p-2 bg-muted rounded text-sm">
                    <strong>নোট:</strong> {order.note}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Summary Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  অর্ডার সারসংক্ষেপ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDateBengali(order.created_at, 'dd MMMM yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatDateBengali(order.created_at, 'hh:mm a')}</span>
                  </div>
                </div>

                {/* Status Change */}
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">স্ট্যাটাস:</span>
                  <Select value={order.status} onValueChange={onStatusChange}>
                    <SelectTrigger className={cn('w-36', statusConfig.bgColor, statusConfig.color)}>
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
                </div>
              </CardContent>
            </Card>

            {/* Courier Info Card */}
            {order.tracking_code ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    কুরিয়ার তথ্য
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground">কুরিয়ার</p>
                      <p className="font-medium">{order.courier_provider}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">স্ট্যাটাস</p>
                      <p className="font-medium">{order.courier_status || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Consignment ID</p>
                      <p className="font-mono">{order.consignment_id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">ট্র্যাকিং কোড</p>
                      <a
                        href={`https://steadfast.com.bd/t/${order.tracking_code}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline font-mono"
                      >
                        {order.tracking_code}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button onClick={onSendToCourier} disabled={isSendingToCourier} className="w-full">
                <Truck className="mr-2 h-4 w-4" />
                {isSendingToCourier ? 'কুরিয়ারে পাঠানো হচ্ছে...' : 'কুরিয়ারে পাঠান'}
              </Button>
            )}

            {/* Order Items */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">অর্ডার আইটেম</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderItemsEditor
                  items={orderItems}
                  products={products}
                  currency={order.currency || 'BDT'}
                  onSave={onSaveItems}
                  isEditing={isEditingItems}
                  onEditChange={setIsEditingItems}
                  isSaving={isSavingItems}
                />

                <Separator className="my-4" />

                {/* Financial Summary */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">সাবটোটাল:</span>
                    <span>{formatCurrency(order.subtotal, order.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ডেলিভারি চার্জ:</span>
                    <span>{formatCurrency(order.delivery_charge, order.currency)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>মোট:</span>
                    <span>{formatCurrency(order.total, order.currency)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Timeline */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">স্ট্যাটাস ইতিহাস</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderTimeline history={statusHistory} isLoading={isLoadingHistory} />
              </CardContent>
            </Card>

            {/* UTM Info */}
            {(order.utm_source || order.utm_medium || order.utm_campaign) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">UTM প্যারামিটার</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1">
                  {order.utm_source && <p>Source: {order.utm_source}</p>}
                  {order.utm_medium && <p>Medium: {order.utm_medium}</p>}
                  {order.utm_campaign && <p>Campaign: {order.utm_campaign}</p>}
                  {order.utm_term && <p>Term: {order.utm_term}</p>}
                  {order.utm_content && <p>Content: {order.utm_content}</p>}
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

OrderDetailsModal.displayName = 'OrderDetailsModal';
