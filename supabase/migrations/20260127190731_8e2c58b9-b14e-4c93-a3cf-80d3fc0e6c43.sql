-- Drop old domain_mappings table if exists (it was using wrong design)
DROP TABLE IF EXISTS public.domain_mappings CASCADE;

-- Create new allowlist table
CREATE TABLE public.allowed_domains (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    domain text NOT NULL UNIQUE,
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_allowed_domains_domain ON public.allowed_domains(domain);
CREATE INDEX idx_allowed_domains_enabled ON public.allowed_domains(enabled);

-- Enable RLS
ALTER TABLE public.allowed_domains ENABLE ROW LEVEL SECURITY;

-- Admin full CRUD policy
CREATE POLICY "Admins can manage allowed_domains"
    ON public.allowed_domains FOR ALL
    USING (public.is_admin());

-- Public can read enabled domains only
CREATE POLICY "Public can view enabled domains"
    ON public.allowed_domains FOR SELECT
    USING (enabled = true);