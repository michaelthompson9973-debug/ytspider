
## লক্ষ্য (আপনার কথামতো)
নতুন দোকান তৈরি করার সময় ফ্লো হবে:
1) আগে “ডিজিটাল / ফিজিক্যাল” সিলেক্ট করতে হবে (Required)  
2) তারপর দোকানের নাম দিতে হবে (Required + Validation)  
3) তারপর Save/Create

এখন যেটা হচ্ছে: “Add Shop” (ShopSwitcher) থেকে যে ডায়ালগটা খুলে, সেটা **একটা inline/legacy CreateShopDialog**—এটা React Hook Form/Zod ব্যবহার করে না, তাই ঠিকমতো validation দেখায় না এবং shop_type নির্বাচনও নেই। এই কারণেই আপনি বারবার দেখছেন “validation চাচ্ছে না কেন”।

---

## কী কী জায়গায় পরিবর্তন হবে (High confidence)
### A) `src/components/admin/ShopSwitcher.tsx` (সবচেয়ে গুরুত্বপূর্ণ)
- Inline `CreateShopDialog` (ShopSwitcher ফাইলের নিচে থাকা লোকাল component) **সরিয়ে** দেওয়া হবে বা ব্যবহার বন্ধ করা হবে।
- এর বদলে **একটাই canonical dialog** ব্যবহার করা হবে: `src/components/admin/CreateShopDialog.tsx`
- ফলে “Add Shop” বাটন ক্লিক করলেই নতুন dialog খুলবে এবং validation + shop_type নির্বাচন কাজ করবে।

**Acceptance criteria**
- “Add Shop” → dialog খুলবে
- shop_type না দিলে “Next / Continue / Create” disabled বা error দেখাবে
- নাম ৩ অক্ষরের কম হলে error দেখাবে
- সফলভাবে create হলে shop switch হবে এবং বর্তমান shop context update হবে

---

### B) `src/components/admin/CreateShopDialog.tsx` (নতুন UI ফ্লো + validation)
এখানে dialog-কে **2-step** করা হবে:

#### Step 1: Shop Type selection (Required)
- দুইটা card/button:
  - ফিজিক্যাল প্রোডাক্ট (Package icon)
  - ডিজিটাল প্রোডাক্ট (Download icon)
- Selected state (radio-like) থাকবে
- “পরবর্তী” বোতাম: shop_type সিলেক্ট না করলে disabled / error

#### Step 2: Shop Name (Required) + (Optional) slug
- আপনার requirement অনুযায়ী এখানে মূল জিনিস: **shop name**
- Slug নিয়ে আপনার আগে করা validation আছে; কিন্তু UX সহজ রাখতে আমি প্রস্তাব করব:
  - Default: slug input hidden (auto-generate)
  - Advanced toggle থাকলে দেখাবে (চাইলে)
- Zod validation:
  - name: min 3, max 50
  - slug: min 3, max 30, regex
- Submit এর সময় কল হবে:
  - `createShop(name, slug?, { shop_type: selectedType, onboarding_completed: true })`

**কেন `onboarding_completed: true`?**
আপনি চাইছেন type+name দিয়েই create+save শেষ। যদি false রাখা হয়, তাহলে create করার পর আবার onboarding-এ গিয়ে নাম/type আবার চাইতে পারে—আপনার চাহিদার সাথে conflict হবে।

---

### C) `src/contexts/ShopContext.tsx` (শুধু consistency check)
এখানে `createShop()` ইতিমধ্যে `options.shop_type` সাপোর্ট করে ✅  
- নিশ্চিত করব যে CreateShopDialog থেকে options পাঠানো হচ্ছে।
- (Optional hardening) `createShop()`-এ `shop_type` না আসলে default `physical` থাকবেই (already).

---

### D) (Recommended) `src/components/admin/CreateShopForUserDialog.tsx` + `supabase/functions/provision-shop/index.ts`
আপনার মূল complaint “নতুন দোকান create করার সময়”। সেটা ShopSwitcher flow-এ ঠিক হবে।  
কিন্তু platform admin “Create shop for user” ফ্লোতেও consistency রাখতে:
- CreateShopForUserDialog এ “Shop Type” dropdown/radio যোগ করা
- `provision-shop` function body-তে `shopType` গ্রহণ করা
- shops insert-এর সময় `shop_type: shopType` সেট করা

এটা না করলে: owner provisioning দিয়ে বানানো shop গুলো সব default physical হয়ে যেতে পারে—যেটা আপনার architecture goal-এর বিরুদ্ধে যাবে।

---

## টেস্টিং চেকলিস্ট (World-class QA)
### 1) UI validation tests (ShopSwitcher → Add Shop)
- [ ] shop_type select না করে Next চাপলে: error/disabled
- [ ] shop name খালি: error
- [ ] shop name “ab”: error (min 3)
- [ ] shop name “valid name”: ok
- [ ] create success: toast + dialog close + current shop switch + sidebar update

### 2) Data correctness tests (Database)
- [ ] নতুন shop row এ `shop_type` ঠিকভাবে set হয়েছে (physical/digital)
- [ ] slug uniqueness violation হলে user-friendly error (already handled in ShopContext)

### 3) Regression tests
- [ ] Shop switching কাজ করছে
- [ ] Platform mode → shop mode transition ঠিক আছে
- [ ] Existing CreateShopDialog usage (অন্য জায়গায়) ভাঙেনি

---

## ডেলিভারি/ইমপ্লিমেন্টেশন স্টেপস (Sequenced)
1) ShopSwitcher.tsx পড়া/cleanup: inline dialog component remove/stop using  
2) CreateShopDialog.tsx-এ 2-step UI + shop_type state + zod integration update  
3) CreateShopDialog → ShopContext.createShop call-এ options পাঠানো  
4) (Optional but recommended) CreateShopForUserDialog + provision-shop update  
5) End-to-end manual test (desktop + mobile)

---

## আউটপুট (আপনি যা দেখবেন)
- “Add Shop” ক্লিক করলে প্রথমে **Digital / Physical** নির্বাচন স্ক্রিন
- তারপর **Shop name** ইনপুট
- Save করলে shop তৈরি হবে এবং আপনার system-এ physical/digital data cleanly separate থাকবে (shop.shop_type দ্বারা)

