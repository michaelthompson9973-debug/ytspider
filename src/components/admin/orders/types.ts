import { Database } from '@/integrations/supabase/types';

export type OrderStatus = Database['public']['Enums']['order_status'];

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  product_id: string | null;
  landing_page_id: string | null;
  quantity: number;
  unit_price: number | null;
  subtotal: number | null;
  delivery_charge: number | null;
  total: number | null;
  currency: string | null;
  status: OrderStatus;
  note: string | null;
  courier_provider: string | null;
  consignment_id: string | null;
  tracking_code: string | null;
  courier_status: string | null;
  courier_synced_at: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  event_id: string | null;
  ip_address: string | null;
  created_at: string;
  updated_at: string;
  products?: { name: string } | null;
  landing_pages?: { slug: string } | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

export interface CustomerCourierHistory {
  id: string;
  phone: string;
  provider: string;
  total_orders: number | null;
  total_delivered: number | null;
  total_cancelled: number | null;
  success_rate: number | null;
  checked_at: string;
  raw_data: any;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  old_status: string | null;
  new_status: string;
  note: string | null;
  changed_by: string | null;
  created_at: string;
}

export type TrustLevel = 'trusted' | 'medium' | 'risky' | 'new';

export type DateFilter = 'today' | 'yesterday' | '7days' | '30days' | 'all';

export type ViewMode = 'table' | 'grid';

// Status labels and colors
export const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
  new: { label: 'New', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  pending: { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  processing: { label: 'Processing', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  confirmed: { label: 'Confirmed', color: 'text-green-700', bgColor: 'bg-green-100' },
  shipped: { label: 'Shipped', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  delivered: { label: 'Delivered', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const DATE_FILTER_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7days', label: '7 Days' },
  { value: '30days', label: '30 Days' },
  { value: 'all', label: 'All' },
];
