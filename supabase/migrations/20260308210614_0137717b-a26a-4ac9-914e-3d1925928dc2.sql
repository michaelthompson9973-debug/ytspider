
-- 1. Add min_plan_tier column for monetization gating
ALTER TABLE public.component_library 
  ADD COLUMN IF NOT EXISTS min_plan_tier text NOT NULL DEFAULT 'free';

-- 2. Drop the existing SELECT policy that has incorrect logic
DROP POLICY IF EXISTS "Anyone can view platform components" ON public.component_library;

-- 3. Create corrected SELECT policy:
--    - Platform globals (shop_id IS NULL) → visible to all authenticated users
--    - Shop-owned components → visible ONLY to that shop's editors+
--    - Admins see everything
CREATE POLICY "Authenticated users can view platform components"
  ON public.component_library
  FOR SELECT
  TO authenticated
  USING (
    (shop_id IS NULL)
    OR has_shop_access(shop_id, 'editor'::text)
    OR is_admin()
  );
