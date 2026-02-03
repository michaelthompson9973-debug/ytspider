-- =====================================================
-- PHASE 1A: Create new enums and core tables
-- =====================================================

-- 1. Create shop_role enum for shop-specific roles
CREATE TYPE public.shop_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

-- 2. Create shop_plan enum
CREATE TYPE public.shop_plan AS ENUM ('free', 'pro', 'enterprise');

-- 3. Create shops table
CREATE TABLE public.shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  owner_id uuid NOT NULL,
  plan shop_plan NOT NULL DEFAULT 'free',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Create shop_members table (who can access which shop)
CREATE TABLE public.shop_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role shop_role NOT NULL DEFAULT 'viewer',
  invited_by uuid,
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(shop_id, user_id)
);

-- 5. Create indexes for performance
CREATE INDEX idx_shops_owner_id ON public.shops(owner_id);
CREATE INDEX idx_shops_slug ON public.shops(slug);
CREATE INDEX idx_shop_members_user_id ON public.shop_members(user_id);
CREATE INDEX idx_shop_members_shop_id ON public.shop_members(shop_id);

-- 6. Create has_shop_access function (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_shop_access(
  _shop_id uuid,
  _min_role text DEFAULT 'viewer'
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_role text;
  _role_hierarchy text[] := ARRAY['viewer', 'editor', 'admin', 'owner'];
  _min_index int;
  _user_index int;
BEGIN
  -- Get user's role in this shop
  SELECT role::text INTO _user_role
  FROM public.shop_members
  WHERE shop_id = _shop_id 
    AND user_id = auth.uid()
    AND accepted_at IS NOT NULL;
  
  IF _user_role IS NULL THEN
    -- Check if user is platform admin (existing is_admin check)
    IF public.is_admin() THEN
      RETURN true;
    END IF;
    RETURN false;
  END IF;
  
  -- Compare role hierarchy
  _min_index := array_position(_role_hierarchy, _min_role);
  _user_index := array_position(_role_hierarchy, _user_role);
  
  RETURN _user_index >= _min_index;
END;
$$;

-- 7. Create get_user_shops function
CREATE OR REPLACE FUNCTION public.get_user_shops()
RETURNS SETOF public.shops
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.*
  FROM public.shops s
  INNER JOIN public.shop_members sm ON sm.shop_id = s.id
  WHERE sm.user_id = auth.uid()
    AND sm.accepted_at IS NOT NULL
    AND s.is_active = true
  ORDER BY s.name;
$$;

-- 8. Create get_user_shop_role function
CREATE OR REPLACE FUNCTION public.get_user_shop_role(_shop_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM public.shop_members
  WHERE shop_id = _shop_id 
    AND user_id = auth.uid()
    AND accepted_at IS NOT NULL;
$$;

-- 9. Enable RLS on new tables
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_members ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies for shops table
CREATE POLICY "Users can view shops they are members of"
  ON public.shops FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shop_members
      WHERE shop_members.shop_id = shops.id
        AND shop_members.user_id = auth.uid()
        AND shop_members.accepted_at IS NOT NULL
    )
    OR public.is_admin()
  );

CREATE POLICY "Shop owners can update their shops"
  ON public.shops FOR UPDATE
  USING (public.has_shop_access(id, 'owner'));

CREATE POLICY "Authenticated users can create shops"
  ON public.shops FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Shop owners can delete their shops"
  ON public.shops FOR DELETE
  USING (owner_id = auth.uid() OR public.is_admin());

-- 11. RLS Policies for shop_members table
CREATE POLICY "Shop admins can view members"
  ON public.shop_members FOR SELECT
  USING (public.has_shop_access(shop_id, 'admin') OR user_id = auth.uid());

CREATE POLICY "Shop owners can manage members"
  ON public.shop_members FOR INSERT
  WITH CHECK (public.has_shop_access(shop_id, 'owner'));

CREATE POLICY "Shop owners can update members"
  ON public.shop_members FOR UPDATE
  USING (public.has_shop_access(shop_id, 'owner'));

CREATE POLICY "Shop owners can remove members"
  ON public.shop_members FOR DELETE
  USING (public.has_shop_access(shop_id, 'owner') OR user_id = auth.uid());

-- 12. Add updated_at trigger for shops
CREATE TRIGGER update_shops_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Add shop_id to all existing tables (nullable for now, will be required later)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE;
ALTER TABLE public.landing_pages ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE;
ALTER TABLE public.tracking_profiles ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE;
ALTER TABLE public.allowed_domains ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE;
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE;
ALTER TABLE public.courier_credentials ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE;
ALTER TABLE public.messenger_connections ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE;
ALTER TABLE public.component_library ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.shops(id) ON DELETE SET NULL;
ALTER TABLE public.customer_profiles ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE;
ALTER TABLE public.customer_labels ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE;
ALTER TABLE public.quick_replies ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE;
ALTER TABLE public.ai_training_data ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE;
ALTER TABLE public.auto_reply_rules ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE;
ALTER TABLE public.shop_settings ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE;
ALTER TABLE public.messenger_agents ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE;

-- 14. Create indexes for shop_id columns
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON public.products(shop_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_shop_id ON public.landing_pages(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON public.orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_media_shop_id ON public.media(shop_id);
CREATE INDEX IF NOT EXISTS idx_tracking_profiles_shop_id ON public.tracking_profiles(shop_id);
CREATE INDEX IF NOT EXISTS idx_allowed_domains_shop_id ON public.allowed_domains(shop_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_shop_id ON public.api_keys(shop_id);
CREATE INDEX IF NOT EXISTS idx_courier_credentials_shop_id ON public.courier_credentials(shop_id);
CREATE INDEX IF NOT EXISTS idx_messenger_connections_shop_id ON public.messenger_connections(shop_id);
CREATE INDEX IF NOT EXISTS idx_component_library_shop_id ON public.component_library(shop_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_shop_id ON public.customer_profiles(shop_id);
CREATE INDEX IF NOT EXISTS idx_customer_labels_shop_id ON public.customer_labels(shop_id);
CREATE INDEX IF NOT EXISTS idx_quick_replies_shop_id ON public.quick_replies(shop_id);
CREATE INDEX IF NOT EXISTS idx_ai_training_data_shop_id ON public.ai_training_data(shop_id);
CREATE INDEX IF NOT EXISTS idx_auto_reply_rules_shop_id ON public.auto_reply_rules(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_settings_shop_id ON public.shop_settings(shop_id);
CREATE INDEX IF NOT EXISTS idx_messenger_agents_shop_id ON public.messenger_agents(shop_id);

-- 15. Enable realtime for shops and shop_members
ALTER PUBLICATION supabase_realtime ADD TABLE public.shops;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_members;