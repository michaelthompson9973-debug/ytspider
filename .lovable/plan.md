

# 🛠️ Validation ও Mock Data Fix Plan

## সারসংক্ষেপ

কোডবেস টেস্টিং-এ দুটি প্রধান সমস্যা চিহ্নিত হয়েছে:
1. শপ তৈরির সময় proper validation নেই
2. বেশ কিছু পেজে static/mock data আছে যা dynamic হওয়া উচিত

---

## Phase 1: Validation Enhancement

### 1.1 CreateShopDialog.tsx - Zod Validation যোগ
```text
পরিবর্তন:
├── Zod schema তৈরি: shopName (3-50 chars), slug (3-30 chars, alphanumeric+hyphen)
├── React-Hook-Form integration
├── Real-time slug validation (uniqueness check)
└── Error messages Bangla-তে
```

### 1.2 CreateShopForUserDialog.tsx - Enhanced Validation
```text
পরিবর্তন:
├── Email Zod validation
├── Plan selection required check
├── Duration validation
└── Shop name/slug validation (same as above)
```

### 1.3 ShopOnboarding.tsx - Step Validation
```text
পরিবর্তন:
├── Step 1: Shop name length check (min 3 chars)
├── Step 2: Shop type required (already working)
├── Step 3: Optional category (no change needed)
└── Final submit: All fields validation
```

---

## Phase 2: Mock Data → Dynamic Data

### 2.1 ShopAnalytics.tsx (Priority: HIGH)
```text
বর্তমান:
├── mockChartData (hardcoded 7 days)
├── mockTopPages (hardcoded 4 pages)
├── mockTopProducts (hardcoded 4 products)
├── KPI stats (hardcoded values)

Dynamic করতে হবে:
├── Orders table থেকে daily revenue/orders chart
├── Landing pages + orders join করে top pages by conversions
├── Products + order_items join করে top products
├── Real KPI calculations from orders/products tables
```

### 2.2 BillingHistory.tsx (Priority: MEDIUM)
```text
বর্তমান:
├── mockInvoices (3 hardcoded invoices)

Dynamic করতে হবে:
├── subscriptions table থেকে payment history
├── purchases table থেকে completed transactions
├── PDF generation endpoint (future)
```

### 2.3 CurrentPlanCard.tsx (Priority: MEDIUM)
```text
বর্তমান:
├── nextBillingDate (mock date calculation)

Dynamic করতে হবে:
├── shops.expires_at থেকে real expiry date
├── subscriptions.expires_at থেকে next billing
├── Current plan from shop.plan (already working)
```

### 2.4 ShopSecurity.tsx (Priority: HIGH)
```text
বর্তমান:
├── mockApiKeys (2 hardcoded keys)
├── mockSessions (3 hardcoded sessions)

Dynamic করতে হবে:
├── api_keys table থেকে shop-specific API keys
├── Supabase auth.sessions বা custom sessions table
├── Real 2FA status from user profile
```

### 2.5 PaymentMethodCard.tsx (Priority: LOW)
```text
বর্তমান:
├── mockPaymentMethods: [] (empty array)

Dynamic করতে হবে:
├── payment_gateways table থেকে configured gateways
├── Stripe Customer payment methods (if integrated)
└── Note: This depends on payment gateway integration phase
```

---

## নতুন ফাইল/হুক তৈরি করতে হবে

### Hooks:
```text
src/hooks/
├── useShopAnalytics.ts - Analytics data fetching
├── useInvoiceHistory.ts - Billing/invoice data
├── useShopApiKeys.ts - API keys CRUD
└── useShopSessions.ts - Active sessions management
```

### Database Changes:
```text
প্রয়োজনীয় টেবিল যা ইতিমধ্যে আছে:
├── api_keys ✅
├── orders ✅
├── products ✅
├── landing_pages ✅
├── subscriptions ✅
├── purchases ✅

নতুন টেবিল দরকার:
├── user_sessions (optional - for active sessions tracking)
└── invoices (optional - for detailed invoice management)
```

---

## Implementation Priority

| Priority | Task | Files | Effort |
|----------|------|-------|--------|
| 🔴 High | ShopAnalytics dynamic data | `ShopAnalytics.tsx`, `useShopAnalytics.ts` | 3-4 hrs |
| 🔴 High | ShopSecurity dynamic data | `ShopSecurity.tsx`, `useShopApiKeys.ts` | 2-3 hrs |
| 🟡 Medium | Validation all forms | 3 dialog files | 2-3 hrs |
| 🟡 Medium | BillingHistory dynamic | `BillingHistory.tsx`, `useInvoiceHistory.ts` | 2 hrs |
| 🟡 Medium | CurrentPlanCard fix | `CurrentPlanCard.tsx` | 1 hr |
| 🟢 Low | PaymentMethodCard | Depends on Stripe integration | Future |

---

## টেকনিক্যাল নোট

### Validation Schema Example (Zod):
```typescript
const shopSchema = z.object({
  name: z.string()
    .min(3, 'নাম কমপক্ষে ৩ অক্ষর হতে হবে')
    .max(50, 'নাম সর্বোচ্চ ৫০ অক্ষর হতে পারে'),
  slug: z.string()
    .min(3, 'Slug কমপক্ষে ৩ অক্ষর হতে হবে')
    .max(30, 'Slug সর্বোচ্চ ৩০ অক্ষর হতে পারে')
    .regex(/^[a-z0-9-]+$/, 'শুধু ছোট হাতের অক্ষর, সংখ্যা ও হাইফেন'),
  email: z.string()
    .email('সঠিক ইমেইল দিন')
    .optional(),
});
```

### Analytics Query Pattern:
```typescript
// Top products by sales
const { data } = await supabase
  .from('order_items')
  .select('product_id, quantity, subtotal, products(name, images)')
  .eq('shop_id', currentShop.id)
  .order('quantity', { ascending: false })
  .limit(5);
```

---

## প্রত্যাশিত ফলাফল

সব পরিবর্তন শেষে:
- ✅ সব ফর্মে proper validation সহ user-friendly error messages
- ✅ ShopAnalytics real data দেখাবে
- ✅ Billing page real subscription/invoice data দেখাবে
- ✅ Security page real API keys ও sessions দেখাবে
- ✅ কোন mock/hardcoded data থাকবে না

