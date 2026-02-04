-- ============================================
-- Phase 1: Enterprise Multi-Tenant Shop System
-- ============================================

-- 1. Add new roles to shop_role enum
ALTER TYPE shop_role ADD VALUE IF NOT EXISTS 'manager' BEFORE 'editor';
ALTER TYPE shop_role ADD VALUE IF NOT EXISTS 'support' AFTER 'editor';

-- 2. Create shop_theme table for per-shop theming
CREATE TABLE public.shop_theme (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  preset text NOT NULL DEFAULT 'default',
  colors jsonb NOT NULL DEFAULT '{}'::jsonb,
  mode text NOT NULL DEFAULT 'light',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(shop_id)
);

-- Enable RLS on shop_theme
ALTER TABLE public.shop_theme ENABLE ROW LEVEL SECURITY;

-- RLS policies for shop_theme
CREATE POLICY "Shop members can view theme"
  ON public.shop_theme FOR SELECT
  USING (has_shop_access(shop_id, 'viewer'));

CREATE POLICY "Shop admins can insert theme"
  ON public.shop_theme FOR INSERT
  WITH CHECK (has_shop_access(shop_id, 'admin'));

CREATE POLICY "Shop admins can update theme"
  ON public.shop_theme FOR UPDATE
  USING (has_shop_access(shop_id, 'admin'));

CREATE POLICY "Shop admins can delete theme"
  ON public.shop_theme FOR DELETE
  USING (has_shop_access(shop_id, 'admin'));

-- 3. Create shop_invitations table
CREATE TABLE public.shop_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  email text NOT NULL,
  role shop_role NOT NULL DEFAULT 'viewer',
  token text NOT NULL UNIQUE,
  invited_by uuid NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on shop_invitations
ALTER TABLE public.shop_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for shop_invitations
CREATE POLICY "Shop admins can view invitations"
  ON public.shop_invitations FOR SELECT
  USING (has_shop_access(shop_id, 'admin'));

CREATE POLICY "Shop admins can create invitations"
  ON public.shop_invitations FOR INSERT
  WITH CHECK (has_shop_access(shop_id, 'admin'));

CREATE POLICY "Shop admins can update invitations"
  ON public.shop_invitations FOR UPDATE
  USING (has_shop_access(shop_id, 'admin'));

CREATE POLICY "Shop admins can delete invitations"
  ON public.shop_invitations FOR DELETE
  USING (has_shop_access(shop_id, 'admin'));

-- Allow public to view invitation by token (for accept-invite page)
CREATE POLICY "Anyone can view invitation by token"
  ON public.shop_invitations FOR SELECT
  USING (true);

-- 4. Create shop_activity_log table
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
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on shop_activity_log
ALTER TABLE public.shop_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for shop_activity_log
CREATE POLICY "Shop admins can view activity log"
  ON public.shop_activity_log FOR SELECT
  USING (has_shop_access(shop_id, 'admin'));

CREATE POLICY "Shop members can insert activity log"
  ON public.shop_activity_log FOR INSERT
  WITH CHECK (has_shop_access(shop_id, 'viewer'));

-- Create indexes for activity log
CREATE INDEX idx_shop_activity_shop ON public.shop_activity_log(shop_id);
CREATE INDEX idx_shop_activity_user ON public.shop_activity_log(user_id);
CREATE INDEX idx_shop_activity_created ON public.shop_activity_log(created_at DESC);
CREATE INDEX idx_shop_activity_entity ON public.shop_activity_log(entity_type, entity_id);

-- 5. Update has_shop_access function to include new roles
CREATE OR REPLACE FUNCTION public.has_shop_access(_shop_id uuid, _min_role text DEFAULT 'viewer'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _user_role text;
  _role_hierarchy text[] := ARRAY['viewer', 'support', 'editor', 'manager', 'admin', 'owner'];
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
$function$;

-- 6. Create trigger for shop_theme updated_at
CREATE TRIGGER update_shop_theme_updated_at
  BEFORE UPDATE ON public.shop_theme
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Enable realtime for activity log
ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_activity_log;