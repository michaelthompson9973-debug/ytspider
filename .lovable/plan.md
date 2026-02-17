
# মোবাইল ফ্রেন্ডলি + Drawer রূপান্তর

## সমস্যা
- Dialog/Modal গুলো মোবাইলে সম্পূর্ণ স্ক্রিন ব্লক করে, UX খারাপ
- কিছু পেজে অতিরিক্ত টেক্সট, কম অ্যাকশন
- টেবিল ও কার্ড লেআউট মোবাইলে সংকুচিত হয়ে যায়

## পরিকল্পনা

### ধাপ ১: Responsive Drawer Component তৈরি

একটি `ResponsiveModal` কম্পোনেন্ট তৈরি হবে যেটা:
- **Desktop (768px+)**: সাধারণ Dialog হিসেবে কাজ করবে
- **Mobile (<768px)**: নিচ থেকে Drawer (vaul) হিসেবে ওপেন হবে

এটা একবার বানালে সব জায়গায় `Dialog` এর বদলে এটা ব্যবহার করা যাবে।

### ধাপ ২: সকল Modal → Drawer রূপান্তর

যেসব ফাইলে Dialog আছে, সেগুলোতে `ResponsiveModal` ব্যবহার করা হবে:

| ফাইল | মডাল | পরিবর্তন |
|------|-------|---------|
| `OrderDetailsModal.tsx` | অর্ডার ডিটেইলস | Dialog → ResponsiveModal (মোবাইলে ফুল-হাইট drawer) |
| `OrderEditModal.tsx` | অর্ডার এডিট | Dialog → ResponsiveModal |
| `FraudCheckModal.tsx` | ফ্রড চেক | Dialog → ResponsiveModal |
| `SendToCourierModal.tsx` | কুরিয়ারে পাঠান | Dialog → ResponsiveModal |
| `CreateShopDialog.tsx` | নতুন শপ তৈরি | Dialog → ResponsiveModal |
| `CreateShopForUserDialog.tsx` | ইউজারের জন্য শপ | Dialog → ResponsiveModal |
| `AddPageModal.tsx` | Facebook পেজ যোগ | Dialog → ResponsiveModal |
| `MediaPickerDialog.tsx` | মিডিয়া সিলেক্ট | Dialog → ResponsiveModal |
| `ShopCoupons.tsx` | কুপন ফর্ম | Dialog → ResponsiveModal |
| `PageConnectionCard.tsx` | Webhook তথ্য | Dialog → ResponsiveModal |
| `ComponentPreviewModal.tsx` | কম্পোনেন্ট প্রিভিউ | Dialog → ResponsiveModal |
| `DeleteConfirmDialog (orders)` | ডিলিট কনফার্ম | AlertDialog → মোবাইলে bottom drawer |
| `DeleteConfirmDialog (landing)` | ডিলিট কনফার্ম | AlertDialog → মোবাইলে bottom drawer |
| `SectionList.tsx` | নতুন সেকশন যোগ | Dialog → ResponsiveModal |
| `ShopSwitcher.tsx` | শপ তৈরি ডায়ালগ | Dialog → ResponsiveModal |

### ধাপ ৩: পেজ মোবাইল অপটিমাইজেশন

**ShopDashboard.tsx:**
- KPI কার্ড 2-column grid রাখা, কিন্তু hidden কার্ডগুলো মোবাইলে collapsible "আরো দেখুন" দিয়ে দেখানো
- Chart height মোবাইলে কমানো (280 → 200px)
- চার্ট গুলো মোবাইলে single column stack

**ShopCustomers.tsx:**
- কাস্টমার কার্ডে action বাটন (phone call, quick view) যোগ
- অ্যাভাটার ছোট করা মোবাইলে

**ShopCoupons.tsx:**
- কুপন কার্ড layout মোবাইলে vertical stack
- অ্যাকশন বাটন (switch, edit, delete) নিচে সরানো মোবাইলে
- header "কুপন ম্যানেজমেন্ট" → শুধু "কুপন"

**ShopPages.tsx (Settings, placeholder pages):**
- Settings পেজে card গুলোর মধ্যে compact spacing

**Orders পেজ:**
- মোবাইলে OrderTable → OrderGrid (card view) টগল
- Action বাটনগুলো bottom-sticky bar এ

**InboxLayout.tsx (Messenger):**
- মোবাইলে 3-panel → single panel with swipe/tab navigation
- Left sidebar sheet হিসেবে ওপেন হবে
- Right panel sheet হিসেবে ওপেন হবে

### ধাপ ৪: কম লেখা, বেশি অ্যাকশন

- Page header subtitle গুলো মোবাইলে hide (`hidden sm:block`)
- বাটন টেক্সট মোবাইলে icon-only (`<span className="hidden sm:inline">`)
- KPI কার্ডে label ছোট করা
- Empty state মেসেজ সংক্ষিপ্ত করা

---

## টেকনিক্যাল ডিটেইল

### ResponsiveModal কম্পোনেন্ট

নতুন ফাইল `src/components/ui/responsive-modal.tsx` তৈরি হবে:

```text
ResponsiveModal: 
  - useIsMobile() hook দিয়ে device detect
  - isMobile → Drawer (vaul) component render
  - isDesktop → Dialog (radix) component render
  - Same API: open, onOpenChange, children
  - Sub-components: ResponsiveModalContent, ResponsiveModalHeader, 
    ResponsiveModalTitle, ResponsiveModalDescription, ResponsiveModalFooter
```

### ফাইল পরিবর্তন তালিকা

| ফাইল | ধরন |
|------|------|
| `src/components/ui/responsive-modal.tsx` | নতুন |
| `src/components/admin/orders/OrderDetailsModal.tsx` | আপডেট |
| `src/components/admin/orders/OrderEditModal.tsx` | আপডেট |
| `src/components/admin/orders/FraudCheckModal.tsx` | আপডেট |
| `src/components/admin/orders/DeleteConfirmDialog.tsx` | আপডেট |
| `src/components/admin/courier/SendToCourierModal.tsx` | আপডেট |
| `src/components/admin/CreateShopDialog.tsx` | আপডেট |
| `src/components/admin/CreateShopForUserDialog.tsx` | আপডেট |
| `src/components/admin/MediaPickerDialog.tsx` | আপডেট |
| `src/components/admin/ShopSwitcher.tsx` | আপডেট |
| `src/components/admin/messenger/AddPageModal.tsx` | আপডেট |
| `src/components/admin/messenger/PageConnectionCard.tsx` | আপডেট |
| `src/components/admin/library/ComponentPreviewModal.tsx` | আপডেট |
| `src/components/admin/landing-page-editor/DeleteConfirmDialog.tsx` | আপডেট |
| `src/components/admin/landing-page-editor/SectionList.tsx` | আপডেট |
| `src/pages/shop/ShopCoupons.tsx` | আপডেট |
| `src/pages/shop/ShopDashboard.tsx` | আপডেট |
| `src/pages/shop/ShopCustomers.tsx` | আপডেট |
| `src/components/admin/messenger/layout/InboxLayout.tsx` | আপডেট |

মোট: ১ নতুন + ১৮ আপডেট
