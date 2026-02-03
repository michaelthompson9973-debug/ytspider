
# মাস্টার ড্যাশবোর্ড রিডিজাইন

## Overview

বর্তমান ড্যাশবোর্ডকে একটি **প্রিমিয়াম, ডাইনামিক, থিম-ম্যাচিং** ড্যাশবোর্ডে রূপান্তর করা হবে যেখানে থাকবে:
- Multi-color KPI cards with icon illustrations
- Sales & Revenue summary
- Visitors summary (from tracking data)
- Best selling products list
- Realtime data updates
- Skeleton loaders
- Notification panel

---

## Dashboard Layout

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│  📊 Dashboard                                            🔔 Notification Panel  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │ 💰 Total Revenue│ │ 📦 Total Orders │ │ 🆕 New Orders  │ │ ✅ Delivered    ││
│  │     ৳2,380      │ │       5         │ │       5        │ │       0         ││
│  │   +12% ↑        │ │   Today: 0      │ │   Pending      │ │   This week     ││
│  │   [Gradient BG] │ │   [Gradient BG] │ │   [Gradient BG]│ │   [Gradient BG] ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘│
│                                                                                 │
│  ┌──────────────────────────────────────┐ ┌────────────────────────────────────┐│
│  │ 📈 Sales Overview (Chart)            │ │ 🏆 Best Selling Products          ││
│  │                                      │ │                                    ││
│  │   [Line/Area Chart - Last 7 days]    │ │  1. Baby Pant Diaper - 2 sold     ││
│  │                                      │ │  2. ...                           ││
│  │                                      │ │  3. ...                           ││
│  └──────────────────────────────────────┘ └────────────────────────────────────┘│
│                                                                                 │
│  ┌──────────────────────────────────────┐ ┌────────────────────────────────────┐│
│  │ 🕐 Recent Orders                     │ │ 📊 Order Status Distribution      ││
│  │                                      │ │                                    ││
│  │   [Real-time updating table]         │ │   [Pie/Donut Chart]               ││
│  │   with animated new row entry        │ │   New: 5, Confirmed: 0, etc.      ││
│  └──────────────────────────────────────┘ └────────────────────────────────────┘│
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 1: Multi-Color KPI Cards

### Design Specs

প্রতিটি KPI card আলাদা gradient background এবং large icon illustration সহ:

| Card | Gradient | Icon | Data |
|------|----------|------|------|
| Total Revenue | Blue-Purple | DollarSign/Wallet | ৳2,380 + % change |
| Total Orders | Green-Teal | ShoppingCart | 5 + today count |
| New Orders | Orange-Yellow | Package | 5 + pending label |
| Delivered | Emerald-Green | CheckCircle | 0 + this week |
| Cancelled | Red-Rose | XCircle | 0 + rate |
| Products | Indigo-Violet | Box | 1 active |

### Theme Integration

Cards গুলো AdminThemeContext এর সাথে যুক্ত থাকবে:
- Default theme: Standard gradients
- Ocean theme: Teal-based gradients
- Forest theme: Green-based gradients
- Sunset theme: Orange-based gradients

---

## Part 2: Sales Summary Section

### Components

1. **Revenue Overview Card**
   - Total revenue (৳2,380)
   - Average order value
   - Revenue trend (last 7 days vs previous)

2. **Sales Chart**
   - recharts library ব্যবহার করে Area/Line chart
   - Last 7/30 days toggle
   - Daily revenue visualization
   - Theme-matched colors

### Data Query

```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as orders,
  SUM(total) as revenue
FROM orders
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date
```

---

## Part 3: Best Selling Products

### Layout

```text
┌────────────────────────────────────────┐
│ 🏆 Best Selling Products               │
├────────────────────────────────────────┤
│ ┌────┐                                 │
│ │ 1  │ Baby Pant Diaper    2 sold      │
│ └────┘ ৳1,220 revenue                  │
│ ┌────┐                                 │
│ │ 2  │ Product Name        X sold      │
│ └────┘ ৳XXX revenue                    │
│ ┌────┐                                 │
│ │ 3  │ Product Name        X sold      │
│ └────┘ ৳XXX revenue                    │
│                                        │
│ [View All Products →]                  │
└────────────────────────────────────────┘
```

### Data Query

```sql
SELECT p.id, p.name, p.images,
  COUNT(o.id) as order_count,
  SUM(o.quantity) as total_sold,
  SUM(o.total) as revenue
FROM products p
LEFT JOIN orders o ON o.product_id = p.id
GROUP BY p.id
ORDER BY total_sold DESC
LIMIT 5
```

---

## Part 4: Skeleton Loaders

### Dashboard Skeleton Component

প্রতিটি section এর জন্য matching skeleton:

1. **KPI Card Skeleton**
```tsx
<div className="animate-pulse">
  <div className="h-4 w-20 bg-muted rounded mb-2" />
  <div className="h-8 w-32 bg-muted rounded mb-2" />
  <div className="h-3 w-16 bg-muted rounded" />
</div>
```

2. **Chart Skeleton**
```tsx
<div className="h-64 bg-muted/50 rounded-lg animate-pulse flex items-end gap-1 p-4">
  {[40, 60, 35, 80, 45, 70, 55].map((h, i) => (
    <div key={i} style={{height: `${h}%`}} className="flex-1 bg-muted rounded-t" />
  ))}
</div>
```

3. **Table Row Skeleton**
```tsx
<tr className="animate-pulse">
  <td><div className="h-4 w-24 bg-muted rounded" /></td>
  <td><div className="h-4 w-32 bg-muted rounded" /></td>
  ...
</tr>
```

---

## Part 5: Realtime Data Updates

### Hook: useDashboardRealtime

```typescript
// src/hooks/useDashboardRealtime.ts

export function useDashboardRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders'
      }, () => {
        // Invalidate all dashboard queries
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        queryClient.invalidateQueries({ queryKey: ['recent-orders'] });
        queryClient.invalidateQueries({ queryKey: ['sales-chart'] });
        queryClient.invalidateQueries({ queryKey: ['best-selling'] });
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [queryClient]);
}
```

### New Order Animation

নতুন অর্ডার আসলে Recent Orders table এ:
- Row slide-in animation
- Highlight effect (green glow)
- Fade out to normal after 3 seconds

---

## Part 6: Notification Panel

### Design

```text
┌──────────────────────────────────────┐
│ 🔔 Notifications           [Clear]  │
├──────────────────────────────────────┤
│ ┌────────────────────────────────┐   │
│ │ 🆕 New Order                   │   │
│ │ Md - ৳610 • 5 min ago         │   │
│ │ [View] [Confirm]              │   │
│ └────────────────────────────────┘   │
│                                      │
│ ┌────────────────────────────────┐   │
│ │ 📦 Order Shipped              │   │
│ │ Order #abc123 • 1 hour ago    │   │
│ │ [Track]                       │   │
│ └────────────────────────────────┘   │
│                                      │
│ ┌────────────────────────────────┐   │
│ │ ⚠️ Low Stock Alert            │   │
│ │ Baby Diaper - 2 remaining     │   │
│ │ [Restock]                     │   │
│ └────────────────────────────────┘   │
└──────────────────────────────────────┘
```

### Implementation

- Sheet component (slides from right)
- Bell icon in header with badge count
- Notification types: New Order, Status Change, Low Stock
- Mark as read functionality
- Clear all option

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/admin/Dashboard.tsx` | Complete redesign |
| `src/components/admin/dashboard/KpiCard.tsx` | Multi-color KPI cards |
| `src/components/admin/dashboard/SalesChart.tsx` | Revenue chart |
| `src/components/admin/dashboard/BestSellingProducts.tsx` | Top products list |
| `src/components/admin/dashboard/RecentOrdersTable.tsx` | Real-time orders |
| `src/components/admin/dashboard/OrderStatusChart.tsx` | Pie chart |
| `src/components/admin/dashboard/DashboardSkeleton.tsx` | Loading states |
| `src/components/admin/dashboard/NotificationPanel.tsx` | Notification side panel |
| `src/components/admin/dashboard/index.ts` | Exports |
| `src/hooks/useDashboardRealtime.ts` | Realtime subscription |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/locales/bn.ts` | Dashboard translations |
| `src/locales/en.ts` | Dashboard translations |
| `src/components/admin/AdminLayout.tsx` | Notification bell in header |

---

## Translation Keys (New)

```typescript
dashboard: {
  title: 'ড্যাশবোর্ড',
  totalRevenue: 'মোট আয়',
  totalOrders: 'মোট অর্ডার',
  newOrders: 'নতুন অর্ডার',
  delivered: 'ডেলিভার্ড',
  cancelled: 'বাতিল',
  products: 'প্রোডাক্ট',
  todayOrders: 'আজকের অর্ডার',
  thisWeek: 'এই সপ্তাহে',
  pending: 'পেন্ডিং',
  salesOverview: 'সেলস ওভারভিউ',
  bestSelling: 'সেরা বিক্রিত প্রোডাক্ট',
  recentOrders: 'সাম্প্রতিক অর্ডার',
  orderStatus: 'অর্ডার স্ট্যাটাস',
  notifications: 'নোটিফিকেশন',
  viewAll: 'সব দেখুন',
  noOrders: 'কোনো অর্ডার নেই',
  sold: 'বিক্রিত',
  revenue: 'আয়',
  avgOrderValue: 'গড় অর্ডার মূল্য',
  last7Days: 'গত ৭ দিন',
  last30Days: 'গত ৩০ দিন',
}
```

---

## KPI Card Colors (Multi-color)

```typescript
const kpiCards = [
  {
    key: 'revenue',
    gradient: 'from-blue-500 to-purple-600',
    bgLight: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    Icon: Wallet,
  },
  {
    key: 'orders',
    gradient: 'from-emerald-500 to-teal-600',
    bgLight: 'bg-emerald-50',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    Icon: ShoppingCart,
  },
  {
    key: 'newOrders',
    gradient: 'from-orange-400 to-amber-500',
    bgLight: 'bg-orange-50',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    Icon: Package,
  },
  {
    key: 'delivered',
    gradient: 'from-green-500 to-emerald-600',
    bgLight: 'bg-green-50',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    Icon: CheckCircle2,
  },
];
```

---

## Technical Implementation

### 1. Dashboard Data Hook

```typescript
// All dashboard data in one hook with parallel fetching
export function useDashboardData() {
  return useQueries({
    queries: [
      { queryKey: ['dashboard-stats'], queryFn: fetchStats },
      { queryKey: ['sales-chart'], queryFn: fetchSalesData },
      { queryKey: ['best-selling'], queryFn: fetchBestSelling },
      { queryKey: ['recent-orders'], queryFn: fetchRecentOrders },
      { queryKey: ['order-distribution'], queryFn: fetchOrderDistribution },
    ]
  });
}
```

### 2. Notification System

- useOrderNotification hook ইতিমধ্যে আছে
- NotificationPanel component নতুন তৈরি
- Bell icon AdminLayout header এ

### 3. Chart Library

recharts ইতিমধ্যে installed আছে - সেটাই ব্যবহার করব

---

## Performance Optimizations

1. **Parallel Data Fetching**: useQueries দিয়ে সব data একসাথে fetch
2. **Skeleton Loading**: প্রতিটি section এ individual skeleton
3. **Realtime Subscription**: Single channel for all dashboard updates
4. **Memoization**: useMemo for chart data formatting
5. **Lazy Loading**: Charts lazy load করা হবে
