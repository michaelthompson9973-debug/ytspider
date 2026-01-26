-- Add section type column with check constraint
ALTER TABLE landing_page_sections 
ADD COLUMN type text NOT NULL DEFAULT 'html' CHECK (type IN ('html', 'checkout'));

-- Add config column for special section types
ALTER TABLE landing_page_sections 
ADD COLUMN config jsonb DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN landing_page_sections.type IS 'Section type: html for raw HTML, checkout for system checkout form';
COMMENT ON COLUMN landing_page_sections.config IS 'Configuration for special section types like checkout';