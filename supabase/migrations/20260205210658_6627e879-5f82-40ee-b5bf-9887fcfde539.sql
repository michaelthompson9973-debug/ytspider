-- Create shop_type enum
CREATE TYPE public.shop_type AS ENUM ('physical', 'digital');

-- Add new columns to shops table
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS shop_type shop_type NOT NULL DEFAULT 'physical',
ADD COLUMN IF NOT EXISTS business_category TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Add index for shop_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_shops_shop_type ON public.shops(shop_type);

-- Add columns to component_library for platform master library support
ALTER TABLE public.component_library
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS source_shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- Create index for platform components (where shop_id is null)
CREATE INDEX IF NOT EXISTS idx_component_library_platform ON public.component_library(shop_id) WHERE shop_id IS NULL;

-- Update RLS for component_library to allow reading platform components
DROP POLICY IF EXISTS "Shop members can manage components" ON public.component_library;
DROP POLICY IF EXISTS "Anyone can view platform components" ON public.component_library;

-- Policy: Anyone authenticated can view platform components (shop_id IS NULL and is_approved)
CREATE POLICY "Anyone can view platform components"
ON public.component_library
FOR SELECT
USING (
  (shop_id IS NULL AND is_approved = true) 
  OR has_shop_access(shop_id, 'editor'::text)
  OR is_admin()
);

-- Policy: Shop members can manage their own components
CREATE POLICY "Shop members can manage own components"
ON public.component_library
FOR ALL
USING (has_shop_access(shop_id, 'editor'::text))
WITH CHECK (has_shop_access(shop_id, 'editor'::text));

-- Policy: Admins can manage all components including platform library
CREATE POLICY "Admins can manage all components"
ON public.component_library
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());