-- Create delivery mode enum
CREATE TYPE delivery_mode AS ENUM ('flat', 'conditional', 'free');

-- Create checkout settings table
CREATE TABLE landing_page_checkout_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id uuid NOT NULL UNIQUE REFERENCES landing_pages(id) ON DELETE CASCADE,
  currency text NOT NULL DEFAULT 'BDT',
  delivery_mode delivery_mode NOT NULL DEFAULT 'flat',
  delivery_amount numeric NOT NULL DEFAULT 0,
  free_over_amount numeric DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add updated_at trigger
CREATE TRIGGER update_landing_page_checkout_settings_updated_at
  BEFORE UPDATE ON landing_page_checkout_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS policies
ALTER TABLE landing_page_checkout_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage checkout settings"
  ON landing_page_checkout_settings FOR ALL
  USING (is_admin());

CREATE POLICY "Anyone can view checkout settings of published pages"
  ON landing_page_checkout_settings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM landing_pages lp
    WHERE lp.id = landing_page_checkout_settings.landing_page_id
    AND (lp.published = true OR is_admin())
  ));

-- Add pricing columns to orders table
ALTER TABLE orders
ADD COLUMN quantity integer NOT NULL DEFAULT 1,
ADD COLUMN unit_price numeric DEFAULT NULL,
ADD COLUMN subtotal numeric DEFAULT NULL,
ADD COLUMN delivery_charge numeric DEFAULT NULL,
ADD COLUMN total numeric DEFAULT NULL,
ADD COLUMN currency text DEFAULT 'BDT';