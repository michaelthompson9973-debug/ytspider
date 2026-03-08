
-- =============================================
-- DELIVERABLE 1: Shop Status & Billing Lifecycle
-- =============================================

-- 1a. Create shop_status enum
CREATE TYPE public.shop_status AS ENUM ('active', 'grace_period', 'suspended', 'cancelled');

-- 1b. Add status column to shops table
ALTER TABLE public.shops 
  ADD COLUMN IF NOT EXISTS status public.shop_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS grace_period_ends_at timestamptz DEFAULT NULL;

-- 1c. Create is_shop_active() security definer function
-- This is the CORE gate for all write operations
CREATE OR REPLACE FUNCTION public.is_shop_active(_shop_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shops
    WHERE id = _shop_id
      AND status = 'active'
      AND is_active = true
  );
$$;

-- 1d. Create check_plan_quota() for Deliverable 2
-- Returns TRUE if the shop is WITHIN limits (can create more)
CREATE OR REPLACE FUNCTION public.check_plan_quota(
  _shop_id uuid,
  _resource_type text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _plan text;
  _current_count bigint;
  _max_limit int;
  _plan_row record;
BEGIN
  -- Get shop's current plan
  SELECT plan::text INTO _plan FROM public.shops WHERE id = _shop_id;
  IF _plan IS NULL THEN RETURN false; END IF;

  -- Get limits from pricing_plans table
  SELECT * INTO _plan_row FROM public.pricing_plans 
    WHERE slug = _plan AND is_active = true 
    ORDER BY created_at DESC LIMIT 1;

  -- Fallback defaults if no pricing_plans row
  IF _plan_row IS NULL THEN
    -- Use hardcoded free-tier defaults
    IF _resource_type = 'products' THEN _max_limit := 50;
    ELSIF _resource_type = 'landing_pages' THEN _max_limit := 10;
    ELSIF _resource_type = 'team_members' THEN _max_limit := 2;
    ELSE _max_limit := 999999;
    END IF;
  ELSE
    IF _resource_type = 'products' THEN _max_limit := _plan_row.max_products;
    ELSIF _resource_type = 'landing_pages' THEN _max_limit := _plan_row.max_landing_pages;
    ELSIF _resource_type = 'team_members' THEN _max_limit := _plan_row.max_team_members;
    ELSE _max_limit := 999999;
    END IF;
  END IF;

  -- If limit is NULL or very high, allow
  IF _max_limit IS NULL OR _max_limit >= 999999 THEN RETURN true; END IF;

  -- Count current usage
  IF _resource_type = 'products' THEN
    SELECT count(*) INTO _current_count FROM public.products WHERE shop_id = _shop_id;
  ELSIF _resource_type = 'landing_pages' THEN
    SELECT count(*) INTO _current_count FROM public.landing_pages WHERE shop_id = _shop_id;
  ELSIF _resource_type = 'team_members' THEN
    SELECT count(*) INTO _current_count FROM public.shop_members WHERE shop_id = _shop_id AND accepted_at IS NOT NULL;
  ELSE
    RETURN true;
  END IF;

  RETURN _current_count < _max_limit;
END;
$$;

-- =============================================
-- DELIVERABLE 3: Platform Settings Table
-- =============================================

-- 3a. Create platform_settings table (singleton pattern)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_mode boolean NOT NULL DEFAULT false,
  maintenance_message text DEFAULT NULL,
  global_announcement text DEFAULT NULL,
  announcement_type text DEFAULT 'info', -- info, warning, critical
  announcement_active boolean NOT NULL DEFAULT false,
  default_theme jsonb DEFAULT '{}'::jsonb,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3b. Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- 3c. RLS: Anyone can read (needed for maintenance mode check)
CREATE POLICY "Anyone can view platform settings"
  ON public.platform_settings FOR SELECT
  USING (true);

-- 3d. RLS: Only platform admins can modify
CREATE POLICY "Platform admins can manage settings"
  ON public.platform_settings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================
-- QUOTA ENFORCEMENT VIA RLS (Deliverable 2)
-- =============================================

-- Products INSERT: check shop is active AND within quota
CREATE POLICY "Quota check on product insert"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_shop_active(shop_id)
    AND public.check_plan_quota(shop_id, 'products')
  );

-- Landing Pages INSERT: check shop is active AND within quota
CREATE POLICY "Quota check on landing page insert"
  ON public.landing_pages FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_shop_active(shop_id)
    AND public.check_plan_quota(shop_id, 'landing_pages')
  );

-- Shop Members INSERT: check shop is active AND within quota
CREATE POLICY "Quota check on team member insert"
  ON public.shop_members FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_shop_active(shop_id)
    AND public.check_plan_quota(shop_id, 'team_members')
  );

-- Block all writes on suspended shops for orders table
CREATE POLICY "Block orders on inactive shops"
  ON public.orders FOR INSERT
  WITH CHECK (
    public.is_shop_active(shop_id)
  );
