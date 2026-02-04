

# ShopBilling পেজ সম্পূর্ণ পুনর্গঠন

## বর্তমান সমস্যাসমূহ

| সমস্যা | বিবরণ |
|--------|-------|
| Mock Data | হার্ডকোডেড ইনভয়েস, কোনো real data নেই |
| Context Missing | ইউজার কেন upgrade করবে বোঝা যাচ্ছে না |
| Usage Stats নেই | বর্তমান orders, team members দেখাচ্ছে না |
| Plan Comparison অস্পষ্ট | কোন features unlock হবে স্পষ্ট না |
| Payment Method নেই | কার্ড add/manage অপশন নেই |
| No Action | Upgrade বাটন ক্লিক করলে কিছু হয় না |
| No Translation | সব English, বাংলা নেই |

---

## নতুন পেজ ডিজাইন

### ১. Header Section
```text
+------------------------------------------------------------------+
| 💳 বিলিং ও সাবস্ক্রিপশন                                          |
| আপনার প্ল্যান ও পেমেন্ট ম্যানেজ করুন                              |
+------------------------------------------------------------------+
```

### ২. Usage Overview Card (নতুন)
```text
+------------------------------------------------------------------+
| 📊 আপনার ব্যবহার                              এই মাসে            |
+------------------------------------------------------------------+
|                                                                    |
|  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ |
|  │ 45/100     │  │ 2/2        │  │ 3/10       │  │ 1/1       │ |
|  │ অর্ডার     │  │ টিম মেম্বার │  │ পেজ        │  │ শপ        │ |
|  │ ████░░░░░░ │  │ ██████████ │  │ ███░░░░░░░ │  │ ██████████│ |
|  │ 45%        │  │ 100% ⚠️    │  │ 30%        │  │ 100% ⚠️   │ |
|  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘ |
|                                                                    |
|  ⚠️ আপনি টিম মেম্বার লিমিটে পৌঁছে গেছেন। আপগ্রেড করুন →         |
+------------------------------------------------------------------+
```

### ৩. Current Plan Card (উন্নত)
```text
+------------------------------------------------------------------+
| 👑 বর্তমান প্ল্যান                                                |
+------------------------------------------------------------------+
|                                                                    |
|  ┌──────────────────────────────────────────────────────────────┐ |
|  │ ✨ Free Plan                           🟢 সক্রিয়            │ |
|  │                                                               │ |
|  │ পরবর্তী বিলিং তারিখ: ১৫ ফেব্রুয়ারি ২০২৬                      │ |
|  │ মাসিক খরচ: ৳০                                                │ |
|  │                                                               │ |
|  │ [প্ল্যান পরিবর্তন করুন]  [বিলিং হিস্ট্রি]                     │ |
|  └──────────────────────────────────────────────────────────────┘ |
|                                                                    |
+------------------------------------------------------------------+
```

### ৪. Plan Comparison (উন্নত - Tabbed View)
```text
+------------------------------------------------------------------+
| 📋 প্ল্যান তুলনা                                                  |
+------------------------------------------------------------------+
| [ফ্রি]  [প্রো - সবচেয়ে জনপ্রিয়]  [এন্টারপ্রাইজ]                    |
+------------------------------------------------------------------+
|                                                                    |
|  প্রো প্ল্যান - ৳৯৯৯/মাস                                         |
|                                                                    |
|  ✅ যা পাবেন:                                                    |
|  ├── ৫টি শপ তৈরি করতে পারবেন                                    |
|  ├── আনলিমিটেড অর্ডার প্রসেস                                    |
|  ├── ১০ জন টিম মেম্বার                                          |
|  ├── প্রায়োরিটি সাপোর্ট                                         |
|  ├── অ্যাডভান্সড এনালিটিক্স                                     |
|  └── কাস্টম ব্র্যান্ডিং                                          |
|                                                                    |
|  🔓 আপগ্রেড করলে যা unlock হবে:                                   |
|  ├── +৩টি অতিরিক্ত শপ                                           |
|  ├── অর্ডার লিমিট সরবে                                          |
|  └── +৮ জন টিম মেম্বার                                          |
|                                                                    |
|  [এখনই আপগ্রেড করুন - ৳৯৯৯/মাস]                                  |
|                                                                    |
+------------------------------------------------------------------+
```

### ৫. Payment Method Card (নতুন)
```text
+------------------------------------------------------------------+
| 💳 পেমেন্ট মেথড                                                   |
+------------------------------------------------------------------+
|                                                                    |
|  ┌────────────────────────────────┐                               |
|  │ 💳 •••• •••• •••• 4242        │  [ডিফল্ট]                     |
|  │    Visa  |  মেয়াদ: 12/26      │                               |
|  │    [এডিট]  [মুছুন]             │                               |
|  └────────────────────────────────┘                               |
|                                                                    |
|  [+ নতুন কার্ড যোগ করুন]                                         |
|                                                                    |
+------------------------------------------------------------------+
```

### ৬. Billing History (উন্নত)
```text
+------------------------------------------------------------------+
| 📜 বিলিং হিস্ট্রি                                                 |
+------------------------------------------------------------------+
| তারিখ         | ইনভয়েস ID      | পরিমাণ  | স্ট্যাটাস | ইনভয়েস    |
|---------------|----------------|---------|-----------|-----------|
| ১৫ জানু ২০২৬ | INV-2026-001   | ৳৯৯৯   | ✅ পরিশোধিত | [⬇️ PDF] |
| ১৫ ডিসে ২০২৫ | INV-2025-012   | ৳৯৯৯   | ✅ পরিশোধিত | [⬇️ PDF] |
| ১৫ নভে ২০২৫  | INV-2025-011   | ৳৯৯৯   | ✅ পরিশোধিত | [⬇️ PDF] |
+------------------------------------------------------------------+
| [সব ইনভয়েস দেখুন]                                                |
+------------------------------------------------------------------+
```

---

## বাংলা Translation যোগ করা

```typescript
// src/locales/bn.ts এ যোগ করা হবে:
billing: {
  title: 'বিলিং ও সাবস্ক্রিপশন',
  subtitle: 'আপনার প্ল্যান ও পেমেন্ট ম্যানেজ করুন',
  
  // Usage
  usage: 'আপনার ব্যবহার',
  thisMonth: 'এই মাসে',
  orders: 'অর্ডার',
  teamMembers: 'টিম মেম্বার',
  pages: 'পেজ',
  shops: 'শপ',
  limitReached: 'লিমিটে পৌঁছে গেছেন',
  upgradeNow: 'আপগ্রেড করুন',
  
  // Current Plan
  currentPlan: 'বর্তমান প্ল্যান',
  active: 'সক্রিয়',
  nextBilling: 'পরবর্তী বিলিং তারিখ',
  monthlyCost: 'মাসিক খরচ',
  changePlan: 'প্ল্যান পরিবর্তন করুন',
  
  // Plans
  planComparison: 'প্ল্যান তুলনা',
  free: 'ফ্রি',
  pro: 'প্রো',
  enterprise: 'এন্টারপ্রাইজ',
  mostPopular: 'সবচেয়ে জনপ্রিয়',
  contactSales: 'সেলস টিমে যোগাযোগ করুন',
  perMonth: '/মাস',
  whatYouGet: 'যা পাবেন',
  whatUnlocks: 'আপগ্রেড করলে যা unlock হবে',
  upgradeNowBtn: 'এখনই আপগ্রেড করুন',
  currentPlanBtn: 'বর্তমান প্ল্যান',
  
  // Features
  features: {
    shops: 'শপ',
    ordersPerMonth: 'অর্ডার/মাস',
    teamMembers: 'টিম মেম্বার',
    basicSupport: 'বেসিক সাপোর্ট',
    prioritySupport: 'প্রায়োরিটি সাপোর্ট',
    analytics: 'এনালিটিক্স ড্যাশবোর্ড',
    customBranding: 'কাস্টম ব্র্যান্ডিং',
    customSLA: 'কাস্টম SLA',
    dedicatedManager: 'ডেডিকেটেড অ্যাকাউন্ট ম্যানেজার',
    unlimited: 'আনলিমিটেড',
  },
  
  // Payment
  paymentMethod: 'পেমেন্ট মেথড',
  addCard: 'নতুন কার্ড যোগ করুন',
  defaultCard: 'ডিফল্ট',
  expires: 'মেয়াদ',
  
  // History
  billingHistory: 'বিলিং হিস্ট্রি',
  invoiceId: 'ইনভয়েস ID',
  amount: 'পরিমাণ',
  status: 'স্ট্যাটাস',
  paid: 'পরিশোধিত',
  pending: 'পেন্ডিং',
  failed: 'ব্যর্থ',
  downloadPdf: 'PDF ডাউনলোড',
  viewAllInvoices: 'সব ইনভয়েস দেখুন',
  
  // Empty states
  noPaymentMethod: 'কোনো পেমেন্ট মেথড নেই',
  noInvoices: 'কোনো ইনভয়েস নেই',
}
```

---

## নতুন Components তৈরি

### ফাইল স্ট্রাকচার:
```text
src/components/admin/billing/
├── UsageOverview.tsx       # ব্যবহার পরিসংখ্যান
├── CurrentPlanCard.tsx     # বর্তমান প্ল্যান
├── PlanComparison.tsx      # প্ল্যান তুলনা (Tabs)
├── PaymentMethodCard.tsx   # পেমেন্ট মেথড
├── BillingHistory.tsx      # ইনভয়েস টেবিল
├── UpgradePrompt.tsx       # আপগ্রেড প্রম্পট
└── index.ts                # এক্সপোর্ট
```

---

## Database থেকে Real Data Fetch

### Usage Stats Query:
```typescript
// Orders this month
const ordersThisMonth = await supabase
  .from('orders')
  .select('id', { count: 'exact' })
  .eq('shop_id', currentShop.id)
  .gte('created_at', startOfMonth);

// Team members count
const teamCount = await supabase
  .from('shop_members')
  .select('id', { count: 'exact' })
  .eq('shop_id', currentShop.id);

// Landing pages count
const pagesCount = await supabase
  .from('landing_pages')
  .select('id', { count: 'exact' })
  .eq('shop_id', currentShop.id);
```

---

## Plan Limits Configuration

```typescript
const PLAN_LIMITS = {
  free: {
    shops: 1,
    ordersPerMonth: 100,
    teamMembers: 2,
    landingPages: 10,
    products: 50,
  },
  pro: {
    shops: 5,
    ordersPerMonth: Infinity,
    teamMembers: 10,
    landingPages: 100,
    products: 500,
  },
  enterprise: {
    shops: Infinity,
    ordersPerMonth: Infinity,
    teamMembers: Infinity,
    landingPages: Infinity,
    products: Infinity,
  },
};
```

---

## Implementation Steps

### Step 1: বাংলা Translation যোগ
- `bn.ts` এ billing section যোগ
- `en.ts` এ billing section যোগ

### Step 2: Usage Overview Component
- Real data fetch hooks
- Progress bars with limits
- Warning badges when limit reached

### Step 3: Plan Comparison উন্নত করা
- Tabbed interface
- "What you'll unlock" section
- Clear feature comparison

### Step 4: ShopBilling.tsx পুনর্গঠন
- নতুন components import
- Clean layout
- Responsive design

### Step 5: (Future) Payment Integration
- Stripe/SSLCommerz placeholder
- Payment method management UI

---

## Technical Details

### New Hook: useBillingUsage
```typescript
// src/hooks/useBillingUsage.ts
export function useBillingUsage() {
  const { currentShop } = useShop();
  
  const { data: usage } = useQuery({
    queryKey: ['billing-usage', currentShop?.id],
    queryFn: async () => {
      // Fetch orders, team, pages count
      return { orders, team, pages, shops };
    }
  });
  
  const limits = PLAN_LIMITS[currentShop?.plan || 'free'];
  
  return { usage, limits, isNearLimit, isAtLimit };
}
```

### Files to Create/Update:
```text
CREATE:
├── src/components/admin/billing/UsageOverview.tsx
├── src/components/admin/billing/CurrentPlanCard.tsx
├── src/components/admin/billing/PlanComparison.tsx
├── src/components/admin/billing/index.ts
├── src/hooks/useBillingUsage.ts

UPDATE:
├── src/locales/bn.ts (billing translations)
├── src/locales/en.ts (billing translations)
├── src/pages/admin/ShopBilling.tsx (complete rewrite)
```
