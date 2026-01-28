
# সম্পূর্ণ অর্ডার ম্যানেজমেন্ট সিস্টেম - পরিকল্পনা

এই পরিকল্পনায় `/admin/orders` পেজের জন্য একটি সম্পূর্ণ অর্ডার ম্যানেজমেন্ট সিস্টেম তৈরি করা হবে যেখানে আপনার বলা সব ফিচার থাকবে।

---

## বর্তমান অবস্থা

| বিষয় | অবস্থা |
|-------|--------|
| Orders.tsx | বেসিক টেবিল আছে, ফিল্টার ও ডিটেইলস মডাল আছে |
| order_status_history টেবিল | আছে |
| customer_courier_history টেবিল | আছে |
| shop_settings টেবিল | আছে |
| test-fraudcheck Edge Function | আছে |

---

## ধাপ ১: ডাটাবেস পরিবর্তন

### ১.১ order_status enum আপডেট
বর্তমান: `new`, `confirmed`, `shipped`, `cancelled`
নতুন: `pending`, `processing`, `shipped`, `delivered`, `cancelled`

```sql
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'processing';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'delivered';
```

### ১.২ Realtime সক্রিয় করা
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_courier_history;
```

### ১.৩ shop_settings এ admin_notification_email যোগ
এটা UI দিয়ে করা হবে।

---

## ধাপ ২: নতুন Edge Functions

### ২.১ courier-fraud-check
- phone নম্বর দিয়ে Steadfast/Pathao ডেটা চেক
- customer_courier_history টেবিলে সেভ
- combined statistics রিটার্ন

### ২.২ send-order-notification
- নতুন অর্ডারে admin ইমেইল পাঠাবে
- Resend API ব্যবহার করবে
- shop_settings থেকে email পড়বে

---

## ধাপ ৩: কম্পোনেন্ট স্ট্রাকচার

```text
src/pages/admin/Orders.tsx (মূল পেজ)
src/components/admin/orders/
├── OrdersHeader.tsx           -- হেডার + নোটিফিকেশন টগল
├── OrderFilters.tsx           -- সার্চ, তারিখ, স্ট্যাটাস ফিল্টার
├── StatusTabs.tsx             -- স্ট্যাটাস ব্যাজ ট্যাব + কাউন্ট
├── OrderTable.tsx             -- টেবিল ভিউ
├── OrderGrid.tsx              -- গ্রিড ভিউ (কার্ড)
├── OrderRow.tsx               -- একটি অর্ডার সারি
├── TrustBadge.tsx             -- বিশ্বস্ততা ব্যাজ
├── OrderDetailsModal.tsx      -- বিস্তারিত মডাল
├── OrderEditModal.tsx         -- এডিট মডাল
├── OrderItemsEditor.tsx       -- আইটেম এডিটিং
├── OrderTimeline.tsx          -- স্ট্যাটাস ইতিহাস
├── FraudCheckModal.tsx        -- ফ্রড চেক মডাল
├── DeleteConfirmDialog.tsx    -- ডিলিট কনফার্ম
├── BulkActionsBar.tsx         -- বাল্ক একশন বার
└── Pagination.tsx             -- পেজিনেশন

src/hooks/
├── useOrderNotification.ts    -- নোটিফিকেশন হুক
└── useOrderRealtime.ts        -- রিয়েলটাইম হুক
```

---

## ধাপ ৪: মূল ফিচার বাস্তবায়ন

### ৪.১ অর্ডার লিস্ট ও ফিল্টারিং
- টেবিল/গ্রিড ভিউ টগল
- ইউনিফাইড সার্চ (অর্ডার নম্বর, নাম, ফোন)
- তারিখ ফিল্টার: আজ, গতকাল, ৭ দিন, ৩০ দিন, সব
- স্ট্যাটাস ট্যাব (প্রতিটায় কাউন্ট)
- পেজিনেশন (১৫/পেজ)

### ৪.২ Trust/বিশ্বস্ততা সিস্টেম
```text
🟢 সবুজ (>70% success) = "বিশ্বস্ত"
🟡 হলুদ (50-70%)       = "মধ্যম"
🔴 লাল (<50%)          = "ঝুঁকিপূর্ণ"
⚪ ধূসর (নতুন/ডেটা নেই) = "নতুন"
```
- customer_courier_history থেকে ডেটা
- রিফ্রেশ বাটন
- ক্লিক করলে FraudCheckModal

### ৪.৩ FraudCheckModal
- আপনার দেওয়া HTML ডিজাইন অনুযায়ী
- Steadfast ও Pathao আলাদা ডেটা
- Combined statistics
- শেষ চেক তারিখ
- courier-fraud-check Edge Function কল

### ৪.৪ Order Details Modal
- কাস্টমার তথ্য কার্ড + Trust ব্যাজ
- অর্ডার সারসংক্ষেপ
- কুরিয়ার তথ্য + ট্র্যাকিং লিঙ্ক
- অর্ডার আইটেম (এডিটযোগ্য)
- Order Timeline (status history)
- স্ট্যাটাস পরিবর্তন dropdown
- "কুরিয়ারে পাঠান" বাটন

### ৪.৫ Order Items Editor
- পরিমাণ +/- বাটন
- নতুন আইটেম যোগ (products dropdown)
- আইটেম মুছে ফেলা
- সেভে auto total recalculate

### ৪.৬ Order Timeline
- order_status_history থেকে ডেটা
- পুরানো → নতুন স্ট্যাটাস
- তারিখ/সময় বাংলায়

---

## ধাপ ৫: নোটিফিকেশন সিস্টেম

### ৫.১ useOrderNotification Hook
- Bell/BellOff টগল (localStorage)
- Supabase Realtime subscription
- নতুন অর্ডারে:
  - Notification Sound (base64 WAV)
  - Browser Notification
  - Toast notification
- প্রথম লোডে skip

### ৫.২ Email Notification
- send-order-notification Edge Function
- Resend API
- shop_settings থেকে admin_notification_email

---

## ধাপ ৬: Bulk Actions

### ৬.১ Checkbox Selection
- হেডারে "সব সিলেক্ট" checkbox
- প্রতিটি অর্ডারে checkbox

### ৬.২ BulkActionsBar
- সিলেক্টেড অর্ডার কাউন্ট
- Bulk status change dropdown
- Bulk send to courier বাটন

---

## ধাপ ৭: অতিরিক্ত Actions

### ৭.১ Edit Order Modal
- কাস্টমার নাম, ফোন, ঠিকানা
- নোট, মোট টাকা
- সেভ বাটন

### ৭.২ Delete Order
- Confirmation dialog
- order_items ও order একসাথে ডিলিট

### ৭.৩ Print Invoice
- নতুন উইন্ডোতে invoice
- প্রিন্ট-friendly CSS

### ৭.৪ Send to Courier
- Steadfast API কল (Edge Function)
- consignment_id, tracking_code সেভ

---

## ধাপ ৮: UI/UX বিস্তারিত

### ৮.১ বাংলা লোকালাইজেশন
- সব লেবেল বাংলায়
- date-fns bn locale
- Currency: ৳ চিহ্ন

### ৮.২ Responsive Design
- মোবাইল: কার্ড ভিউ
- ডেস্কটপ: টেবিল ভিউ
- স্টিকি একশন বার

### ৮.৩ States
- Loading skeleton
- Empty state
- Error state
- Toast notifications

---

## ফাইল তৈরি/এডিট তালিকা

| ফাইল | একশন |
|------|-------|
| src/pages/admin/Orders.tsx | সম্পূর্ণ রিরাইট |
| src/components/admin/orders/* | নতুন (১৫+ ফাইল) |
| src/hooks/useOrderNotification.ts | নতুন |
| src/hooks/useOrderRealtime.ts | নতুন |
| supabase/functions/courier-fraud-check/ | নতুন |
| supabase/functions/send-order-notification/ | নতুন |
| Database migration | enum + realtime |

---

## টেকনিক্যাল নোট

### Realtime Subscription
```typescript
const channel = supabase
  .channel('orders-realtime')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'orders' },
    handleNewOrder
  )
  .subscribe();
```

### Browser Notification
```typescript
if (Notification.permission === 'granted') {
  new Notification('নতুন অর্ডার!', {
    body: `${order.customer_name} - ৳${order.total}`,
    icon: '/favicon.ico'
  });
}
```

### Trust Badge Logic
```typescript
const getTrustLevel = (successRate: number | null) => {
  if (successRate === null) return 'new';
  if (successRate > 70) return 'trusted';
  if (successRate >= 50) return 'medium';
  return 'risky';
};
```

---

## আনুমানিক সময়

এই পরিকল্পনা বাস্তবায়নে বেশ কিছু ধাপে কাজ করতে হবে। প্রতিটি ফিচার ধাপে ধাপে যোগ করা হবে।
