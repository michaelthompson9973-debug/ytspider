-- Create app_role enum for role management
CREATE TYPE public.app_role AS ENUM ('admin');

-- Create order_status enum
CREATE TYPE public.order_status AS ENUM ('new', 'confirmed', 'shipped', 'cancelled');

-- Create user_roles table (for admin access control)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create products table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    images TEXT[] DEFAULT '{}',
    videos TEXT[] DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create landing_pages table
CREATE TABLE public.landing_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    gtm_id TEXT,
    published BOOLEAN NOT NULL DEFAULT false,
    html_content TEXT NOT NULL DEFAULT '',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    landing_page_id UUID REFERENCES public.landing_pages(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    customer_city TEXT NOT NULL,
    status order_status NOT NULL DEFAULT 'new',
    ip_address TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,
    event_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create media table
CREATE TABLE public.media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    folder TEXT DEFAULT 'root',
    public_url TEXT,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversion_events table for tracking deduplication
CREATE TABLE public.conversion_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    platform TEXT NOT NULL,
    event_id TEXT NOT NULL,
    event_name TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    response_status INTEGER,
    response_body TEXT,
    UNIQUE (order_id, platform, event_name)
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check admin role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
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

-- Create helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
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

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
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

-- RLS Policies for user_roles (admin only)
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

-- RLS Policies for products
CREATE POLICY "Anyone can view active products"
    ON public.products FOR SELECT
    USING (active = true OR public.is_admin());

CREATE POLICY "Admins can insert products"
    ON public.products FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update products"
    ON public.products FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete products"
    ON public.products FOR DELETE
    USING (public.is_admin());

-- RLS Policies for landing_pages
CREATE POLICY "Anyone can view published landing pages"
    ON public.landing_pages FOR SELECT
    USING (published = true OR public.is_admin());

CREATE POLICY "Admins can insert landing pages"
    ON public.landing_pages FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update landing pages"
    ON public.landing_pages FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete landing pages"
    ON public.landing_pages FOR DELETE
    USING (public.is_admin());

-- RLS Policies for orders
CREATE POLICY "Admins can view all orders"
    ON public.orders FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Anyone can create orders"
    ON public.orders FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can update orders"
    ON public.orders FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete orders"
    ON public.orders FOR DELETE
    USING (public.is_admin());

-- RLS Policies for media
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

-- RLS Policies for conversion_events
CREATE POLICY "Admins can view conversion events"
    ON public.conversion_events FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Anyone can insert conversion events"
    ON public.conversion_events FOR INSERT
    WITH CHECK (true);

-- Create storage bucket for media
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true);

-- Storage policies for media bucket
CREATE POLICY "Anyone can view media files"
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

-- Create indexes for better performance
CREATE INDEX idx_landing_pages_slug ON public.landing_pages(slug);
CREATE INDEX idx_landing_pages_published ON public.landing_pages(published);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);
CREATE INDEX idx_orders_landing_page_id ON public.orders(landing_page_id);
CREATE INDEX idx_orders_product_id ON public.orders(product_id);
CREATE INDEX idx_media_folder ON public.media(folder);
CREATE INDEX idx_conversion_events_order_id ON public.conversion_events(order_id);