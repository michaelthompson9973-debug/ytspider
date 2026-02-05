

# সাইডবার পুনর্গঠন: Platform vs Shop Level

## সমস্যা চিহ্নিত

আপনি সঠিক বলেছেন। বর্তমান স্ট্রাকচার:

```text
Business (sidebar.business)
├── Business Management
│   ├── সব শপ
│   ├── টিম
│   ├── বিলিং ← ❌ এখানে Shop-level billing আছে
│   ├── সিকিউরিটি
│   ├── এনালিটিক্স
│   └── অডিট লগ
└── Pricing Plans ← ❌ এটা Platform-only হওয়া উচিত
```

## সঠিক স্ট্রাকচার

```text
┌─────────────────────────────────────────────────────────────────┐
│  PLATFORM MODE (Super Admin - কোনো শপ সিলেক্ট নেই)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Overview                                                        │
│  └── Dashboard (Platform Overview)                               │
│                                                                  │
│  Business                                                        │
│  ├── Business Management                                         │
│  │   ├── সব শপ                                                   │
│  │   ├── টিম (Platform Team)                                    │
│  │   ├── সিকিউরিটি                                               │
│  │   ├── এনালিটিক্স                                              │
│  │   └── অডিট লগ                                                 │
│  └── 💰 প্রাইসিং প্ল্যান ← Platform-only                         │
│                                                                  │
│  Settings                                                        │
│  └── ...                                                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  SHOP MODE (শপ সিলেক্ট করা আছে)                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Overview                                                        │
│  └── Dashboard (Shop Dashboard)                                  │
│                                                                  │
│  Business                                                        │
│  └── Business Management                                         │
│      ├── সব শপ                                                   │
│      ├── টিম                                                     │
│      ├── 🔔 সাবস্ক্রিপশন ← Shop-level (আগে "বিলিং" ছিল)          │
│      ├── সিকিউরিটি                                               │
│      ├── এনালিটিক্স                                              │
│      └── অডিট লগ                                                 │
│                                                                  │
│  Content (Products, Pages, Media)                                │
│  Operations (Orders, Tracking, Inbox)                            │
│  Settings                                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## পরিবর্তন সারাংশ

| আইটেম | বর্তমান | নতুন |
|-------|---------|------|
| `/admin/platform/pricing` | Business group এ | Platform Mode only দেখাবে |
| `/admin/business/billing` | "বিলিং" নাম | "সাবস্ক্রিপশন" নাম হবে |
| ShopBilling পেজ | Plan তৈরির UI | শুধু এই শপের সাবস্ক্রিপশন স্ট্যাটাস |

---

## ফাইল পরিবর্তন

### 1. AdminSidebar.tsx
**পরিবর্তন:** `sidebar.pricingPlans` কে Business Management children থেকে আলাদা করে Platform-only আইটেম করা

```typescript
// navGroups structure পরিবর্তন

// Platform Mode এ দেখাবে:
{
  labelKey: 'sidebar.business',
  items: [
    { 
      href: '/admin/business', 
      labelKey: 'sidebar.businessManagement', 
      icon: Building2,
      children: [
        { href: '/admin/business/shops', ... },
        { href: '/admin/business/team', ... },
        { href: '/admin/business/security', ... },
        { href: '/admin/business/analytics', ... },
        { href: '/admin/business/audit-log', ... },
        // ❌ billing সরানো হয়েছে
      ]
    },
    // ✅ Pricing Plans শুধু Platform Mode এ
    { href: '/admin/platform/pricing', labelKey: 'sidebar.pricingPlans', icon: DollarSign },
  ],
}

// Shop Mode এ দেখাবে:
{
  labelKey: 'sidebar.business',
  items: [
    { 
      href: '/admin/business', 
      labelKey: 'sidebar.businessManagement', 
      icon: Building2,
      children: [
        { href: '/admin/business/shops', ... },
        { href: '/admin/business/team', ... },
        { href: '/admin/business/subscription', labelKey: 'sidebar.shopSubscription', icon: CreditCard },
        { href: '/admin/business/security', ... },
        { href: '/admin/business/analytics', ... },
        { href: '/admin/business/audit-log', ... },
      ]
    },
    // ❌ Pricing Plans দেখাবে না Shop Mode এ
  ],
}
```

### 2. Locales (bn.ts, en.ts)
**পরিবর্তন:** নতুন key যোগ

```typescript
sidebar: {
  // ... existing
  shopBilling: 'বিলিং', // ← মুছে দিন বা রাখুন
  shopSubscription: 'সাবস্ক্রিপশন', // ← নতুন
  pricingPlans: 'প্রাইসিং প্ল্যান', // ← বাংলায়
}
```

### 3. Route পরিবর্তন (App.tsx)
```typescript
// আগে
<Route path="/admin/business/billing" element={<ShopBilling />} />

// এখন
<Route path="/admin/business/subscription" element={<ShopSubscription />} />
```

### 4. ShopBilling.tsx → ShopSubscription.tsx (Rename)
**পরিবর্তন:** 
- ফাইল rename
- Header text পরিবর্তন: "বিলিং" → "সাবস্ক্রিপশন"
- শুধু এই শপের subscription status দেখাবে
- Plan তৈরি/compare সরানো (এটা Platform এ থাকবে)

---

## নতুন UI: ShopSubscription

```text
+------------------------------------------------------------------+
| 🔔 সাবস্ক্রিপশন                                                   |
| আপনার শপের সাবস্ক্রিপশন ম্যানেজ করুন                              |
+------------------------------------------------------------------+
|                                                                    |
|  ┌──────────────────────────────────────────────────────────────┐ |
|  │ বর্তমান প্ল্যান                                                │ |
|  │                                                               │ |
|  │ 📦 প্রো প্ল্যান                                🟢 সক্রিয়      │ |
|  │                                                               │ |
|  │ শুরু: ৪ ফেব্রুয়ারি ২০২৬                                      │ |
|  │ মেয়াদ শেষ: ৪ মার্চ ২০২৬                                      │ |
|  │                                                               │ |
|  │ [রিনিউ করুন]  [আপগ্রেড করুন]                                  │ |
|  └──────────────────────────────────────────────────────────────┘ |
|                                                                    |
|  📊 আপনার ব্যবহার                                                 |
|  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐     |
|  │ 45/500     │ │ 3/5        │ │ 12/100     │ │ 50/500     │     |
|  │ অর্ডার     │ │ টিম মেম্বার │ │ পেজ        │ │ প্রোডাক্ট   │     |
|  │ ████░░░░░░ │ │ ██████░░░░ │ │ █░░░░░░░░░ │ │ █░░░░░░░░░ │     |
|  └────────────┘ └────────────┘ └────────────┘ └────────────┘     |
|                                                                    |
|  📜 পেমেন্ট হিস্ট্রি                                               |
|  ┌──────────────────────────────────────────────────────────────┐ |
|  │ তারিখ         | প্ল্যান    | পরিমাণ   | স্ট্যাটাস            │ |
|  │ ৪ ফেব্রুয়ারি  | প্রো      | ৳৯৯৯    | ✅ পরিশোধিত          │ |
|  │ ৪ জানুয়ারি   | প্রো      | ৳৯৯৯    | ✅ পরিশোধিত          │ |
|  └──────────────────────────────────────────────────────────────┘ |
+------------------------------------------------------------------+
```

---

## Implementation Steps

### Step 1: AdminSidebar.tsx আপডেট
- `navGroups` কে dynamic করা - Platform Mode vs Shop Mode অনুযায়ী
- Pricing Plans শুধু Platform Mode এ দেখানো
- Subscription শুধু Shop Mode এ দেখানো

### Step 2: Locales আপডেট
- `sidebar.shopSubscription: 'সাবস্ক্রিপশন'` যোগ
- `sidebar.pricingPlans: 'প্রাইসিং প্ল্যান'` (translation fix)

### Step 3: Route পরিবর্তন
- `/admin/business/billing` → `/admin/business/subscription`

### Step 4: ShopBilling → ShopSubscription
- Component rename
- UI simplify (Plan comparison সরানো)
- শুধু এই শপের subscription info দেখানো

---

## Technical Details

### Dynamic navGroups based on Mode

```typescript
// AdminSidebar.tsx
const { currentShop } = useShop();
const isPlatformMode = !currentShop;

const businessChildren = useMemo(() => {
  const base = [
    { href: '/admin/business/shops', labelKey: 'sidebar.allShops', icon: Store },
    { href: '/admin/business/team', labelKey: 'sidebar.shopTeam', icon: Users },
  ];
  
  if (!isPlatformMode) {
    // Shop Mode - add Subscription
    base.push({ 
      href: '/admin/business/subscription', 
      labelKey: 'sidebar.shopSubscription', 
      icon: CreditCard 
    });
  }
  
  base.push(
    { href: '/admin/business/security', labelKey: 'sidebar.shopSecurity', icon: Shield },
    { href: '/admin/business/analytics', labelKey: 'sidebar.shopAnalytics', icon: BarChart3 },
    { href: '/admin/business/audit-log', labelKey: 'sidebar.shopAuditLog', icon: ClipboardList },
  );
  
  return base;
}, [isPlatformMode]);

const businessItems = useMemo(() => {
  const items = [
    { 
      href: '/admin/business', 
      labelKey: 'sidebar.businessManagement', 
      icon: Building2,
      children: businessChildren
    }
  ];
  
  if (isPlatformMode) {
    // Platform Mode - add Pricing Plans
    items.push({ 
      href: '/admin/platform/pricing', 
      labelKey: 'sidebar.pricingPlans', 
      icon: DollarSign 
    });
  }
  
  return items;
}, [isPlatformMode, businessChildren]);
```

---

## Files to Update

| ফাইল | পরিবর্তন |
|------|---------|
| `src/components/admin/AdminSidebar.tsx` | Dynamic navGroups |
| `src/locales/bn.ts` | `shopSubscription` key যোগ, `pricingPlans` translation |
| `src/locales/en.ts` | `shopSubscription` key যোগ |
| `src/App.tsx` | Route path পরিবর্তন |
| `src/pages/admin/ShopBilling.tsx` | Rename to ShopSubscription, UI simplify |

