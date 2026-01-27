-- 1. Create landing_page_products junction table
CREATE TABLE public.landing_page_products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    landing_page_id uuid NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sort_order integer NOT NULL DEFAULT 0,
    default_quantity integer NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(landing_page_id, product_id)
);

-- Enable RLS
ALTER TABLE landing_page_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for landing_page_products
CREATE POLICY "Admins can manage landing_page_products"
  ON landing_page_products FOR ALL USING (is_admin());

CREATE POLICY "Public can view products of published pages"
  ON landing_page_products FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM landing_pages lp 
      WHERE lp.id = landing_page_products.landing_page_id 
      AND (lp.published = true OR is_admin())
    )
  );

-- 2. Create order_items table for multiple products per order
CREATE TABLE public.order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id) ON DELETE SET NULL,
    product_name text NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    unit_price numeric NOT NULL,
    subtotal numeric NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_items
CREATE POLICY "Admins can view order items"
  ON order_items FOR SELECT USING (is_admin());

CREATE POLICY "Anyone can insert order items"
  ON order_items FOR INSERT WITH CHECK (true);

-- 3. Migrate existing landing_pages with product_id to landing_page_products
INSERT INTO landing_page_products (landing_page_id, product_id, sort_order, default_quantity)
SELECT id, product_id, 0, 1
FROM landing_pages
WHERE product_id IS NOT NULL
ON CONFLICT (landing_page_id, product_id) DO NOTHING;