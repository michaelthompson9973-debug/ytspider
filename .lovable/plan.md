

# ডায়নামিক বিলিং ও শপ পারচেজ সিস্টেম

## আপনার প্রয়োজনীয়তা সারাংশ

| বিষয় | বিবরণ |
|-------|-------|
| Admin ভূমিকা | প্রাইসিং প্ল্যান/প্যাকেজ তৈরি ও ম্যানেজ করা |
| Public প্রাইসিং | `/pricing` পেজে প্ল্যান দেখানো |
| পেমেন্ট | Stripe/SSLCommerz দিয়ে পেমেন্ট |
| অটো শপ তৈরি | পেমেন্ট সফল হলে শপ + credential স্বয়ংক্রিয় তৈরি |
| Email Credential | ক্রেতার ইমেইলে লগইন credential পাঠানো |
| Limited Access | নির্বাচিত সময় পর্যন্ত শপ অ্যাক্সেস (1 মাস/1 বছর) |

---

## সিস্টেম আর্কিটেকচার

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  ADMIN PANEL (/admin/platform/pricing)                                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                                      │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ প্রাইসিং প্ল্যান ম্যানেজ করুন                                         │   │
│  │                                                                       │   │
│  │ [+ নতুন প্ল্যান যোগ করুন]                                             │   │
│  │                                                                       │   │
│  │ ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────────────┐ │   │
│  │ │ স্টার্টার   │  │ প্রো       │  │ বিজনেস     │  │ এন্টারপ্রাইজ     │ │   │
│  │ │ ৳৪৯৯/মাস  │  │ ৳৯৯৯/মাস │  │ ৳১৯৯৯/মাস │  │ ৳৪৯৯৯/মাস       │ │   │
│  │ │ ৩০ দিন    │  │ ৩০ দিন    │  │ ৩০ দিন    │  │ ৩০ দিন         │ │   │
│  │ │ [Edit]     │  │ [Edit]     │  │ [Edit]     │  │ [Edit]          │ │   │
│  │ └────────────┘  └────────────┘  └────────────┘  └──────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ (DB-তে সেভ)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PUBLIC PRICING PAGE (/pricing)                                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                                              │
│                                                                              │
│  🚀 আপনার ব্যবসার জন্য সেরা প্ল্যান বেছে নিন                                 │
│                                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────────────┐       │
│  │ স্টার্টার   │  │ ⭐ প্রো     │  │ বিজনেস     │  │ এন্টারপ্রাইজ     │       │
│  │ ৳৪৯৯/মাস  │  │ ৳৯৯৯/মাস │  │ ৳১৯৯৯/মাস │  │ ৳৪৯৯৯/মাস       │       │
│  │            │  │ জনপ্রিয়   │  │            │  │                  │       │
│  │ ✓ ১ শপ    │  │ ✓ ৩ শপ    │  │ ✓ ১০ শপ   │  │ ✓ আনলিমিটেড     │       │
│  │ ✓ ১০০ অর্ডার│  │ ✓ ৫০০ অর্ডার│  │ ✓ ২০০০    │  │ ✓ আনলিমিটেড     │       │
│  │ ✓ ২ মেম্বার │  │ ✓ ৫ মেম্বার │  │ ✓ ১৫ মেম্বার│  │ ✓ আনলিমিটেড     │       │
│  │            │  │            │  │            │  │                  │       │
│  │ [কিনুন]    │  │ [কিনুন]    │  │ [কিনুন]    │  │ [যোগাযোগ]       │       │
│  └────────────┘  └────────────┘  └────────────┘  └──────────────────┘       │
│                                                                              │
│  ✅ ৭ দিনের মানি-ব্যাক গ্যারান্টি                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ (কিনুন ক্লিক)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  CHECKOUT PAGE (/checkout?plan=pro)                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                                           │
│                                                                              │
│  💳 অর্ডার সম্পন্ন করুন                                                       │
│                                                                              │
│  ┌────────────────────────────────┐  ┌───────────────────────────────────┐  │
│  │ আপনার তথ্য                     │  │ অর্ডার সামারি                      │  │
│  │                                │  │                                   │  │
│  │ পুরো নাম *                      │  │ প্রো প্ল্যান                       │  │
│  │ [আপনার নাম]                    │  │ ৩০ দিনের সাবস্ক্রিপশন             │  │
│  │                                │  │                                   │  │
│  │ ইমেইল *                         │  │ মূল্য: ৳৯৯৯                       │  │
│  │ [email@example.com]            │  │ ────────────────────              │  │
│  │                                │  │ মোট: ৳৯৯৯                         │  │
│  │ ফোন *                          │  │                                   │  │
│  │ [01XXXXXXXXX]                  │  │ ✅ ৭ দিনের মানি-ব্যাক             │  │
│  │                                │  │                                   │  │
│  │ পাসওয়ার্ড *                     │  └───────────────────────────────────┘  │
│  │ [••••••••]                     │                                        │
│  │                                │                                        │
│  │ শপের নাম *                      │                                        │
│  │ [আমার শপ]                      │                                        │
│  │                                │                                        │
│  │ [পেমেন্ট করুন - ৳৯৯৯]          │                                        │
│  └────────────────────────────────┘                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ (Stripe/SSLCommerz Checkout)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  WEBHOOK PROCESSING (Edge Function)                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                                          │
│                                                                              │
│  ১. পেমেন্ট সফল → Webhook receive                                            │
│  ২. User account create (if new)                                            │
│  ৩. Shop create with plan                                                   │
│  ৪. Subscription create                                                     │
│  ৫. shop_members entry (owner)                                              │
│  ৬. Email send with credentials                                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  EMAIL TO BUYER                                                              │
│  ━━━━━━━━━━━━━━━                                                              │
│                                                                              │
│  Subject: 🎉 আপনার শপ তৈরি হয়েছে!                                            │
│                                                                              │
│  প্রিয় গ্রাহক,                                                               │
│                                                                              │
│  অভিনন্দন! আপনার "আমার শপ" সফলভাবে তৈরি হয়েছে।                             │
│                                                                              │
│  📧 লগইন করুন:                                                               │
│  URL: https://app.ytspider.com/auth                                         │
│  Email: buyer@example.com                                                   │
│  Password: [auto-generated অথবা user-provided]                              │
│                                                                              │
│  📅 সাবস্ক্রিপশন মেয়াদ: ৪ ফেব্রুয়ারি ২০২৬ - ৪ মার্চ ২০২৬                     │
│  📦 প্ল্যান: প্রো                                                              │
│                                                                              │
│  [শপে লগইন করুন]                                                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  BUYER ACCESS SHOP                                                           │
│  ━━━━━━━━━━━━━━━━━                                                            │
│                                                                              │
│  ✅ Buyer logs in with email/password                                        │
│  ✅ Sees their purchased shop                                                │
│  ✅ Access valid until subscription expires                                  │
│  ⚠️ Expired → Show renewal prompt                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ডাটাবেস পরিবর্তন

### নতুন টেবিল: `pricing_plans` (Admin-managed)

```sql
CREATE TABLE public.pricing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Plan Details
  name text NOT NULL,                    -- "স্টার্টার", "প্রো", etc.
  name_en text NOT NULL,                 -- "Starter", "Pro", etc.
  slug text NOT NULL UNIQUE,             -- "starter", "pro", etc.
  description text,                      -- বাংলা বিবরণ
  description_en text,                   -- English description
  
  -- Pricing
  price_monthly numeric NOT NULL,        -- ৳৯৯৯
  price_yearly numeric,                  -- ৳৯,৯৯০ (optional)
  currency text DEFAULT 'BDT',
  
  -- Duration
  duration_days integer NOT NULL DEFAULT 30, -- 30, 90, 365
  
  -- Limits
  max_shops integer NOT NULL DEFAULT 1,
  max_orders_per_month integer,           -- NULL = unlimited
  max_team_members integer NOT NULL DEFAULT 2,
  max_landing_pages integer NOT NULL DEFAULT 10,
  max_products integer NOT NULL DEFAULT 50,
  
  -- Features (JSON for flexibility)
  features jsonb DEFAULT '[]'::jsonb,    -- ["প্রায়োরিটি সাপোর্ট", "কাস্টম ব্র্যান্ডিং"]
  
  -- Stripe Integration (optional)
  stripe_price_id_monthly text,
  stripe_price_id_yearly text,
  
  -- Display
  is_featured boolean DEFAULT false,     -- "সবচেয়ে জনপ্রিয়" badge
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pricing plans"
  ON public.pricing_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage pricing plans"
  ON public.pricing_plans FOR ALL
  USING (is_admin());
```

### নতুন টেবিল: `subscriptions`

```sql
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id uuid REFERENCES public.shops(id) ON DELETE SET NULL,
  plan_id uuid NOT NULL REFERENCES public.pricing_plans(id),
  
  -- Payment Details
  stripe_subscription_id text,
  stripe_customer_id text,
  payment_provider text DEFAULT 'stripe', -- 'stripe', 'sslcommerz', 'manual'
  
  -- Status
  status text NOT NULL DEFAULT 'active',
  -- 'pending', 'active', 'past_due', 'canceled', 'expired'
  
  -- Dates
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  canceled_at timestamptz,
  
  -- Billing
  amount_paid numeric NOT NULL,
  currency text DEFAULT 'BDT',
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all subscriptions"
  ON public.subscriptions FOR ALL
  USING (is_admin());
```

### নতুন টেবিল: `purchases` (Order/Transaction log)

```sql
CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Buyer Info (may not have account yet)
  email text NOT NULL,
  phone text,
  full_name text,
  
  -- Plan
  plan_id uuid NOT NULL REFERENCES public.pricing_plans(id),
  plan_snapshot jsonb NOT NULL, -- Store plan details at time of purchase
  
  -- Shop to create
  shop_name text NOT NULL,
  shop_slug text,
  
  -- Payment
  payment_provider text NOT NULL, -- 'stripe', 'sslcommerz'
  payment_intent_id text,
  payment_status text DEFAULT 'pending',
  -- 'pending', 'processing', 'completed', 'failed', 'refunded'
  
  amount numeric NOT NULL,
  currency text DEFAULT 'BDT',
  
  -- Result
  user_id uuid REFERENCES auth.users(id),
  shop_id uuid REFERENCES public.shops(id),
  subscription_id uuid REFERENCES public.subscriptions(id),
  
  -- Tracking
  ip_address text,
  user_agent text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- RLS - purchases need special handling
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Allow insert from public (checkout form)
CREATE POLICY "Anyone can create purchases"
  ON public.purchases FOR INSERT
  WITH CHECK (true);

-- Only admins or the owner can view
CREATE POLICY "Users can view own purchases"
  ON public.purchases FOR SELECT
  USING (email = current_user_email() OR is_admin());

CREATE POLICY "Admins can update purchases"
  ON public.purchases FOR UPDATE
  USING (is_admin());
```

### shops টেবিল আপডেট

```sql
ALTER TABLE public.shops 
  ADD COLUMN subscription_id uuid REFERENCES public.subscriptions(id),
  ADD COLUMN expires_at timestamptz;
```

---

## Edge Functions

### ১. `create-checkout-session`
Stripe Checkout Session তৈরি করে

```typescript
// POST /create-checkout-session
// Body: { 
//   plan_id: uuid,
//   shop_name: string,
//   email: string,
//   full_name: string,
//   phone?: string,
//   password?: string (if new user)
// }
// Returns: { url: string, purchase_id: string }
```

### ২. `payment-webhook`
Stripe/SSLCommerz webhook handler

```typescript
// POST /payment-webhook
// Handles:
// - checkout.session.completed
// - invoice.paid
// - customer.subscription.updated
// - customer.subscription.deleted

// On success:
// 1. Create user account (if new)
// 2. Create shop
// 3. Create subscription
// 4. Add shop_member (owner)
// 5. Update purchase record
// 6. Send welcome email with credentials
```

### ৩. `send-credentials-email`
Resend দিয়ে credential email পাঠায়

```typescript
// POST /send-credentials-email
// Body: { 
//   email: string,
//   shop_name: string,
//   password: string,
//   plan_name: string,
//   expires_at: string
// }
```

### ৪. `check-subscription-expiry` (Cron)
প্রতিদিন expired subscriptions চেক করে

```typescript
// Cron: every day at midnight
// - Find expired subscriptions
// - Update status to 'expired'
// - Optionally send reminder emails
```

---

## নতুন পেজ ও কম্পোনেন্ট

### Admin Pages

```text
src/pages/admin/
└── PricingPlans.tsx        # Pricing plans CRUD
```

### Public Pages

```text
src/pages/
├── Pricing.tsx             # Public pricing page
├── Checkout.tsx            # Checkout form (no login required)
└── PurchaseSuccess.tsx     # After successful payment
```

### Components

```text
src/components/
├── admin/
│   └── pricing/
│       ├── PlanForm.tsx           # Create/Edit plan form
│       ├── PlanCard.tsx           # Admin plan card with edit/delete
│       ├── FeaturesEditor.tsx     # Features list editor
│       └── index.ts
│
└── pricing/
    ├── PublicPricingCard.tsx      # Public-facing plan card
    ├── CheckoutForm.tsx           # Buyer info + shop name form
    ├── PricingHero.tsx            # Hero section
    ├── PricingFAQ.tsx             # FAQ accordion
    └── index.ts
```

---

## ফাইল পরিবর্তন তালিকা

### নতুন ফাইল তৈরি:

| ফাইল | উদ্দেশ্য |
|------|----------|
| `src/pages/admin/PricingPlans.tsx` | Admin pricing management |
| `src/pages/Pricing.tsx` | Public pricing page |
| `src/pages/Checkout.tsx` | Checkout page |
| `src/pages/PurchaseSuccess.tsx` | Success page |
| `src/components/admin/pricing/PlanForm.tsx` | Plan create/edit form |
| `src/components/admin/pricing/PlanCard.tsx` | Admin plan card |
| `src/components/pricing/PublicPricingCard.tsx` | Public plan card |
| `src/components/pricing/CheckoutForm.tsx` | Checkout form |
| `src/hooks/usePricingPlans.ts` | Fetch pricing plans hook |
| `supabase/functions/create-checkout-session/index.ts` | Stripe checkout |
| `supabase/functions/payment-webhook/index.ts` | Payment webhook |
| `supabase/functions/send-credentials-email/index.ts` | Email sending |

### আপডেট করা ফাইল:

| ফাইল | পরিবর্তন |
|------|---------|
| `src/App.tsx` | নতুন routes যোগ |
| `src/locales/bn.ts` | Pricing translations |
| `src/locales/en.ts` | Pricing translations |
| `src/components/admin/AdminSidebar.tsx` | Pricing Plans মেনু যোগ |
| `src/contexts/ShopContext.tsx` | Subscription expiry check |

---

## Subscription Expiry Flow

```text
┌─────────────────────────────────────────────────────────────┐
│ User logs in                                                 │
│                                                              │
│     ▼                                                        │
│ Check shop.expires_at                                        │
│                                                              │
│     ├── expires_at > now() → ✅ Normal access                │
│     │                                                        │
│     └── expires_at <= now() → ⚠️ Expired                     │
│                  │                                           │
│                  ▼                                           │
│         Show Renewal Modal                                   │
│         ┌─────────────────────────────────────┐             │
│         │ ⚠️ আপনার সাবস্ক্রিপশন শেষ হয়ে গেছে │             │
│         │                                     │             │
│         │ মেয়াদ শেষ: ৪ মার্চ ২০২৬             │             │
│         │                                     │             │
│         │ [রিনিউ করুন - ৳৯৯৯]                 │             │
│         └─────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

---

## Admin Pricing UI Design

### `/admin/platform/pricing` - Pricing Plans Management

```text
+------------------------------------------------------------------+
| 💰 প্রাইসিং প্ল্যান                                                |
| আপনার প্ল্যান ও প্যাকেজ ম্যানেজ করুন                               |
|                                                   [+ নতুন প্ল্যান] |
+------------------------------------------------------------------+
|                                                                    |
|  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐   |
|  │ 📦 স্টার্টার    │  │ ⭐ প্রো         │  │ 🏢 এন্টারপ্রাইজ    │   |
|  │                │  │ 🔥 জনপ্রিয়     │  │                    │   |
|  │ ৳৪৯৯/মাস      │  │ ৳৯৯৯/মাস      │  │ ৳৪৯৯৯/মাস         │   |
|  │ ৩০ দিন        │  │ ৩০ দিন        │  │ ৩০ দিন            │   |
|  │                │  │                │  │                    │   |
|  │ • ১ শপ        │  │ • ৩ শপ        │  │ • আনলিমিটেড শপ    │   |
|  │ • ১০০ অর্ডার  │  │ • ৫০০ অর্ডার  │  │ • আনলিমিটেড       │   |
|  │ • ২ মেম্বার    │  │ • ৫ মেম্বার    │  │ • আনলিমিটেড       │   |
|  │                │  │                │  │                    │   |
|  │ 🟢 সক্রিয়      │  │ 🟢 সক্রিয়      │  │ 🟢 সক্রিয়          │   |
|  │                │  │                │  │                    │   |
|  │ [Edit] [❌]    │  │ [Edit] [❌]    │  │ [Edit] [❌]        │   |
|  └────────────────┘  └────────────────┘  └────────────────────┘   |
|                                                                    |
+------------------------------------------------------------------+
| 📊 সাবস্ক্রিপশন স্ট্যাটস                                           |
| ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              |
| │ ১২৫     │ │ ৮৭      │ │ ৩৮      │ │ ৳১,২৫,০০০│              |
| │ মোট      │ │ সক্রিয়   │ │ মেয়াদোত্তীর্ণ│ │ এই মাসের আয় │              |
| └──────────┘ └──────────┘ └──────────┘ └──────────┘              |
+------------------------------------------------------------------+
```

### Plan Create/Edit Modal

```text
+------------------------------------------------------------------+
| ✏️ প্ল্যান এডিট করুন                                               |
+------------------------------------------------------------------+
|                                                                    |
|  প্ল্যানের নাম (বাংলা) *          প্ল্যানের নাম (English) *         |
|  [প্রো]                          [Pro]                            |
|                                                                    |
|  Slug *                          মূল্য (মাসিক) *                    |
|  [pro]                           [৳ 999]                          |
|                                                                    |
|  মেয়াদ *                                                          |
|  (○) ৩০ দিন  (●) ৯০ দিন  (○) ১ বছর  (○) কাস্টম: [__] দিন          |
|                                                                    |
|  ─────────────────────────────────────────────────────            |
|  📦 লিমিটস                                                         |
|  ─────────────────────────────────────────────────────            |
|                                                                    |
|  শপ সংখ্যা            অর্ডার/মাস           টিম মেম্বার              |
|  [3]                  [500]                [5]                    |
|  [ ] আনলিমিটেড        [ ] আনলিমিটেড        [ ] আনলিমিটেড          |
|                                                                    |
|  ল্যান্ডিং পেজ          প্রোডাক্ট                                    |
|  [100]                [500]                                       |
|  [ ] আনলিমিটেড        [ ] আনলিমিটেড                               |
|                                                                    |
|  ─────────────────────────────────────────────────────            |
|  ✨ ফিচারস                                                         |
|  ─────────────────────────────────────────────────────            |
|                                                                    |
|  [+ ফিচার যোগ করুন]                                               |
|  ✓ প্রায়োরিটি সাপোর্ট                               [🗑️]         |
|  ✓ কাস্টম ব্র্যান্ডিং                                [🗑️]         |
|  ✓ এনালিটিক্স ড্যাশবোর্ড                            [🗑️]         |
|                                                                    |
|  ─────────────────────────────────────────────────────            |
|                                                                    |
|  [☑️] সক্রিয়              [☐] সবচেয়ে জনপ্রিয় ব্যাজ               |
|                                                                    |
|  [বাতিল]                              [সেভ করুন]                  |
+------------------------------------------------------------------+
```

---

## প্রয়োজনীয় Secrets

| Secret Name | উদ্দেশ্য |
|-------------|----------|
| `STRIPE_SECRET_KEY` | Stripe API access |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification |
| `RESEND_API_KEY` | Email sending |

---

## Implementation Steps

### Phase 1: Database (Day 1)
1. `pricing_plans` টেবিল তৈরি
2. `subscriptions` টেবিল তৈরি
3. `purchases` টেবিল তৈরি
4. `shops` টেবিল আপডেট
5. RLS policies
6. Default plans insert

### Phase 2: Admin UI (Day 1-2)
1. `/admin/platform/pricing` পেজ
2. Plan CRUD UI
3. Features editor
4. Subscription stats

### Phase 3: Public Pricing (Day 2)
1. `/pricing` পেজ
2. Dynamic plan cards
3. বাংলা/English translations

### Phase 4: Checkout Flow (Day 2-3)
1. `/checkout` পেজ
2. Stripe checkout session
3. Edge function

### Phase 5: Webhook & Email (Day 3)
1. Payment webhook handler
2. User + Shop creation
3. Credential email with Resend
4. Success page

### Phase 6: Expiry & Renewal (Day 3-4)
1. Subscription expiry check
2. Renewal modal
3. Grace period handling

---

## বাংলা Translations

```typescript
pricing: {
  // Admin
  title: 'প্রাইসিং প্ল্যান',
  subtitle: 'আপনার প্ল্যান ও প্যাকেজ ম্যানেজ করুন',
  addPlan: 'নতুন প্ল্যান যোগ করুন',
  editPlan: 'প্ল্যান এডিট করুন',
  deletePlan: 'প্ল্যান ডিলিট করুন',
  planName: 'প্ল্যানের নাম',
  price: 'মূল্য',
  duration: 'মেয়াদ',
  durationDays: 'দিন',
  limits: 'লিমিটস',
  features: 'ফিচারস',
  addFeature: 'ফিচার যোগ করুন',
  isActive: 'সক্রিয়',
  isFeatured: 'সবচেয়ে জনপ্রিয় ব্যাজ',
  
  // Public
  heroTitle: 'আপনার ব্যবসার জন্য সেরা প্ল্যান বেছে নিন',
  heroSubtitle: '৭ দিনের মানি-ব্যাক গ্যারান্টি',
  buyNow: 'কিনুন',
  contactSales: 'যোগাযোগ করুন',
  perMonth: '/মাস',
  perYear: '/বছর',
  unlimited: 'আনলিমিটেড',
  mostPopular: 'সবচেয়ে জনপ্রিয়',
  
  // Checkout
  checkout: 'চেকআউট',
  yourInfo: 'আপনার তথ্য',
  fullName: 'পুরো নাম',
  email: 'ইমেইল',
  phone: 'ফোন',
  password: 'পাসওয়ার্ড',
  shopName: 'শপের নাম',
  orderSummary: 'অর্ডার সামারি',
  total: 'মোট',
  proceedPayment: 'পেমেন্ট করুন',
  
  // Success
  successTitle: '🎉 অভিনন্দন!',
  successMessage: 'আপনার শপ সফলভাবে তৈরি হয়েছে',
  checkEmail: 'আপনার ইমেইলে লগইন তথ্য পাঠানো হয়েছে',
  loginNow: 'এখনই লগইন করুন',
  
  // Stats
  totalSubscriptions: 'মোট সাবস্ক্রিপশন',
  activeSubscriptions: 'সক্রিয় সাবস্ক্রিপশন',
  expiredSubscriptions: 'মেয়াদোত্তীর্ণ',
  thisMonthRevenue: 'এই মাসের আয়',
  
  // Expiry
  subscriptionExpired: 'আপনার সাবস্ক্রিপশন শেষ হয়ে গেছে',
  expiresOn: 'মেয়াদ শেষ',
  renewNow: 'রিনিউ করুন',
}
```

---

## Route Updates

```tsx
// src/App.tsx - নতুন routes
<Route path="/pricing" element={<Pricing />} />
<Route path="/checkout" element={<Checkout />} />
<Route path="/purchase-success" element={<PurchaseSuccess />} />

// Admin route
<Route path="/admin/platform/pricing" element={
  <ProtectedRoute requireAdmin>
    <PricingPlans />
  </ProtectedRoute>
} />
```

---

## Expected Outcome

| ফিচার | বিবরণ |
|--------|-------|
| ✅ Admin Plan Creation | Admin নিজে প্ল্যান তৈরি/এডিট করতে পারবে |
| ✅ Dynamic Public Pricing | Database থেকে প্ল্যান দেখাবে |
| ✅ No Login Required | Checkout এ লগইন ছাড়াই কেনা যাবে |
| ✅ Auto Account Creation | পেমেন্টের পর অটো account তৈরি |
| ✅ Auto Shop Creation | পেমেন্টের পর অটো shop তৈরি |
| ✅ Email Credentials | ইমেইলে লগইন তথ্য পাঠাবে |
| ✅ Time-Limited Access | নির্দিষ্ট সময় পর্যন্ত অ্যাক্সেস |
| ✅ Renewal Flow | মেয়াদ শেষে রিনিউ অপশন |

