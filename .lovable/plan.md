
# Platform Mode বাস্তবায়ন

## সারসংক্ষেপ
Super Admin লগইন করলে প্রথমে **Platform Mode** এ থাকবে যেখানে সব শপের সামগ্রিক ডেটা দেখতে পাবে। চাইলে নির্দিষ্ট শপে সুইচ করতে পারবে।

---

## UI পরিবর্তন

### ShopSwitcher এ Platform Option

```text
┌─────────────────────────────────────────────────────┐
│ [🏢 Platform ▼]  [+ Add Shop]                       │  ← Platform Mode এ
│ [🏪 chaldal ▼]   [+ Add Shop]                       │  ← Shop Mode এ
└─────────────────────────────────────────────────────┘

ড্রপডাউন মেনু:
┌─────────────────────────────────────┐
│ 🏢 Platform                    ✓   │  ← Platform Mode অপশন
├─────────────────────────────────────┤
│ 🏪 chaldal                         │
│ 🏪 EcomX v2 Pro                    │
└─────────────────────────────────────┘
```

### Sidebar পরিবর্তন

**Platform Mode এ (currentShop = null):**
```text
┌─────────────────────────────┐
│ 🏢 Ytspider                 │
├─────────────────────────────┤
│ 📊 Overview                 │
│   └─ Dashboard (Platform)   │
├─────────────────────────────┤
│ 🏪 Business                 │
│   ├─ All Shops              │
│   ├─ Team                   │
│   ├─ Billing                │
│   ├─ Security               │
│   ├─ Analytics              │
│   └─ Audit Log              │
├─────────────────────────────┤
│ ⚙️ Settings                 │
│   └─ Appearance             │
└─────────────────────────────┘

❌ Content (Products, Pages, Media)      ← লুকানো
❌ Operations (Orders, Tracking, Inbox)  ← লুকানো
❌ API Settings                          ← লুকানো
```

**Shop Mode এ (currentShop !== null):**
সব মেনু দেখা যাবে ✅

### Platform Dashboard

```text
┌────────────────────────────────────────────────────────────────┐
│ 🏢 Platform Overview              [সব শপের সামগ্রিক অবস্থা]   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│ │ মোট আয়  │ │মোট অর্ডার │ │ সক্রিয় শপ │ │ মোট পেজ  │           │
│ │৳1,25,000 │ │   850    │ │    5     │ │   23     │           │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ শপ পারফরম্যান্স                                          │   │
│ ├──────────────────────────────────────────────────────────┤   │
│ │ Shop      │ Orders │ Revenue  │ Products │ Status       │   │
│ ├───────────┼────────┼──────────┼──────────┼──────────────┤   │
│ │ chaldal   │  250   │ ৳45,000  │    32    │ ✅ Active    │   │
│ │ EcomX v2  │  180   │ ৳35,000  │    28    │ ✅ Active    │   │
│ └──────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

---

## ফাইল পরিবর্তন

### নতুন ফাইল তৈরি
| ফাইল | উদ্দেশ্য |
|------|---------|
| `src/components/admin/dashboard/PlatformDashboard.tsx` | সব শপের সামগ্রিক ড্যাশবোর্ড |
| `src/components/admin/dashboard/ShopPerformanceTable.tsx` | শপ-ভিত্তিক পারফরম্যান্স টেবিল |

### বিদ্যমান ফাইল আপডেট
| ফাইল | পরিবর্তন |
|------|---------|
| `src/contexts/ShopContext.tsx` | `isPlatformMode`, `enterPlatformMode()` যোগ, প্রথম লোডে শপ auto-select বন্ধ |
| `src/components/admin/AdminSidebar.tsx` | Platform Mode এ শুধু Overview, Business ও Settings দেখানো |
| `src/components/admin/ShopSwitcher.tsx` | Platform option যোগ, UI আপডেট |
| `src/pages/admin/Dashboard.tsx` | Platform Mode এ PlatformDashboard দেখানো |
| `src/locales/en.ts` | Platform Mode translations |
| `src/locales/bn.ts` | Platform Mode translations |
| `src/components/admin/dashboard/index.ts` | নতুন exports যোগ |

---

## বিস্তারিত পরিবর্তন

### ১. ShopContext.tsx

```typescript
interface ShopContextType {
  // ... existing
  isPlatformMode: boolean;
  enterPlatformMode: () => void;
}

// fetchShops এ পরিবর্তন
if (savedShopId && savedShop) {
  setCurrentShop(savedShop);
} else {
  // প্রথম শপে auto-switch বন্ধ - Platform Mode এ থাকবে
  setCurrentShop(null);
}

// নতুন computed value
const isPlatformMode = currentShop === null;

// নতুন function
const enterPlatformMode = () => {
  setCurrentShop(null);
  setUserRole(null);
  localStorage.removeItem(STORAGE_KEY);
};
```

### ২. AdminSidebar.tsx

```typescript
const { currentShop } = useShop();
const isPlatformMode = !currentShop;

// Platform Mode এ restricted menu
const filteredNavGroups = isPlatformMode 
  ? navGroups.filter(g => 
      ['sidebar.overview', 'sidebar.business', 'sidebar.settings'].includes(g.labelKey)
    )
  : navGroups;
```

### ৩. ShopSwitcher.tsx

```typescript
// Platform Mode dropdown option
<DropdownMenuItem onClick={enterPlatformMode}>
  <Building2 className="h-4 w-4 mr-2" />
  Platform
  {!currentShop && <Check className="ml-auto h-4 w-4" />}
</DropdownMenuItem>
<DropdownMenuSeparator />

// Platform Mode এ different trigger UI
{!currentShop ? (
  <Button variant="ghost" size="sm" className="gap-2">
    <Building2 className="h-4 w-4" />
    <span>Platform</span>
    <ChevronDown className="h-4 w-4" />
  </Button>
) : (
  // existing shop trigger
)}
```

### ৪. Dashboard.tsx

```typescript
const { currentShop } = useShop();

// Platform Mode এ Platform Dashboard দেখাবে
if (!currentShop) {
  return (
    <AdminLayout>
      <PlatformDashboard />
    </AdminLayout>
  );
}

// Shop Mode এ existing shop dashboard (with ShopGuard)
return (
  <AdminLayout>
    <ShopGuard>
      {/* existing shop-specific dashboard */}
    </ShopGuard>
  </AdminLayout>
);
```

### ৫. PlatformDashboard.tsx (নতুন)

সব শপের aggregated ডেটা দেখাবে:
- মোট Revenue (সব শপ মিলিয়ে)
- মোট Orders
- সক্রিয় Shops সংখ্যা
- মোট Landing Pages
- মোট Products
- ShopPerformanceTable (শপ-ভিত্তিক তুলনা)

### ৬. Translations

```typescript
// en.ts & bn.ts
platform: {
  title: 'Platform Overview',
  allShops: 'All Shops',
  totalRevenue: 'Total Revenue',
  totalOrders: 'Total Orders',
  activeShops: 'Active Shops',
  totalPages: 'Total Pages',
  shopPerformance: 'Shop Performance',
  switchToShop: 'Switch to Shop',
}
```

---

## বাস্তবায়ন ধাপ

1. **ShopContext আপডেট** - isPlatformMode ও enterPlatformMode যোগ
2. **Translations আপডেট** - Platform Mode এর জন্য নতুন strings
3. **ShopSwitcher আপডেট** - Platform option ও UI
4. **AdminSidebar আপডেট** - Platform Mode এ restricted menu
5. **PlatformDashboard তৈরি** - সব শপের aggregated stats
6. **ShopPerformanceTable তৈরি** - শপ তুলনা টেবিল
7. **Dashboard আপডেট** - conditional rendering

---

## ফলাফল

| বৈশিষ্ট্য | Platform Mode | Shop Mode |
|----------|---------------|-----------|
| Dashboard | Platform (সব শপ) | Shop-specific |
| Sidebar | Overview + Business + Settings | সব মেনু |
| Data View | Aggregated | Shop-filtered |
| ShopSwitcher | "Platform" selected | নির্দিষ্ট শপ selected |

**Super Admin UX Flow:**
1. লগইন → Platform Mode এ Platform Dashboard দেখা যাবে
2. যেকোনো শপে ক্লিক → Shop Mode এ যাবে, সব টুলস দেখা যাবে
3. "Platform" ক্লিক → আবার Platform Mode এ ফিরে আসবে
