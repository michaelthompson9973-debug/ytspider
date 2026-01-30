-- Create courier_credentials table for storing API keys and OAuth tokens
CREATE TABLE public.courier_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('steadfast', 'pathao')),
  credential_type TEXT NOT NULL,
  credential_value TEXT NOT NULL,
  label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  access_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pathao_locations table for caching cities/zones/areas
CREATE TABLE public.pathao_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id INTEGER,
  city_name TEXT,
  zone_id INTEGER,
  zone_name TEXT,
  area_id INTEGER,
  area_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(city_id, zone_id, area_id)
);

-- Enable RLS on both tables
ALTER TABLE public.courier_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pathao_locations ENABLE ROW LEVEL SECURITY;

-- RLS policies for courier_credentials - Admin only
CREATE POLICY "Admins can view courier_credentials"
  ON public.courier_credentials
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert courier_credentials"
  ON public.courier_credentials
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update courier_credentials"
  ON public.courier_credentials
  FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete courier_credentials"
  ON public.courier_credentials
  FOR DELETE
  USING (is_admin());

-- RLS policies for pathao_locations - Admin can manage, public can view
CREATE POLICY "Anyone can view pathao_locations"
  ON public.pathao_locations
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert pathao_locations"
  ON public.pathao_locations
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update pathao_locations"
  ON public.pathao_locations
  FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete pathao_locations"
  ON public.pathao_locations
  FOR DELETE
  USING (is_admin());

-- Add trigger for updated_at on courier_credentials
CREATE TRIGGER update_courier_credentials_updated_at
  BEFORE UPDATE ON public.courier_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();