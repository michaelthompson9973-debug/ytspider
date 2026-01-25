-- ============================================
-- YTSPIDER MASTER MIGRATION
-- Run this file to create the full database schema
-- ============================================

-- ============================================
-- 1. ENUMS
-- ============================================

CREATE TYPE public.app_role AS ENUM ('admin');
CREATE TYPE public.order_status AS ENUM ('new', 'confirmed', 'shipped', 'cancelled');

-- ============================================
-- 2. FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;

-- ============================================
-- 3. TABLES
-- ============================================

-- User Roles Table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Products Table
CREATE TABLE public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    price numeric NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    images text[] DEFAULT '{}'::text[],
    videos text[] DEFAULT '{}'::text[],
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Landing Pages Table
CREATE TABLE public.landing_pages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
    html_content text NOT NULL DEFAULT '',
    gtm_id text,
    published boolean NOT NULL DEFAULT false,
    created_by uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Orders Table
CREATE TABLE public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
    landing_page_id uuid REFERENCES public.landing_pages(id) ON DELETE SET NULL,
    customer_name text NOT NULL,
    customer_phone text NOT NULL,
    customer_address text NOT NULL,
    customer_city text NOT NULL,
    status public.order_status NOT NULL DEFAULT 'new',
    ip_address text,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    utm_term text,
    utm_content text,
    event_id text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Media Table
CREATE TABLE public.media (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_type text NOT NULL,
    file_size integer,
    folder text DEFAULT 'root',
    public_url text,
    uploaded_by uuid,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Conversion Events Table
CREATE TABLE public.conversion_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    platform text NOT NULL,
    event_id text NOT NULL,
    event_name text NOT NULL,
    response_status integer,
    response_body text,
    sent_at timestamptz NOT NULL DEFAULT now()
);

-- Webhooks Table
CREATE TABLE public.webhooks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type text NOT NULL,
    url text NOT NULL,
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Domain Mappings Table
CREATE TABLE public.domain_mappings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    domain text NOT NULL UNIQUE,
    landing_page_id uuid NOT NULL REFERENCES public.landing_pages(id) ON DELETE CASCADE,
    is_primary boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- 4. INDEXES
-- ============================================

-- User Roles
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- Products
CREATE INDEX idx_products_active ON public.products(active);

-- Landing Pages
CREATE INDEX idx_landing_pages_slug ON public.landing_pages(slug);
CREATE INDEX idx_landing_pages_product_id ON public.landing_pages(product_id);
CREATE INDEX idx_landing_pages_published ON public.landing_pages(published);

-- Orders
CREATE INDEX idx_orders_product_id ON public.orders(product_id);
CREATE INDEX idx_orders_landing_page_id ON public.orders(landing_page_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);

-- Media
CREATE INDEX idx_media_folder ON public.media(folder);
CREATE INDEX idx_media_uploaded_by ON public.media(uploaded_by);

-- Conversion Events
CREATE INDEX idx_conversion_events_order_id ON public.conversion_events(order_id);
CREATE INDEX idx_conversion_events_platform ON public.conversion_events(platform);
CREATE INDEX idx_conversion_events_dedup ON public.conversion_events(order_id, platform, event_name);

-- Domain Mappings
CREATE INDEX idx_domain_mappings_domain ON public.domain_mappings(domain);
CREATE INDEX idx_domain_mappings_landing_page ON public.domain_mappings(landing_page_id);

-- Webhooks
CREATE INDEX idx_webhooks_enabled ON public.webhooks(enabled);

-- ============================================
-- 5. TRIGGERS
-- ============================================

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_landing_pages_updated_at
    BEFORE UPDATE ON public.landing_pages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_webhooks_updated_at
    BEFORE UPDATE ON public.webhooks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 6. ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_mappings ENABLE ROW LEVEL SECURITY;

-- User Roles Policies
CREATE POLICY "Admins can view all user_roles"
    ON public.user_roles FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can insert user_roles"
    ON public.user_roles FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update user_roles"
    ON public.user_roles FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete user_roles"
    ON public.user_roles FOR DELETE
    USING (public.is_admin());

-- Products Policies
CREATE POLICY "Anyone can view active products"
    ON public.products FOR SELECT
    USING ((active = true) OR public.is_admin());

CREATE POLICY "Admins can insert products"
    ON public.products FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update products"
    ON public.products FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete products"
    ON public.products FOR DELETE
    USING (public.is_admin());

-- Landing Pages Policies
CREATE POLICY "Anyone can view published landing pages"
    ON public.landing_pages FOR SELECT
    USING ((published = true) OR public.is_admin());

CREATE POLICY "Admins can insert landing pages"
    ON public.landing_pages FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update landing pages"
    ON public.landing_pages FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete landing pages"
    ON public.landing_pages FOR DELETE
    USING (public.is_admin());

-- Orders Policies
CREATE POLICY "Anyone can create orders"
    ON public.orders FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can view all orders"
    ON public.orders FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can update orders"
    ON public.orders FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete orders"
    ON public.orders FOR DELETE
    USING (public.is_admin());

-- Media Policies
CREATE POLICY "Admins can view all media"
    ON public.media FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can insert media"
    ON public.media FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update media"
    ON public.media FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete media"
    ON public.media FOR DELETE
    USING (public.is_admin());

-- Conversion Events Policies
CREATE POLICY "Anyone can insert conversion events"
    ON public.conversion_events FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can view conversion events"
    ON public.conversion_events FOR SELECT
    USING (public.is_admin());

-- Webhooks Policies
CREATE POLICY "Admins can view all webhooks"
    ON public.webhooks FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can insert webhooks"
    ON public.webhooks FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update webhooks"
    ON public.webhooks FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete webhooks"
    ON public.webhooks FOR DELETE
    USING (public.is_admin());

-- Domain Mappings Policies
CREATE POLICY "Anyone can view domain mappings"
    ON public.domain_mappings FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert domain mappings"
    ON public.domain_mappings FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update domain mappings"
    ON public.domain_mappings FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete domain mappings"
    ON public.domain_mappings FOR DELETE
    USING (public.is_admin());

-- ============================================
-- 7. STORAGE
-- ============================================

-- Create media bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public read access for media"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'media');

CREATE POLICY "Authenticated users can upload media"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update media"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete media"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'media' AND auth.role() = 'authenticated');

-- ============================================
-- 8. ADMIN USER SETUP (Run manually after signup)
-- ============================================
-- After creating your admin user via the app's signup form, run:
--
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin' FROM auth.users WHERE email = 'your-admin@email.com';
--
-- ============================================
