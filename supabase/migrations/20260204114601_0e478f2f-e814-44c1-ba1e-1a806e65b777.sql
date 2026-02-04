-- ============================================
-- DYNAMIC BILLING & SHOP PURCHASE SYSTEM
-- ============================================

-- 1. PRICING PLANS TABLE
CREATE TABLE public.pricing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_en text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  description_en text,
  price_monthly numeric NOT NULL DEFAULT 0,
  price_yearly numeric,
  currency text NOT NULL DEFAULT 'BDT',
  duration_days integer NOT NULL DEFAULT 30,
  max_shops integer NOT NULL DEFAULT 1,
  max_orders_per_month integer,
  max_team_members integer NOT NULL DEFAULT 2,
  max_landing_pages integer NOT NULL DEFAULT 10,
  max_products integer NOT NULL DEFAULT 50,
  features jsonb DEFAULT '[]'::jsonb,
  stripe_price_id_monthly text,
  stripe_price_id_yearly text,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  is_contact_sales boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. SUBSCRIPTIONS TABLE
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  shop_id uuid REFERENCES public.shops(id) ON DELETE SET NULL,
  plan_id uuid NOT NULL REFERENCES public.pricing_plans(id),
  stripe_subscription_id text,
  stripe_customer_id text,
  payment_provider text DEFAULT 'stripe',
  status text NOT NULL DEFAULT 'active',
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  canceled_at timestamptz,
  amount_paid numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'BDT',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. PURCHASES TABLE
CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  phone text,
  full_name text,
  password_hash text,
  plan_id uuid NOT NULL REFERENCES public.pricing_plans(id),
  plan_snapshot jsonb NOT NULL,
  shop_name text NOT NULL,
  shop_slug text,
  payment_provider text NOT NULL DEFAULT 'stripe',
  payment_session_id text,
  payment_intent_id text,
  payment_status text DEFAULT 'pending',
  amount numeric NOT NULL,
  currency text DEFAULT 'BDT',
  user_id uuid,
  shop_id uuid REFERENCES public.shops(id),
  subscription_id uuid REFERENCES public.subscriptions(id),
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- 4. UPDATE SHOPS TABLE
ALTER TABLE public.shops 
  ADD COLUMN IF NOT EXISTS subscription_id uuid REFERENCES public.subscriptions(id),
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- 5. INDEXES
CREATE INDEX idx_pricing_plans_slug ON public.pricing_plans(slug);
CREATE INDEX idx_pricing_plans_active ON public.pricing_plans(is_active);
CREATE INDEX idx_pricing_plans_sort ON public.pricing_plans(sort_order);
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_shop ON public.subscriptions(shop_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_expires ON public.subscriptions(expires_at);
CREATE INDEX idx_purchases_email ON public.purchases(email);
CREATE INDEX idx_purchases_status ON public.purchases(payment_status);
CREATE INDEX idx_purchases_session ON public.purchases(payment_session_id);

-- 6. TRIGGERS
CREATE TRIGGER update_pricing_plans_updated_at
  BEFORE UPDATE ON public.pricing_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. RLS
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pricing plans"
  ON public.pricing_plans FOR SELECT
  USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage pricing plans"
  ON public.pricing_plans FOR ALL
  USING (is_admin());

CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Admins can manage all subscriptions"
  ON public.subscriptions FOR ALL
  USING (is_admin());

CREATE POLICY "Anyone can create purchases"
  ON public.purchases FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own purchases"
  ON public.purchases FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Admins can update purchases"
  ON public.purchases FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete purchases"
  ON public.purchases FOR DELETE
  USING (is_admin());

-- 8. INSERT DEFAULT PLANS
INSERT INTO public.pricing_plans (name, name_en, slug, description, description_en, price_monthly, price_yearly, duration_days, max_shops, max_orders_per_month, max_team_members, max_landing_pages, max_products, features, is_featured, is_contact_sales, sort_order)
VALUES 
  ('স্টার্টার', 'Starter', 'starter', 'ছোট ব্যবসার জন্য আদর্শ', 'Perfect for small businesses', 499, 4990, 30, 1, 100, 2, 10, 50, '["বেসিক সাপোর্ট", "ইমেইল নোটিফিকেশন"]'::jsonb, false, false, 1),
  ('প্রো', 'Pro', 'pro', 'বর্ধনশীল ব্যবসার জন্য', 'For growing businesses', 999, 9990, 30, 3, 500, 5, 50, 200, '["প্রায়োরিটি সাপোর্ট", "কাস্টম ব্র্যান্ডিং", "এনালিটিক্স ড্যাশবোর্ড", "এপিআই অ্যাক্সেস"]'::jsonb, true, false, 2),
  ('বিজনেস', 'Business', 'business', 'বড় টিমের জন্য', 'For larger teams', 1999, 19990, 30, 10, 2000, 15, 100, 500, '["প্রায়োরিটি সাপোর্ট", "কাস্টম ব্র্যান্ডিং", "এনালিটিক্স ড্যাশবোর্ড", "এপিআই অ্যাক্সেস", "হোয়াইটলেবেল", "কাস্টম ইন্টিগ্রেশন"]'::jsonb, false, false, 3),
  ('এন্টারপ্রাইজ', 'Enterprise', 'enterprise', 'বড় প্রতিষ্ঠানের জন্য কাস্টম সলিউশন', 'Custom solutions for large organizations', 4999, 49990, 30, 999999, 999999, 999999, 999999, 999999, '["ডেডিকেটেড সাপোর্ট", "কাস্টম SLA", "অ্যাকাউন্ট ম্যানেজার", "অন-প্রিমাইজ অপশন", "কাস্টম ডেভেলপমেন্ট"]'::jsonb, false, true, 4);