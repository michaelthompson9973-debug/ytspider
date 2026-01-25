-- ============================================
-- SECTION BUILDER + THEME SYSTEM TABLES
-- ============================================

-- Landing Page Sections Table
CREATE TABLE public.landing_page_sections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    landing_page_id uuid NOT NULL REFERENCES public.landing_pages(id) ON DELETE CASCADE,
    name text NOT NULL DEFAULT 'Untitled Section',
    html text NOT NULL DEFAULT '',
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Landing Page Theme Table
CREATE TABLE public.landing_page_theme (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    landing_page_id uuid NOT NULL UNIQUE REFERENCES public.landing_pages(id) ON DELETE CASCADE,
    config jsonb NOT NULL DEFAULT '{
        "primaryColor": "#3B82F6",
        "fontFamily": "Inter, sans-serif",
        "buttonStyle": "rounded",
        "borderRadius": "8px",
        "containerWidth": "1200px",
        "backgroundColor": "#ffffff"
    }'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_landing_page_sections_landing_page_id ON public.landing_page_sections(landing_page_id);
CREATE INDEX idx_landing_page_sections_sort_order ON public.landing_page_sections(landing_page_id, sort_order);
CREATE INDEX idx_landing_page_theme_landing_page_id ON public.landing_page_theme(landing_page_id);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_landing_page_theme_updated_at
    BEFORE UPDATE ON public.landing_page_theme
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.landing_page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_page_theme ENABLE ROW LEVEL SECURITY;

-- Landing Page Sections Policies
CREATE POLICY "Anyone can view sections of published landing pages"
    ON public.landing_page_sections FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.landing_pages lp 
            WHERE lp.id = landing_page_id 
            AND (lp.published = true OR public.is_admin())
        )
    );

CREATE POLICY "Admins can insert landing page sections"
    ON public.landing_page_sections FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update landing page sections"
    ON public.landing_page_sections FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete landing page sections"
    ON public.landing_page_sections FOR DELETE
    USING (public.is_admin());

-- Landing Page Theme Policies
CREATE POLICY "Anyone can view theme of published landing pages"
    ON public.landing_page_theme FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.landing_pages lp 
            WHERE lp.id = landing_page_id 
            AND (lp.published = true OR public.is_admin())
        )
    );

CREATE POLICY "Admins can insert landing page theme"
    ON public.landing_page_theme FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update landing page theme"
    ON public.landing_page_theme FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete landing page theme"
    ON public.landing_page_theme FOR DELETE
    USING (public.is_admin());