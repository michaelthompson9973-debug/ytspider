-- Add size_options column to products table for storing size variants
ALTER TABLE public.products 
ADD COLUMN size_options jsonb DEFAULT NULL;

-- Add comment explaining the expected format
COMMENT ON COLUMN public.products.size_options IS 'JSON array of size options. Format: [{"label": "০-৩ মাস", "value": "s"}, {"label": "৩-১৫ মাস", "value": "m"}]';