
# এন্টারপ্রাইজ-গ্রেড মাল্টি-টেন্যান্ট শপ ম্যানেজমেন্ট সিস্টেম

## বর্তমান অবস্থা (যা ইতিমধ্যে আছে)

### ডাটাবেজ
- `shops` টেবিল: id, name, slug, logo_url, owner_id, plan, settings, is_active
- `shop_members` টেবিল: shop_id, user_id, role (owner/admin/editor/viewer)
- `shop_role` enum: owner, admin, editor, viewer
- `shop_plan` enum: free, pro, enterprise
- `user_preferences` টেবিল: user_id, key, value (থিম সেভ করার জন্য)

### ফ্রন্টএন্ড
- ShopContext - শপ সুইচিং, শপ তৈরি
- TeamMembers পেজ - মেম্বার লিস্ট, রোল পরিবর্তন
- Settings পেজ - ইউজার-লেভেল থিম (শপ-স্পেসিফিক নয়)

---

## যা করা দরকার

### পর্ব ১: প্রতি-শপ থিম সিস্টেম

**সমস্যা:** বর্তমানে থিম ইউজার-লেভেলে সেভ হয়। প্রতিটা শপের আলাদা থিম হওয়া উচিত।

**সমাধান:**

#### ডাটাবেজ পরিবর্তন:
```sql
-- shop_theme টেবিল তৈরি
CREATE TABLE public.shop_theme (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  preset text NOT NULL DEFAULT 'default',
  colors jsonb NOT NULL DEFAULT '{}',
  mode text NOT NULL DEFAULT 'light',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(shop_id)
);

-- RLS policies
ALTER TABLE shop_theme ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop members can view theme"
  ON shop_theme FOR SELECT
  USING (has_shop_access(shop_id, 'viewer'));

CREATE POLICY "Shop admins can manage theme"
  ON shop_theme FOR ALL
  USING (has_shop_access(shop_id, 'admin'));
```

#### ফ্রন্টএন্ড পরিবর্তন:
- `useShopTheme` হুক তৈরি - currentShop এর থিম fetch/save করবে
- AdminThemeContext আপডেট - শপ থিম সাপোর্ট যোগ
- Settings পেজে শপ থিম vs ইউজার থিম আলাদা করা

---

### পর্ব ২: উন্নত রোল ও পারমিশন সিস্টেম

**নতুন রোল যোগ:**

```sql
-- shop_role enum এ নতুন রোল যোগ
ALTER TYPE shop_role ADD VALUE 'manager' BEFORE 'editor';
ALTER TYPE shop_role ADD VALUE 'support' AFTER 'editor';
```

**রোল হায়ারার্কি:**
```text
+----------+  +----------+  +----------+  +----------+  +----------+  +----------+
|  owner   |  |  admin   |  | manager  |  |  editor  |  | support  |  |  viewer  |
+----------+  +----------+  +----------+  +----------+  +----------+  +----------+
| সব কিছু  |  | টিম ম্যানেজ|  | অর্ডার    |  | কনটেন্ট   |  | কাস্টমার  |  | শুধু দেখা |
| ডিলিট    |  | সেটিংস    |  | প্রোডাক্ট  |  | এডিট     |  | সাপোর্ট   |  |          |
+----------+  +----------+  +----------+  +----------+  +----------+  +----------+
```

**পারমিশন সিস্টেম:**

```sql
-- shop_permissions টেবিল
CREATE TABLE public.shop_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  role shop_role NOT NULL,
  permission text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(shop_id, role, permission)
);

-- ডিফল্ট পারমিশন
INSERT INTO shop_permissions (shop_id, role, permission) VALUES
-- owner পারমিশন
('shop_id', 'owner', 'shop.delete'),
('shop_id', 'owner', 'shop.settings'),
('shop_id', 'owner', 'team.manage'),
('shop_id', 'owner', 'billing.manage'),
-- admin পারমিশন
('shop_id', 'admin', 'shop.settings'),
('shop_id', 'admin', 'team.manage'),
('shop_id', 'admin', 'products.manage'),
-- manager পারমিশন
('shop_id', 'manager', 'orders.manage'),
('shop_id', 'manager', 'products.manage'),
('shop_id', 'manager', 'landing_pages.manage'),
-- ... ইত্যাদি
```

---

### পর্ব ৩: ইমেইল ইনভাইটেশন সিস্টেম

**ডাটাবেজ:**
```sql
-- shop_invitations টেবিল
CREATE TABLE public.shop_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  email text NOT NULL,
  role shop_role NOT NULL,
  token text NOT NULL UNIQUE,
  invited_by uuid NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

**Edge Function:**
```typescript
// supabase/functions/send-invite/index.ts
// - ইনভাইট ইমেইল পাঠাবে
// - ইউনিক টোকেন জেনারেট করবে
// - 7 দিন এক্সপায়ারি

// supabase/functions/accept-invite/index.ts
// - টোকেন ভেরিফাই করবে
// - shop_members এ যোগ করবে
// - invitation আপডেট করবে
```

**ফ্রন্টএন্ড:**
- ইনভাইট মোডাল আপডেট
- পেন্ডিং ইনভাইট লিস্ট
- ইনভাইট রিসেন্ড/ক্যান্সেল অপশন
- `/accept-invite?token=xxx` পেজ

---

### পর্ব ৪: শপ সেটিংস ও কনফিগারেশন

**shops.settings JSONB স্ট্রাকচার:**
```json
{
  "branding": {
    "primary_color": "#3B82F6",
    "logo_url": "...",
    "favicon_url": "..."
  },
  "notifications": {
    "order_email": true,
    "order_sms": false,
    "low_stock_alert": true
  },
  "features": {
    "multi_currency": false,
    "inventory_tracking": true,
    "customer_accounts": false
  },
  "limits": {
    "max_products": 100,
    "max_landing_pages": 10,
    "max_team_members": 5
  }
}
```

---

### পর্ব ৫: অ্যাক্টিভিটি লগ ও অডিট ট্রেইল

**ডাটাবেজ:**
```sql
CREATE TABLE public.shop_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- ইনডেক্স
CREATE INDEX idx_shop_activity_shop ON shop_activity_log(shop_id);
CREATE INDEX idx_shop_activity_user ON shop_activity_log(user_id);
CREATE INDEX idx_shop_activity_created ON shop_activity_log(created_at);
```

---

## সম্পূর্ণ ফিচার লিস্ট

### ১. শপ ম্যানেজমেন্ট
- [x] শপ তৈরি/এডিট/ডিলিট
- [ ] শপ লোগো ও ব্র্যান্ডিং
- [ ] শপ সেটিংস ড্যাশবোর্ড
- [ ] শপ অ্যাক্টিভেট/ডিঅ্যাক্টিভেট
- [ ] শপ ডুপ্লিকেট/ক্লোন

### ২. টিম ম্যানেজমেন্ট
- [x] ইনভাইটেশন সিস্টেম (token-based)
- [x] রোল-বেজড অ্যাক্সেস কন্ট্রোল (RBAC) - 6 roles
- [x] পারমিশন সিস্টেম (useShopPermissions hook)
- [x] টিম মেম্বার অ্যাক্টিভিটি ট্র্যাকিং
- [ ] ইমেইল ইনভাইট (Resend integration)
- [ ] বাল্ক ইনভাইট
- [ ] টিম মেম্বার সাসপেন্ড/রিঅ্যাক্টিভেট

### ৩. থিম ও ব্র্যান্ডিং
- [x] প্রতি-শপ থিম সিস্টেম (shop_theme table)
- [ ] কাস্টম কালার পিকার
- [ ] ল্যান্ডিং পেজ থিম আলাদা
- [ ] ইমেইল টেমপ্লেট কাস্টমাইজেশন
- [ ] হোয়াইট-লেবেল অপশন (এন্টারপ্রাইজ)

### ৪. বিলিং ও সাবস্ক্রিপশন
- [ ] প্ল্যান ম্যানেজমেন্ট (Free/Pro/Enterprise)
- [ ] প্ল্যান লিমিট এনফোর্সমেন্ট
- [ ] পেমেন্ট হিস্ট্রি
- [ ] ইনভয়েস জেনারেশন
- [ ] প্রোমো কোড সিস্টেম

### ৫. সিকিউরিটি
- [ ] 2FA (Two-Factor Authentication)
- [ ] API কী ম্যানেজমেন্ট
- [ ] IP হোয়াইটলিস্ট
- [ ] সেশন ম্যানেজমেন্ট
- [ ] লগইন হিস্ট্রি
- [ ] সিকিউরিটি অ্যালার্ট

### ৬. অ্যানালিটিক্স ও রিপোর্টিং
- [ ] শপ পারফরম্যান্স ড্যাশবোর্ড
- [ ] টিম প্রোডাক্টিভিটি রিপোর্ট
- [ ] অর্ডার অ্যানালিটিক্স
- [ ] রেভেনিউ চার্ট
- [ ] কাস্টম রিপোর্ট বিল্ডার

### ৭. অডিট ও কমপ্লায়েন্স
- [x] অ্যাক্টিভিটি লগ (shop_activity_log table)
- [ ] ডেটা এক্সপোর্ট
- [ ] GDPR কমপ্লায়েন্স টুলস
- [ ] ব্যাকআপ/রিস্টোর

### ৮. ইন্টিগ্রেশন
- [ ] Webhook ম্যানেজমেন্ট (প্রতি-শপ)
- [ ] API অ্যাক্সেস (প্রতি-শপ)
- [ ] থার্ড-পার্টি অ্যাপ কানেকশন
- [ ] SSO (Single Sign-On) - এন্টারপ্রাইজ

---

## ইমপ্লিমেন্টেশন প্রায়োরিটি

### ফেজ ১ (High Priority)
1. প্রতি-শপ থিম সিস্টেম
2. ইমেইল ইনভাইটেশন সিস্টেম
3. Manager ও Support রোল যোগ
4. অ্যাক্টিভিটি লগ

### ফেজ ২ (Medium Priority)
5. কাস্টম পারমিশন সিস্টেম
6. শপ সেটিংস ড্যাশবোর্ড
7. প্ল্যান লিমিট এনফোর্সমেন্ট
8. টিম প্রোডাক্টিভিটি রিপোর্ট

### ফেজ ৩ (Lower Priority)
9. 2FA সেটআপ
10. API কী ম্যানেজমেন্ট
11. হোয়াইট-লেবেল অপশন
12. SSO ইন্টিগ্রেশন

---

## টেকনিক্যাল ডিটেইলস

### নতুন ফাইল তৈরি হবে:
```text
src/hooks/useShopTheme.ts
src/hooks/useShopPermissions.ts
src/hooks/useShopInvitations.ts
src/hooks/useActivityLog.ts
src/pages/admin/ShopTheme.tsx
src/pages/AcceptInvite.tsx
src/components/admin/team/InvitationsList.tsx
src/components/admin/team/RolePermissionEditor.tsx
supabase/functions/send-invite/index.ts
supabase/functions/accept-invite/index.ts
supabase/functions/log-activity/index.ts
```

### ডাটাবেজ মাইগ্রেশন:
```text
- shop_theme টেবিল
- shop_permissions টেবিল
- shop_invitations টেবিল
- shop_activity_log টেবিল
- shop_role enum আপডেট (manager, support যোগ)
- RLS policies
```

