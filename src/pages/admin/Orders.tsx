import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useShop } from '@/contexts/ShopContext';
import { ShopGuard } from '@/components/admin/ShopGuard';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { useOrderNotification } from '@/hooks/useOrderNotification';
import { useOrderRealtime } from '@/hooks/useOrderRealtime';
import { format } from 'date-fns';
import {
  Order,
  OrderItem,
  OrderStatus,
  OrderStatusHistory,
  CustomerCourierHistory,
  DateFilter,
  ViewMode,
  STATUS_CONFIG,
  OrdersHeader,
  OrderFilters,
  StatusTabs,
  OrderTable,
  OrderGrid,
  Pagination,
  BulkActionsBar,
  DeleteConfirmDialog,
  FraudCheckModal,
  OrderEditModal,
  OrderDetailsModal,
  getDateRange,
  formatCurrency,
  normalizePhone,
} from '@/components/admin/orders';
import { printInvoiceHTML } from '@/components/admin/orders/InvoicePrintView';

const PAGE_SIZE = 15;

export default function Orders() {
  const { currentShop } = useShop();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [fraudCheckPhone, setFraudCheckPhone] = useState<string>('');
  const [showFraudCheckModal, setShowFraudCheckModal] = useState(false);
  const [refreshingPhones, setRefreshingPhones] = useState<string[]>([]);

  // Realtime & notifications
  useOrderRealtime({ enabled: true });
  const { notificationsEnabled, toggleNotifications } = useOrderNotification({
    enabled: true,
    onNewOrder: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  // Fetch orders with filters
  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['orders', search, dateFilter, statusFilter, currentPage, pageSize, currentShop?.id],
    queryFn: async () => {
      if (!currentShop) return { orders: [], totalCount: 0 };
      
      const dateRange = getDateRange(dateFilter);
      
      let query = supabase
        .from('orders')
        .select('*, products(name), landing_pages(slug)', { count: 'exact' })
        .eq('shop_id', currentShop.id)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Apply date filter
      if (dateRange.start) {
        query = query.gte('created_at', dateRange.start.toISOString());
      }
      if (dateRange.end) {
        query = query.lt('created_at', dateRange.end.toISOString());
      }

      // Apply search filter
      if (search) {
        query = query.or(
          `customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,id.ilike.%${search}%`
        );
      }

      // Apply pagination
      const from = (currentPage - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      
      return { orders: data as Order[], totalCount: count || 0 };
    },
    enabled: !!currentShop,
  });

  const orders = ordersData?.orders || [];
  const totalCount = ordersData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Fetch status counts
  const { data: statusCounts = [] } = useQuery({
    queryKey: ['order-counts', currentShop?.id],
    queryFn: async () => {
      if (!currentShop) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select('status')
        .eq('shop_id', currentShop.id);
      
      if (error) throw error;

      const counts: Record<string, number> = { all: data.length };
      data.forEach((order) => {
        counts[order.status] = (counts[order.status] || 0) + 1;
      });

      return Object.entries(counts).map(([status, count]) => ({
        status: status as OrderStatus | 'all',
        count,
      }));
    },
    enabled: !!currentShop,
  });

  // Fetch courier history for visible orders
  const phones = useMemo(() => 
    [...new Set(orders.map((o) => o.customer_phone))],
    [orders]
  );

  const { data: courierHistoryData = [] } = useQuery({
    queryKey: ['courier-history', phones],
    queryFn: async () => {
      if (phones.length === 0) return [];
      
      const { data, error } = await supabase
        .from('customer_courier_history')
        .select('*')
        .in('phone', phones);
      
      if (error) throw error;
      return data as CustomerCourierHistory[];
    },
    enabled: phones.length > 0,
  });

  const courierHistoryMap = useMemo(() => {
    const map: Record<string, CustomerCourierHistory[]> = {};
    courierHistoryData.forEach((h) => {
      if (!map[h.phone]) map[h.phone] = [];
      map[h.phone].push(h);
    });
    return map;
  }, [courierHistoryData]);

  // Fetch order items for selected order
  const { data: orderItems = [] } = useQuery({
    queryKey: ['order-items', selectedOrder?.id],
    queryFn: async () => {
      if (!selectedOrder) return [];
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', selectedOrder.id);
      if (error) throw error;
      return data as OrderItem[];
    },
    enabled: !!selectedOrder,
  });

  // Fetch status history for selected order
  const { data: statusHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['order-status-history', selectedOrder?.id],
    queryFn: async () => {
      if (!selectedOrder) return [];
      const { data, error } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', selectedOrder.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as OrderStatusHistory[];
    },
    enabled: !!selectedOrder,
  });

  // Fetch products for item editing
  const { data: products = [] } = useQuery({
    queryKey: ['products-list', currentShop?.id],
    queryFn: async () => {
      if (!currentShop) return [];
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price')
        .eq('shop_id', currentShop.id)
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!currentShop,
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      // Get current order
      const { data: currentOrder } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();

      // Update order
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      if (error) throw error;

      // Log status change
      await supabase.from('order_status_history').insert({
        order_id: orderId,
        old_status: currentOrder?.status,
        new_status: status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-counts'] });
      queryClient.invalidateQueries({ queryKey: ['order-status-history'] });
      toast({ title: 'Status updated' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, updates }: { orderId: string; updates: Partial<Order> }) => {
      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setOrderToEdit(null);
      toast({ title: 'Order updated' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      // Delete order items first
      await supabase.from('order_items').delete().eq('order_id', orderId);
      // Delete order
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-counts'] });
      setOrderToDelete(null);
      toast({ title: 'Order deleted' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Fraud check mutation
  const fraudCheckMutation = useMutation({
    mutationFn: async (phone: string) => {
      const normalizedPhone = normalizePhone(phone);
      const { data, error } = await supabase.functions.invoke('test-fraudcheck', {
        body: { phone: normalizedPhone },
      });
      if (error) throw error;
      return { data, phone: normalizedPhone };
    },
    onSuccess: async (result) => {
      // Wait a moment for DB to persist, then refetch
      await new Promise(resolve => setTimeout(resolve, 500));
      await queryClient.invalidateQueries({ queryKey: ['courier-history'] });
      await queryClient.refetchQueries({ queryKey: ['courier-history', phones] });
      toast({ title: 'Fraud check completed' });
    },
    onError: (error) => {
      toast({ title: 'এরর', description: error.message, variant: 'destructive' });
    },
  });

  // Export CSV
  const exportCSV = useCallback(() => {
    if (orders.length === 0) {
      toast({ title: 'No orders to export', variant: 'destructive' });
      return;
    }

    const headers = [
      'ID', 'Customer', 'Phone', 'Address', 'City', 'Product', 
      'Qty', 'Total', 'Currency', 'Status', 'Created'
    ];
    const rows = orders.map((o) => [
      o.id,
      o.customer_name,
      o.customer_phone,
      o.customer_address,
      o.customer_city,
      o.products?.name ?? '',
      o.quantity ?? 1,
      o.total ?? '',
      o.currency ?? 'BDT',
      o.status,
      format(new Date(o.created_at), 'yyyy-MM-dd HH:mm'),
    ]);

    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [orders, toast]);

  // Print invoice
  const printInvoice = useCallback((order: Order) => {
    printInvoiceHTML({ order, items: orderItems, shopName: currentShop?.name || 'Shop', type: 'invoice' });
  }, [orderItems, currentShop]);

  // Print shipping label
  const printShippingLabel = useCallback((order: Order) => {
    printInvoiceHTML({ order, items: [], shopName: currentShop?.name || 'Shop', type: 'label' });
  }, [currentShop]);

  // Handlers
  const handleSelectAll = useCallback((selected: boolean) => {
    setSelectedIds(selected ? orders.map((o) => o.id) : []);
  }, [orders]);

  const handleTrustBadgeClick = useCallback((phone: string) => {
    setFraudCheckPhone(phone);
    setShowFraudCheckModal(true);
    
    // Auto-check if no history
    const history = courierHistoryMap[phone];
    if (!history || history.length === 0) {
      fraudCheckMutation.mutate(phone);
    }
  }, [courierHistoryMap, fraudCheckMutation]);

  const handleRefreshTrust = useCallback(async (phone: string) => {
    setRefreshingPhones((prev) => [...prev, phone]);
    try {
      await fraudCheckMutation.mutateAsync(phone);
    } finally {
      setRefreshingPhones((prev) => prev.filter((p) => p !== phone));
    }
  }, [fraudCheckMutation]);

  const handleBulkStatusChange = useCallback(async (status: OrderStatus) => {
    for (const id of selectedIds) {
      await updateStatusMutation.mutateAsync({ orderId: id, status });
    }
    setSelectedIds([]);
  }, [selectedIds, updateStatusMutation]);

  const handleBulkSendToCourier = useCallback(() => {
    toast({ title: 'Coming soon', description: 'Bulk courier sending will be available soon' });
  }, [toast]);

  const handleSendToCourier = useCallback(() => {
    toast({ title: 'Coming soon', description: 'Courier integration will be available soon' });
  }, [toast]);

  const handleSaveItems = useCallback(async (items: OrderItem[]) => {
    // This would update order items - simplified for now
    toast({ title: 'Coming soon', description: 'Item editing will be available soon' });
  }, [toast]);

  // Courier history for fraud check modal
  const fraudCheckHistory = useMemo(() => {
    return courierHistoryMap[fraudCheckPhone] || [];
  }, [courierHistoryMap, fraudCheckPhone]);

  return (
    <AdminLayout>
      <ShopGuard>
      <div className="space-y-6">
        {/* Header */}
        <OrdersHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          notificationsEnabled={notificationsEnabled}
          onToggleNotifications={toggleNotifications}
          onExportCSV={exportCSV}
          onOpenFraudCheck={() => {
            setFraudCheckPhone('');
            setShowFraudCheckModal(true);
          }}
        />

        {/* Filters */}
        <OrderFilters
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setCurrentPage(1);
          }}
          dateFilter={dateFilter}
          onDateFilterChange={(value) => {
            setDateFilter(value);
            setCurrentPage(1);
          }}
        />

        {/* Status Tabs */}
        <StatusTabs
          counts={statusCounts}
          selectedStatus={statusFilter}
          onStatusChange={(status) => {
            setStatusFilter(status);
            setCurrentPage(1);
          }}
        />

        {/* Orders List */}
        {viewMode === 'table' ? (
          <OrderTable
            orders={orders}
            selectedIds={selectedIds}
            onSelectChange={setSelectedIds}
            onSelectAll={handleSelectAll}
            onViewDetails={setSelectedOrder}
            onEdit={setOrderToEdit}
            onPrint={printInvoice}
            onSendToCourier={handleSendToCourier}
            onDelete={setOrderToDelete}
            onStatusChange={(orderId, status) => updateStatusMutation.mutate({ orderId, status })}
            onTrustBadgeClick={handleTrustBadgeClick}
            onRefreshTrust={handleRefreshTrust}
            courierHistoryMap={courierHistoryMap}
            refreshingPhones={refreshingPhones}
            isLoading={isLoadingOrders}
          />
        ) : (
          <OrderGrid
            orders={orders}
            selectedIds={selectedIds}
            onSelectChange={setSelectedIds}
            onViewDetails={setSelectedOrder}
            onEdit={setOrderToEdit}
            onPrint={printInvoice}
            onSendToCourier={handleSendToCourier}
            onDelete={setOrderToDelete}
            onStatusChange={(orderId, status) => updateStatusMutation.mutate({ orderId, status })}
            onTrustBadgeClick={handleTrustBadgeClick}
            onRefreshTrust={handleRefreshTrust}
            courierHistoryMap={courierHistoryMap}
            refreshingPhones={refreshingPhones}
            isLoading={isLoadingOrders}
          />
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />

        {/* Bulk Actions Bar */}
        <BulkActionsBar
          selectedCount={selectedIds.length}
          onClearSelection={() => setSelectedIds([])}
          onBulkStatusChange={handleBulkStatusChange}
          onBulkSendToCourier={handleBulkSendToCourier}
        />

        {/* Modals */}
        <OrderDetailsModal
          open={!!selectedOrder}
          onOpenChange={(open) => !open && setSelectedOrder(null)}
          order={selectedOrder}
          orderItems={orderItems}
          statusHistory={statusHistory}
          courierHistory={courierHistoryMap[selectedOrder?.customer_phone || ''] || []}
          products={products}
          onStatusChange={(status) => {
            if (selectedOrder) {
              updateStatusMutation.mutate({ orderId: selectedOrder.id, status });
            }
          }}
          onSendToCourier={handleSendToCourier}
          onPrint={() => selectedOrder && printInvoice(selectedOrder)}
          onEdit={() => {
            if (selectedOrder) {
              setOrderToEdit(selectedOrder);
              setSelectedOrder(null);
            }
          }}
          onSaveItems={handleSaveItems}
          onTrustBadgeClick={() => {
            if (selectedOrder) {
              handleTrustBadgeClick(selectedOrder.customer_phone);
            }
          }}
          onRefreshTrust={() => {
            if (selectedOrder) {
              handleRefreshTrust(selectedOrder.customer_phone);
            }
          }}
          isRefreshingTrust={selectedOrder ? refreshingPhones.includes(selectedOrder.customer_phone) : false}
          isLoadingHistory={isLoadingHistory}
        />

        <OrderEditModal
          open={!!orderToEdit}
          onOpenChange={(open) => !open && setOrderToEdit(null)}
          order={orderToEdit}
          onSave={(updates) => {
            if (orderToEdit) {
              updateOrderMutation.mutate({ orderId: orderToEdit.id, updates });
            }
          }}
          isSaving={updateOrderMutation.isPending}
        />

        <DeleteConfirmDialog
          open={!!orderToDelete}
          onOpenChange={(open) => !open && setOrderToDelete(null)}
          order={orderToDelete}
          onConfirm={() => {
            if (orderToDelete) {
              deleteOrderMutation.mutate(orderToDelete.id);
            }
          }}
          isDeleting={deleteOrderMutation.isPending}
        />

        <FraudCheckModal
          open={showFraudCheckModal}
          onOpenChange={setShowFraudCheckModal}
          phone={fraudCheckPhone}
          courierHistory={fraudCheckHistory}
          onCheckPhone={async (phone) => {
            setFraudCheckPhone(phone);
            await fraudCheckMutation.mutateAsync(phone);
          }}
          isChecking={fraudCheckMutation.isPending}
        />
      </div>
      </ShopGuard>
    </AdminLayout>
  );
}
