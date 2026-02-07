

# Security Isolation Plan: Admin vs Shop আলাদা করা

## সমস্যা সারসংক্ষেপ

বর্তমানে `/admin` (Platform Admin) এবং `/shop` (Shop Owner) এর সিকিউরিটি ফিচারগুলো মিশে গেছে। নিচে প্রতিটি সমস্যা এবং সমাধান:

---

## সমস্যা ১: দুইটা Login Route-এ বিভ্রান্তি

### বর্তমান অবস্থা:
- `/auth` → Admin login, Sign Up আছে, success-এ `/admin`-এ redirect
- `/login` → Shop Owner login, success-এ `/shop`-এ redirect
- দুটোই একই auth system ব্যবহার করে

### সমাধান:
- `/auth` পেজ থেকে **Sign Up অপশন সরানো** (admin account শুধু manually তৈরি হবে)
- `/auth` পেজে login-এর পর role check করা:
  - `is_admin()` true হলে → `/admin`
  - না হলে → `/shop` (redirect, "Access Denied" না দেখিয়ে)
- `/login` পেজে login-এর পর:
  - `is_admin()` true হলে → `/admin`-এ redirect link দেখানো
  - না হলে → `/shop`
- Sign Up শুধু `/login` পেজে রাখা (shop owner registration)

---

## সমস্যা ২: ShopSecurity `/admin` route-এ Shop-specific কাজ করে

### বর্তমান অবস্থা:
- `/admin/business/security` — shop API keys manage করে
- Shop Owner-দের নিজের security page নেই

### সমাধান:
- `/admin/business/security` → **Platform-level security** দেখাবে (platform API keys, admin accounts, platform 2FA)
- `/shop/security` → নতুন route তৈরি — **Shop-level security** (shop API keys, team member access, shop 2FA)
- Shop Owner Sidebar-এ "Security" item যোগ করা

---

## সমস্যা ৩: 2FA Toggle শুধু UI

### বর্তমান অবস্থা:
- `useState(false)` — কোনো backend নেই
- Toggle করলে শুধু UI change হয়, page refresh-এ reset

### সমাধান:
- 2FA toggle **সাময়িকভাবে সরিয়ে দেওয়া** অথবা "Coming Soon" badge দিয়ে disabled রাখা
- ভবিষ্যতে Supabase MFA API integration করা (এটা একটা বড় feature, আলাদা phase-এ হবে)

---

## সমস্যা ৪: `/auth`-এ Public Sign Up

### বর্তমান অবস্থা:
- যে কেউ account create করতে পারে
- Role assign হয় না
- "Contact admin" message দেখায় কিন্তু user database-এ থেকে যায়

### সমাধান:
- `/auth` থেকে Sign Up button সরানো
- শুধু `/login` পেজে Sign Up রাখা (shop owner registration flow)
- `/login`-এ Sign Up করলে user `profiles` table-এ যায়, কিন্তু `user_roles`-এ admin role পায় না → স্বাভাবিকভাবে শুধু shop owner হিসেবে কাজ করতে পারে

---

## সমস্যা ৫: Admin Sidebar-এ Shop-specific Items Platform Mode-এও দেখায়

### বর্তমান অবস্থা:
- Security, Analytics, Subscription → Platform Mode-এও sidebar-এ আছে
- কিন্তু click করলে "No shop selected" দেখায়

### সমাধান:
- `AdminSidebar.tsx`-এ business children conditional করা:
  - Platform Mode: শুধু "All Shops" দেখাবে (Security/Analytics/Subscription hide)
  - Shop Mode: সব দেখাবে
- ইতিমধ্যে Subscription-এ এই pattern আছে — বাকিগুলোতেও apply করা

---

## সমস্যা ৬: API Keys Overlap

### বর্তমান অবস্থা:
- `/admin/api/ai` → AI API keys (shop_id সহ)
- `/admin/business/security` → Generic API keys (shop_id সহ)
- দুটো আলাদা জায়গা থেকে একই `api_keys` table access

### সমাধান:
- `/admin/business/security`-এর API Keys section → **শুধু general/integration API keys** (provider = 'custom')
- `/admin/api/ai` → **শুধু AI API keys** (provider = 'gemini')
- Query-তে `provider` filter যোগ করা

---

## সমস্যা ৭: Session Management নেই

### বর্তমান অবস্থা:
- "Active Sessions" hardcoded "coming soon"
- কোনো tracking নেই

### সমাধান:
- "Active Sessions" card-এ **স্পষ্ট "Coming Soon" badge** এবং ব্যাখ্যা
- Disabled button-এ tooltip যোগ
- Future phase-এ `user_sessions` table ও tracking implement করা

---

## Implementation Steps (Sequenced)

### Step 1: Auth Route Cleanup
- `/auth` থেকে Sign Up সরানো
- `/auth` login success-এ role-based redirect যোগ
- `/login` login success-এ admin redirect link যোগ

### Step 2: Admin Sidebar Fix
- Platform Mode-এ Security, Analytics, Audit Log hide করা (Subscription-এর মতো)

### Step 3: Shop Security Route
- `/shop/security` route তৈরি
- `ShopSecurity` component reuse (ShopLayout-এ wrap করে)
- Shop Sidebar-এ Security item যোগ

### Step 4: 2FA ও Sessions Cleanup
- 2FA toggle disabled + "Coming Soon" badge
- Sessions card cleanup

### Step 5: API Keys Separation
- `useShopApiKeys` hook-এ provider filter option যোগ
- Security page-এ শুধু custom keys
- AI page-এ শুধু AI keys

---

## Files to Change

```text
Modified:
├── src/pages/Auth.tsx (Sign Up সরানো, role-based redirect)
├── src/pages/shop/ShopLogin.tsx (admin redirect link)
├── src/components/admin/AdminSidebar.tsx (Platform Mode hide items)
├── src/pages/admin/ShopSecurity.tsx (2FA cleanup, sessions cleanup)
├── src/hooks/useShopApiKeys.ts (provider filter)

New:
├── src/pages/shop/ShopPages.tsx (ShopSecurityPage export যোগ)

Route Addition:
├── src/App.tsx (/shop/security route)
├── src/components/shop/ShopSidebar.tsx (Security nav item)
```

---

## প্রত্যাশিত ফলাফল

- Admin `/auth` → শুধু login, Sign Up নেই
- Shop Owner `/login` → login + Sign Up
- Role-based redirect: admin → `/admin`, shop owner → `/shop`
- Platform Mode sidebar-এ shop-specific items নেই
- Shop Owner-দের নিজের `/shop/security` page
- 2FA এবং Sessions স্পষ্টভাবে "Coming Soon" marked
- API Keys overlap দূর

