

# Top Bar ও Sidebar রিডিজাইন - Shop Switcher ও Business মেনু

## লক্ষ্য

1. **Top Bar** - Shop Switcher কে সেন্টারে নিয়ে যাওয়া, দুটি আলাদা কম্পোনেন্ট হিসেবে:
   - `[+ Add New Shop]` বাটন
   - `[Switch Shop ▼]` ড্রপডাউন

2. **Sidebar** - "আমার শপ" → "Business" নাম পরিবর্তন করা (Super Admin এর জন্য)
   - "Manage" ক্লিক করলে সব শপের লিস্ট দেখাবে (Super Admin দৃষ্টিকোণ থেকে)

## নতুন Top Bar Layout

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ [≡]  Ytspider          │ [+ Add Shop] [chaldal ▼] │            🔔  👤   │
│ (mobile trigger)       │      CENTER              │            RIGHT     │
└──────────────────────────────────────────────────────────────────────────┘
```

## পরিবর্তনসমূহ

### 1. AdminLayout.tsx - Header রিস্ট্রাকচার

**আগে:**
```tsx
<header className="... justify-between ...">
  <div className="flex items-center gap-3">
    <SidebarTrigger />
    <span>Ytspider</span>
    <ShopSwitcher /> {/* বামে */}
  </div>
  <div className="flex items-center gap-2">
    <NotificationPanel />
  </div>
</header>
```

**পরে:**
```tsx
<header className="... justify-between ...">
  {/* Left */}
  <div className="flex items-center gap-3">
    <SidebarTrigger className="-ml-1 md:hidden" />
    <span className="font-bold text-lg md:hidden">Ytspider</span>
  </div>
  
  {/* Center - Shop Controls */}
  <div className="flex items-center gap-2">
    <ShopSwitcher />
  </div>
  
  {/* Right */}
  <div className="flex items-center gap-2">
    <NotificationPanel />
  </div>
</header>
```

### 2. ShopSwitcher.tsx - UI পুনর্গঠন

**নতুন ডিজাইন:**
```text
┌─────────────────────────────────────────────────┐
│ [+ Add Shop]  │  [🏪 chaldal ▼]                │
│   Button      │     Dropdown                   │
└─────────────────────────────────────────────────┘
```

**কোড স্ট্রাকচার:**
```tsx
export function ShopSwitcher() {
  return (
    <div className="flex items-center gap-2">
      {/* Add New Shop Button */}
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setCreateDialogOpen(true)}
      >
        <Plus className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">Add Shop</span>
      </Button>

      {/* Shop Switch Dropdown */}
      {currentShop && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Avatar className="h-5 w-5 mr-2" />
              <span>{currentShop.name}</span>
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {/* Shop list */}
            {availableShops.map((shop) => (...))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
```

### 3. AdminSidebar.tsx - Menu রিনেম করা

**আগে:**
```typescript
{
  labelKey: 'sidebar.shop',
  items: [
    { 
      href: '/admin/shop', 
      labelKey: 'sidebar.myShop',  // "আমার শপ"
      icon: Store,
      children: [...]
    },
  ],
}
```

**পরে:**
```typescript
{
  labelKey: 'sidebar.business',  // "বিজনেস"
  items: [
    { 
      href: '/admin/business', 
      labelKey: 'sidebar.businessManagement',  // "বিজনেস ম্যানেজমেন্ট"
      icon: Building2,
      children: [
        { href: '/admin/business/shops', labelKey: 'sidebar.allShops', icon: Store },  // সব শপ লিস্ট
        { href: '/admin/business/team', labelKey: 'sidebar.shopTeam', icon: Users },
        { href: '/admin/business/billing', labelKey: 'sidebar.shopBilling', icon: CreditCard },
        { href: '/admin/business/security', labelKey: 'sidebar.shopSecurity', icon: Shield },
        { href: '/admin/business/analytics', labelKey: 'sidebar.shopAnalytics', icon: BarChart3 },
        { href: '/admin/business/audit-log', labelKey: 'sidebar.shopAuditLog', icon: ClipboardList },
      ]
    },
  ],
}
```

### 4. Locale Updates

**bn.ts:**
```typescript
sidebar: {
  // ... existing
  business: 'বিজনেস',
  businessManagement: 'বিজনেস ম্যানেজমেন্ট',
  allShops: 'সব শপ',
  // ... rest unchanged
}
```

**en.ts:**
```typescript
sidebar: {
  // ... existing
  business: 'Business',
  businessManagement: 'Business Management',
  allShops: 'All Shops',
  // ... rest unchanged
}
```

### 5. Routes আপডেট (App.tsx)

```tsx
// Old routes → New routes
'/admin/shop/manage'    → '/admin/business/shops'     // Shops লিস্ট
'/admin/shop/team'      → '/admin/business/team'
'/admin/shop/billing'   → '/admin/business/billing'
'/admin/shop/security'  → '/admin/business/security'
'/admin/shop/analytics' → '/admin/business/analytics'
'/admin/shop/audit-log' → '/admin/business/audit-log'
```

### 6. ShopManage.tsx → AllShops.tsx রিনেম

**নতুন পেজ বিহেভিয়র:**
- সুপার অ্যাডমিন হিসেবে সব শপের লিস্ট দেখাবে
- প্রতিটি শপ ম্যানেজ করার অপশন থাকবে
- শপ অ্যাক্টিভ/ইনঅ্যাক্টিভ করার অপশন

```text
┌────────────────────────────────────────────────────────────┐
│ 🏪 সব শপ                                    [+ নতুন শপ]  │
├────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Shop Name    │ Owner      │ Plan   │ Status │ Action│   │
│ │ chaldal      │ John Doe   │ Pro    │ Active │ [⚙️]  │   │
│ │ EcomX v2 Pro │ Jane Smith │ Free   │ Active │ [⚙️]  │   │
│ │ My Store     │ Admin      │ Free   │ Inactive│ [⚙️] │   │
│ └──────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

## ফাইল পরিবর্তন

| ফাইল | পরিবর্তন |
|------|---------|
| `src/components/admin/AdminLayout.tsx` | Header restructure - center shop switcher |
| `src/components/admin/ShopSwitcher.tsx` | Split into Add button + Switch dropdown |
| `src/components/admin/AdminSidebar.tsx` | Rename Shop → Business, update paths |
| `src/locales/bn.ts` | Add business translations |
| `src/locales/en.ts` | Add business translations |
| `src/App.tsx` | Update routes from /shop/ to /business/ |
| `src/pages/admin/ShopManage.tsx` | Rename & refactor to show all shops list |

## Visual Summary

```text
TOP BAR (CENTER):
┌─────────────────────────────────────────────────────────────────┐
│  [≡] Ytspider   │   [+ Add Shop] [🏪 chaldal ▼]   │    🔔      │
└─────────────────────────────────────────────────────────────────┘

SIDEBAR:
┌─────────────────────┐
│ 📊 Dashboard        │
├─────────────────────┤
│ 🏢 Business ▼       │  ← নতুন নাম
│   ├── 🏪 All Shops  │  ← শপ লিস্ট ম্যানেজমেন্ট
│   ├── 👥 Team       │
│   ├── 💳 Billing    │
│   ├── 🔐 Security   │
│   ├── 📊 Analytics  │
│   └── 📋 Audit Log  │
├─────────────────────┤
│ 📦 Content ▼        │
│   ...               │
└─────────────────────┘
```

এই পরিবর্তনগুলো Shop Switcher কে আরও প্রফেশনাল এবং ব্যবহারযোগ্য করবে, এবং "Business" মেনু Super Admin এর জন্য সব শপ ম্যানেজ করার কেন্দ্রীয় জায়গা হবে।

