

# সাইডবারে Shop মেনু এন্টারপ্রাইজ ফিচার সহ

## লক্ষ্য
সাইডবারে একটি "Shop" ড্রপডাউন মেনু যোগ করা যেখানে এন্টারপ্রাইজ-গ্রেড শপ ম্যানেজমেন্ট ফিচার থাকবে।

## প্রস্তাবিত Shop মেনু স্ট্রাকচার

```text
Shop ▼
├── 🏪 Manage           - শপ সেটিংস ম্যানেজ করুন
├── 👥 Team             - টিম মেম্বার ম্যানেজ করুন
├── 💳 Billing          - বিলিং ও সাবস্ক্রিপশন
├── 🔐 Security         - সিকিউরিটি সেটিংস
├── 📊 Analytics        - শপ এনালিটিক্স
└── 📋 Audit Log        - অ্যাক্টিভিটি হিস্ট্রি
```

## এন্টারপ্রাইজ ফিচার লিস্ট

| ফিচার | বিবরণ | প্রায়োরিটি |
|-------|-------|-----------|
| **Manage** | শপের নাম, লোগো, কনট্যাক্ট ইনফো, টাইমজোন | High |
| **Team** | মেম্বার ইনভাইট, রোল ম্যানেজমেন্ট (Owner, Admin, Editor, Viewer) | High |
| **Billing** | প্ল্যান (Free/Pro/Enterprise), পেমেন্ট হিস্ট্রি, ইনভয়েস | Medium |
| **Security** | 2FA, API Keys, Session Management, IP Whitelist | Medium |
| **Analytics** | শপ পারফরম্যান্স, ট্রাফিক, কনভার্সন রেট | Medium |
| **Audit Log** | সব অ্যাক্টিভিটি ট্র্যাকিং (কে, কখন, কী করেছে) | Low |

## সাইডবার পরিবর্তন

### বর্তমান navGroups স্ট্রাকচারে নতুন গ্রুপ যোগ

```typescript
// Overview group এর পরে, Content এর আগে
{
  labelKey: 'sidebar.shop',
  items: [
    { 
      href: '/admin/shop', 
      labelKey: 'sidebar.myShop', 
      icon: Store,
      children: [
        { href: '/admin/shop/manage', labelKey: 'sidebar.shopManage', icon: Settings },
        { href: '/admin/shop/team', labelKey: 'sidebar.shopTeam', icon: Users },
        { href: '/admin/shop/billing', labelKey: 'sidebar.shopBilling', icon: CreditCard },
        { href: '/admin/shop/security', labelKey: 'sidebar.shopSecurity', icon: Shield },
        { href: '/admin/shop/analytics', labelKey: 'sidebar.shopAnalytics', icon: BarChart3 },
        { href: '/admin/shop/audit-log', labelKey: 'sidebar.shopAuditLog', icon: ClipboardList },
      ]
    },
  ],
}
```

## নতুন পেজ তৈরি

| পেজ | Route | ফিচার |
|-----|-------|-------|
| ShopManage | `/admin/shop/manage` | শপ নাম, লোগো, স্লাগ, কন্ট্যাক্ট, টাইমজোন, কারেন্সি |
| ShopBilling | `/admin/shop/billing` | প্ল্যান আপগ্রেড/ডাউনগ্রেড, পেমেন্ট মেথড, ইনভয়েস |
| ShopSecurity | `/admin/shop/security` | 2FA সেটআপ, API Keys ম্যানেজ, সেশন দেখা |
| ShopAnalytics | `/admin/shop/analytics` | ট্রাফিক, কনভার্সন, রেভিনিউ চার্ট |
| ShopAuditLog | `/admin/shop/audit-log` | সব অ্যাক্টিভিটি টেবিল (ফিল্টারেবল) |

## প্রতিটি পেজের বিস্তারিত

### 1. Shop Manage পেজ
```text
┌────────────────────────────────────────────────────────────┐
│ 🏪 শপ সেটিংস                                               │
├────────────────────────────────────────────────────────────┤
│ ┌──────────────────┐  ┌──────────────────────────────────┐ │
│ │ Logo Upload      │  │ Shop Name: [chaldal           ] │ │
│ │ [🖼️ Click to    ] │  │ Slug: [chaldal               ] │ │
│ │ [ upload        ] │  │ Email: [info@chaldal.com     ] │ │
│ └──────────────────┘  │ Phone: [+880 1700-000000     ] │ │
│                       │ Address: [Dhaka, Bangladesh  ] │ │
│                       │ Timezone: [Asia/Dhaka ▼]       │ │
│                       │ Currency: [BDT ▼]              │ │
│                       └──────────────────────────────────┘ │
│                                                            │
│ Danger Zone                                                │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ ⚠️ শপ ডিলিট করুন - এটা undo করা যাবে না              │ │
│ │ [Delete Shop]                                          │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### 2. Billing পেজ
```text
┌────────────────────────────────────────────────────────────┐
│ 💳 বিলিং ও সাবস্ক্রিপশন                                    │
├────────────────────────────────────────────────────────────┤
│ Current Plan: [PRO] - ৳999/মাস                             │
│ Renews on: 15 Feb 2026                                     │
│                                                            │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│ │ FREE         │ │ PRO ✓       │ │ ENTERPRISE           │ │
│ │ ৳0/মাস      │ │ ৳999/মাস    │ │ Contact Sales        │ │
│ │              │ │              │ │                      │ │
│ │ • 1 Shop     │ │ • 5 Shops   │ │ • Unlimited Shops    │ │
│ │ • 100 Orders │ │ • Unlimited │ │ • Priority Support   │ │
│ │ • 2 Team     │ │ • 10 Team   │ │ • Custom SLA         │ │
│ └──────────────┘ └──────────────┘ └──────────────────────┘ │
│                                                            │
│ Payment History                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Date       │ Amount │ Status  │ Invoice                │ │
│ │ 15 Jan 26  │ ৳999   │ Paid    │ [Download PDF]        │ │
│ │ 15 Dec 25  │ ৳999   │ Paid    │ [Download PDF]        │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### 3. Security পেজ
```text
┌────────────────────────────────────────────────────────────┐
│ 🔐 সিকিউরিটি সেটিংস                                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Two-Factor Authentication                                  │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 🔒 2FA Enabled                    [Disable]            │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ API Keys                                                   │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Name          │ Created     │ Last Used │ Actions      │ │
│ │ Production    │ 10 Jan 26   │ Today     │ [Revoke]    │ │
│ │ Development   │ 5 Jan 26    │ Never     │ [Revoke]    │ │
│ │ [+ Create New API Key]                                 │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ Active Sessions                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 🖥️ Chrome on Windows - Dhaka (Current)                │ │
│ │ 📱 Mobile App - Dhaka - 2 hours ago      [Logout]     │ │
│ │ [Logout All Other Sessions]                            │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### 4. Analytics পেজ
```text
┌────────────────────────────────────────────────────────────┐
│ 📊 শপ এনালিটিক্স                                           │
├────────────────────────────────────────────────────────────┤
│ [Last 7 Days ▼] [Last 30 Days] [Custom Range]             │
│                                                            │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│ │ 12,450  │ │ 856     │ │ 3.2%    │ │ ৳45,000 │           │
│ │ Visitors│ │ Orders  │ │ Conv.   │ │ Revenue │           │
│ │ +12%    │ │ +8%     │ │ +0.5%   │ │ +15%    │           │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                            │
│ [═══════════════════════════════════════════════════════]  │
│  Traffic & Orders Chart                                    │
│                                                            │
│ Top Landing Pages           │ Top Products                │
│ /p/product-1    45%         │ Product A - 120 sold       │
│ /p/offer-2      30%         │ Product B - 85 sold        │
│ /p/bundle-3     25%         │ Product C - 62 sold        │
└────────────────────────────────────────────────────────────┘
```

### 5. Audit Log পেজ
```text
┌────────────────────────────────────────────────────────────┐
│ 📋 অ্যাক্টিভিটি লগ                                         │
├────────────────────────────────────────────────────────────┤
│ Filter: [All Actions ▼] [All Users ▼] [Date Range]        │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 🟢 admin@shop.com                                       │ │
│ │    Updated product "Product A" price                   │ │
│ │    📍 Dhaka, Bangladesh • 5 mins ago                   │ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ 🟢 editor@shop.com                                      │ │
│ │    Created new landing page "Winter Sale"              │ │
│ │    📍 Chittagong • 2 hours ago                         │ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ 🔴 unknown@email.com                                    │ │
│ │    Failed login attempt                                │ │
│ │    📍 Unknown location • 3 hours ago                   │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ [Load More]                                                │
└────────────────────────────────────────────────────────────┘
```

## Locale Updates

```typescript
// bn.ts এবং en.ts এ যোগ করতে হবে
sidebar: {
  // ... existing
  shop: 'শপ',
  myShop: 'আমার শপ',
  shopManage: 'ম্যানেজ',
  shopTeam: 'টিম',
  shopBilling: 'বিলিং',
  shopSecurity: 'সিকিউরিটি',
  shopAnalytics: 'এনালিটিক্স',
  shopAuditLog: 'অডিট লগ',
}
```

## Database Tables প্রয়োজন

| টেবিল | কলাম | উদ্দেশ্য |
|-------|------|---------|
| `shop_audit_logs` | id, shop_id, user_id, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent, created_at | সব অ্যাক্টিভিটি ট্র্যাক |
| `shop_api_keys` | id, shop_id, name, key_hash, last_used_at, created_by, revoked_at | API Key ম্যানেজমেন্ট |
| `shop_sessions` | id, user_id, shop_id, ip_address, user_agent, created_at, last_active_at | অ্যাক্টিভ সেশন ট্র্যাক |
| `shop_billing` | id, shop_id, plan, stripe_customer_id, current_period_end | বিলিং ইনফো |
| `shop_invoices` | id, shop_id, amount, status, invoice_url, created_at | পেমেন্ট হিস্ট্রি |

## Implementation Steps

### Phase 1: UI Structure
1. `AdminSidebar.tsx` এ Shop গ্রুপ যোগ
2. Locale files আপডেট
3. Routes যোগ `App.tsx` এ

### Phase 2: Pages তৈরি
1. `ShopManage.tsx` - বেসিক সেটিংস
2. Team পেজ আগেই আছে (refactor route to `/admin/shop/team`)
3. অন্য পেজগুলো placeholder হিসেবে

### Phase 3: Database & Backend
1. নতুন টেবিল তৈরি
2. RLS policies
3. Edge functions for billing integration

## ফাইল পরিবর্তন

| ফাইল | পরিবর্তন |
|------|---------|
| `src/components/admin/AdminSidebar.tsx` | Shop গ্রুপ যোগ, icons import |
| `src/locales/bn.ts` | Shop translations |
| `src/locales/en.ts` | Shop translations |
| `src/App.tsx` | নতুন routes |
| `src/pages/admin/ShopManage.tsx` | নতুন পেজ |
| `src/pages/admin/ShopBilling.tsx` | নতুন পেজ |
| `src/pages/admin/ShopSecurity.tsx` | নতুন পেজ |
| `src/pages/admin/ShopAnalytics.tsx` | নতুন পেজ |
| `src/pages/admin/ShopAuditLog.tsx` | নতুন পেজ |

## Summary

এন্টারপ্রাইজ-গ্রেড শপ ম্যানেজমেন্ট সিস্টেম যোগ করা হবে সাইডবারে "Shop" ড্রপডাউন মেনু দিয়ে, যেখানে থাকবে:
- **Manage**: শপ সেটিংস
- **Team**: টিম ম্যানেজমেন্ট
- **Billing**: সাবস্ক্রিপশন ও পেমেন্ট
- **Security**: 2FA, API Keys, Sessions
- **Analytics**: পারফরম্যান্স মেট্রিক্স
- **Audit Log**: সব অ্যাক্টিভিটি ট্র্যাকিং

