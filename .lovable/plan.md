

# Shop Settings পেজে Appearance সেটিং যোগ করা

## সমস্যা
বর্তমানে Appearance/Theme সেটিং শুধু Admin (`/admin/settings`)-এ আছে। Shop Owner-দের (`/shop/settings`) জন্য কোনো Appearance সেটিং নেই — শুধু একটা placeholder page দেখায়। ফ্রী বা পেইড সবার জন্য Appearance সেটিং থাকা উচিত।

## সমাধান

### ShopSettingsPage কে functional করা
`src/pages/shop/ShopPages.tsx`-এর `ShopSettingsPage` কম্পোনেন্টে Appearance সেটিং যোগ করা হবে — Admin Settings page-এর মতোই, কিন্তু `ShopLayout`-এ wrap করা থাকবে।

### যা যোগ হবে:
- Language Toggle (বাংলা/English)
- Theme Preset Cards (Default, Ocean, Forest, Sunset, Slate)
- Custom Color Pickers (Primary, Sidebar BG, Accent)
- Appearance Mode Toggle (Light/Dark/System)
- Save/Discard/Reset buttons
- সব existing hooks (`useAdminTheme`, `useAdminThemePreference`) reuse হবে

### ফাইল পরিবর্তন:

| ফাইল | পরিবর্তন |
|------|----------|
| `src/pages/shop/ShopPages.tsx` | `ShopSettingsPage`-এ placeholder সরিয়ে full Appearance UI যোগ |

### টেকনিক্যাল ডিটেইল:
- `ShopSettingsPage` কম্পোনেন্টে `Settings.tsx`-এর সব theme/appearance logic import করা হবে
- `AdminLayout` এর বদলে `ShopLayout` ব্যবহার হবে
- একই `useAdminTheme` ও `useAdminThemePreference` hooks কাজ করবে কারণ এগুলো user-level preference (`user_preferences` table) — shop-specific নয়
- কোনো নতুন route বা sidebar item লাগবে না (আগেই `/shop/settings` route আছে)

