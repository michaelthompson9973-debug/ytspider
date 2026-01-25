-- Drop existing api_settings table and recreate with multi-key support
DROP TABLE IF EXISTS public.api_settings;

-- Create new api_keys table for multiple API keys
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text NOT NULL DEFAULT 'Gemini API Key',
  key_value text NOT NULL,
  provider text NOT NULL DEFAULT 'gemini',
  status text NOT NULL DEFAULT 'active', -- active, rate_limited, invalid
  last_used_at timestamp with time zone,
  rate_limited_until timestamp with time zone,
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Only admins can manage API keys
CREATE POLICY "Admins can view api_keys"
ON public.api_keys
FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can insert api_keys"
ON public.api_keys
FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update api_keys"
ON public.api_keys
FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete api_keys"
ON public.api_keys
FOR DELETE
USING (is_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_api_keys_updated_at
BEFORE UPDATE ON public.api_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_api_keys_provider_status ON public.api_keys(provider, status);