

# Platform-Level Shop Provisioning ও Role-Based Shop Access

## বর্তমান সমস্যা

| সমস্যা | বিবরণ |
|--------|-------|
| শপ তৈরিতে Owner Email নেই | `CreateShopDialog`-এ শুধু নাম ও slug আছে, কিন্তু owner email নেই |
| Platform শপ তৈরি করতে পারে না | Admin নিজে শপ তৈরি করলে সেই admin-ই owner হয়ে যায় |
| No Auto-Provisioning | Payment webhook-এ user না থাকলে শপ তৈরি হয় না |

## সমাধান

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  PLATFORM ADMIN (/admin/business/shops)                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                                       │
│                                                                              │
│  [+ শপ তৈরি করুন]                                                            │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ 🏪 নতুন শপ তৈরি করুন                                                  │   │
│  │                                                                       │   │
│  │ শপের নাম *                                                            │   │
│  │ [আমার শপ]                                                             │   │
│  │                                                                       │   │
│  │ Slug *                                                                │   │
│  │ [amar-shop]                                                           │   │
│  │                                                                       │   │
│  │ ─────────────────────────────────────────────────────────────────    │   │
│  │ 👤 Owner তথ্য (যার জন্য শপ তৈরি হবে)                                  │   │
│  │ ─────────────────────────────────────────────────────────────────    │   │
│  │                                                                       │   │
│  │ ইমেইল *                                                               │   │
│  │ [owner@example.com]                                                   │   │
│  │                                                                       │   │
│  │ 📦 প্ল্যান                                                            │   │
│  │ [▼ Pro - ৳999/মাস]                                                   │   │
│  │                                                                       │   │
│  │ মেয়াদ                                                                │   │
│  │ [▼ ৩০ দিন]                                                           │   │
│  │                                                                       │   │
│  │ [ ] ইমেইলে credential পাঠান                                          │   │
│  │                                                                       │   │
│  │ [শপ তৈরি করুন]                                                        │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  BACKEND PROCESSING (Edge Function: provision-shop)                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                           │
│                                                                              │
│  ১. Email দিয়ে user খোঁজা                                                    │
│     ├── User exists → তাকে owner হিসেবে assign                              │
│     └── User না থাকলে →                                                      │
│         a. Auto-generate password                                            │
│         b. Create user account (auth.admin.createUser)                       │
│         c. Store password hash temporarily                                   │
│                                                                              │
│  ২. Shop তৈরি করা                                                            │
│     • name, slug, plan, expires_at সহ                                        │
│                                                                              │
│  ৩. shop_members entry (role: 'owner')                                       │
│                                                                              │
│  ৪. subscription entry (if paid plan)                                        │
│                                                                              │
│  ৫. Email পাঠানো (optional)                                                  │
│     • Welcome email with login credentials                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ফাইল পরিবর্তন তালিকা

### নতুন ফাইল তৈরি:

| ফাইল | উদ্দেশ্য |
|------|----------|
| `src/components/admin/CreateShopForUserDialog.tsx` | Platform admin এর জন্য শপ তৈরির dialog (owner email সহ) |
| `supabase/functions/provision-shop/index.ts` | User create + Shop create + Email send করার edge function |

### আপডেট করা ফাইল:

| ফাইল | পরিবর্তন |
|------|---------|
| `src/pages/admin/AllShops.tsx` | নতুন dialog ব্যবহার করা |
| `src/locales/bn.ts` | নতুন translations |
| `src/locales/en.ts` | নতুন translations |

---

## নতুন Dialog: `CreateShopForUserDialog`

```typescript
// Fields:
interface CreateShopForm {
  shopName: string;
  slug: string;
  ownerEmail: string;
  planId: string;          // pricing_plans থেকে select
  durationDays: number;    // 30, 90, 365
  sendCredentials: boolean; // ইমেইলে credential পাঠাবে কিনা
}
```

### UI Design

```text
+------------------------------------------------------------------+
| 🏪 নতুন শপ তৈরি করুন                                               |
+------------------------------------------------------------------+
|                                                                    |
|  শপের তথ্য                                                         |
|  ─────────────────────────────────────────                         |
|  শপের নাম *              Slug *                                    |
|  [My Store]             [my-store]                                |
|                                                                    |
|  ─────────────────────────────────────────                         |
|  Owner তথ্য (যার জন্য শপ তৈরি হবে)                                  |
|  ─────────────────────────────────────────                         |
|                                                                    |
|  ইমেইল *                                                           |
|  [owner@example.com]                                               |
|  ℹ️ এই ইমেইলে account না থাকলে নতুন account তৈরি হবে               |
|                                                                    |
|  ─────────────────────────────────────────                         |
|  সাবস্ক্রিপশন                                                       |
|  ─────────────────────────────────────────                         |
|                                                                    |
|  প্ল্যান *                 মেয়াদ *                                  |
|  [▼ Pro - ৳999]          [▼ ৩০ দিন]                               |
|                                                                    |
|  [✓] ইমেইলে লগইন তথ্য পাঠান                                        |
|                                                                    |
|  [বাতিল]                              [শপ তৈরি করুন]               |
+------------------------------------------------------------------+
```

---

## Edge Function: `provision-shop`

### Request Body
```typescript
interface ProvisionShopRequest {
  shopName: string;
  slug: string;
  ownerEmail: string;
  planId: string;
  durationDays: number;
  sendCredentials: boolean;
}
```

### Response
```typescript
interface ProvisionShopResponse {
  success: boolean;
  shop: {
    id: string;
    name: string;
    slug: string;
  };
  user: {
    id: string;
    email: string;
    isNewUser: boolean;
  };
  subscription?: {
    id: string;
    expires_at: string;
  };
  error?: string;
}
```

### Logic Flow

```text
1. Validate input
   ├── Check shopName, slug, ownerEmail required
   └── Check slug uniqueness

2. Find or Create User
   ├── Query profiles by email
   │   └── If found → use existing user_id
   │
   └── If not found:
       ├── Generate secure password (16 chars)
       ├── supabase.auth.admin.createUser({
       │     email, password, email_confirm: true
       │   })
       ├── Create profile entry
       └── Store password for email

3. Create Shop
   ├── Insert into shops table
   │   • name, slug, owner_id, plan, is_active: true
   │   • expires_at = now() + durationDays
   └── Handle slug conflict error

4. Create shop_members entry
   └── role: 'owner', user_id, shop_id

5. Create subscription entry (if paid plan)
   └── user_id, shop_id, plan_id, expires_at, status: 'active'

6. Send Welcome Email (if sendCredentials)
   └── Resend API with:
       • Shop name
       • Login URL
       • Email
       • Password (if new user)
       • Plan info
       • Expiry date

7. Return response
```

---

## Database সম্পর্ক

```text
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  pricing_plans  │     │     shops       │     │  shop_members   │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id              │◄────│ subscription_id │     │ id              │
│ name            │     │ id              │◄────│ shop_id         │
│ price_monthly   │     │ name            │     │ user_id         │────►[auth.users]
│ duration_days   │     │ slug            │     │ role            │
│ max_shops       │     │ owner_id        │────►│ (owner/admin/   │
│ ...             │     │ plan            │     │  manager/editor/│
└─────────────────┘     │ expires_at      │     │  support/viewer)│
                        │ is_active       │     └─────────────────┘
                        └─────────────────┘
                               │
                               │
                        ┌──────▼──────────┐
                        │  subscriptions  │
                        ├─────────────────┤
                        │ id              │
                        │ shop_id         │
                        │ user_id         │
                        │ plan_id         │
                        │ expires_at      │
                        │ status          │
                        └─────────────────┘
```

---

## প্রয়োজনীয় Secrets

| Secret | উদ্দেশ্য | স্ট্যাটাস |
|--------|----------|---------|
| `RESEND_API_KEY` | Email পাঠানোর জন্য | ❌ নেই, যোগ করতে হবে |

---

## Implementation Steps

### Step 1: RESEND_API_KEY Secret
- Email credentials পাঠাতে Resend API লাগবে

### Step 2: Edge Function তৈরি
- `provision-shop` edge function
- User create (if not exists)
- Shop + Subscription + Member create
- Email send

### Step 3: নতুন Dialog Component
- `CreateShopForUserDialog.tsx`
- Owner email field
- Plan selection
- Duration selection
- Send credentials checkbox

### Step 4: AllShops পেজ আপডেট
- নতুন dialog ব্যবহার

### Step 5: Translations
- বাংলা ও English translations

---

## Security Considerations

| বিষয় | Implementation |
|-------|----------------|
| Admin Only | Edge function এ admin check |
| Email Validation | Valid email format check |
| Slug Uniqueness | DB constraint + error handling |
| Password Security | Crypto-secure random generation |
| Rate Limiting | Edge function এ rate limit |

---

## Expected Outcome

| ফিচার | বিবরণ |
|--------|-------|
| ✅ Platform শপ তৈরি | Admin যেকোনো email দিয়ে শপ তৈরি করতে পারবে |
| ✅ Auto User Creation | User না থাকলে auto create হবে |
| ✅ Auto Owner Assign | Email-এর owner হিসেবে `shop_members` entry |
| ✅ Plan Assignment | Selected plan অনুযায়ী subscription |
| ✅ Expiry Date | Duration অনুযায়ী `expires_at` set |
| ✅ Email Credentials | নতুন user হলে password সহ email |

