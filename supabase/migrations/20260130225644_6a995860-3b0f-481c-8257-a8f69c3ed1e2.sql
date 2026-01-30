-- Create component_library table for storing reusable HTML sections
CREATE TABLE public.component_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  html TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.component_library ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admin only management
CREATE POLICY "Admins can view all components"
  ON public.component_library FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert components"
  ON public.component_library FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update components"
  ON public.component_library FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can delete components"
  ON public.component_library FOR DELETE
  TO authenticated
  USING (is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_component_library_updated_at
  BEFORE UPDATE ON public.component_library
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();