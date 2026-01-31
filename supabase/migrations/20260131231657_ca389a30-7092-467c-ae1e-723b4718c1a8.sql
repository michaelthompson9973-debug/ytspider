-- ============================================
-- TRACKING PROFILES SYSTEM
-- ============================================

-- 1. Create tracking_profiles table
CREATE TABLE public.tracking_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    facebook_pixel_id TEXT,
    facebook_access_token TEXT,
    facebook_test_event_code TEXT,
    tiktok_pixel_id TEXT,
    tiktok_access_token TEXT,
    tiktok_test_event_code TEXT,
    google_gtm_id TEXT,
    google_ga4_id TEXT,
    google_ga4_secret TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create tracking_event_logs table
CREATE TABLE public.tracking_event_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.tracking_profiles(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    platform TEXT NOT NULL,
    event_name TEXT NOT NULL,
    event_id TEXT NOT NULL,
    request_payload JSONB,
    response_status INTEGER,
    response_body TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Add tracking_profile_id to landing_pages
ALTER TABLE public.landing_pages 
ADD COLUMN tracking_profile_id UUID REFERENCES public.tracking_profiles(id) ON DELETE SET NULL;

-- 4. Create indexes
CREATE INDEX idx_tracking_profiles_is_active ON public.tracking_profiles(is_active);
CREATE INDEX idx_tracking_event_logs_profile_id ON public.tracking_event_logs(profile_id);
CREATE INDEX idx_tracking_event_logs_order_id ON public.tracking_event_logs(order_id);
CREATE INDEX idx_tracking_event_logs_platform ON public.tracking_event_logs(platform);
CREATE INDEX idx_tracking_event_logs_sent_at ON public.tracking_event_logs(sent_at);
CREATE INDEX idx_landing_pages_tracking_profile ON public.landing_pages(tracking_profile_id);

-- 5. Create updated_at trigger for tracking_profiles
CREATE TRIGGER update_tracking_profiles_updated_at
    BEFORE UPDATE ON public.tracking_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Enable RLS
ALTER TABLE public.tracking_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_event_logs ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for tracking_profiles (admin only)
CREATE POLICY "Admins can view tracking_profiles"
    ON public.tracking_profiles FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can insert tracking_profiles"
    ON public.tracking_profiles FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update tracking_profiles"
    ON public.tracking_profiles FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete tracking_profiles"
    ON public.tracking_profiles FOR DELETE
    USING (public.is_admin());

-- 8. RLS Policies for tracking_event_logs (admin only)
CREATE POLICY "Admins can view tracking_event_logs"
    ON public.tracking_event_logs FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Anyone can insert tracking_event_logs"
    ON public.tracking_event_logs FOR INSERT
    WITH CHECK (true);

-- 9. Enable realtime for tracking_event_logs (for live monitoring)
ALTER PUBLICATION supabase_realtime ADD TABLE public.tracking_event_logs;