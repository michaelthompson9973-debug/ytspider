-- Create table to store API settings
CREATE TABLE public.api_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text NOT NULL UNIQUE,
  key_value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage API settings
CREATE POLICY "Admins can view api_settings"
ON public.api_settings
FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can insert api_settings"
ON public.api_settings
FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update api_settings"
ON public.api_settings
FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete api_settings"
ON public.api_settings
FOR DELETE
USING (is_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_api_settings_updated_at
BEFORE UPDATE ON public.api_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();