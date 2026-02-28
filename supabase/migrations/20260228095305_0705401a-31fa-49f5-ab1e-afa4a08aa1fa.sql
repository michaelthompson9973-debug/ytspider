
-- Add stock management columns to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock integer DEFAULT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS low_stock_threshold integer DEFAULT 5;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS track_stock boolean DEFAULT false;

-- Create function to auto-deduct stock on new order item
CREATE OR REPLACE FUNCTION public.deduct_stock_on_order_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only deduct if product tracks stock
  UPDATE public.products
  SET stock = GREATEST(stock - NEW.quantity, 0)
  WHERE id = NEW.product_id
    AND track_stock = true
    AND stock IS NOT NULL;
  RETURN NEW;
END;
$$;

-- Trigger to deduct stock when order item is inserted
CREATE TRIGGER trg_deduct_stock_on_order_item
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_stock_on_order_item();

-- Add return/refund table for structured return tracking
CREATE TABLE public.order_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'requested',
  refund_amount numeric DEFAULT 0,
  refund_method text DEFAULT 'original',
  admin_note text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop support can view returns"
  ON public.order_returns FOR SELECT
  USING (has_shop_access(shop_id, 'support'));

CREATE POLICY "Shop support can insert returns"
  ON public.order_returns FOR INSERT
  WITH CHECK (has_shop_access(shop_id, 'support'));

CREATE POLICY "Shop managers can update returns"
  ON public.order_returns FOR UPDATE
  USING (has_shop_access(shop_id, 'manager'));

CREATE POLICY "Shop managers can delete returns"
  ON public.order_returns FOR DELETE
  USING (has_shop_access(shop_id, 'manager'));

CREATE TRIGGER update_order_returns_updated_at
  BEFORE UPDATE ON public.order_returns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_order_returns_order_id ON public.order_returns(order_id);
CREATE INDEX idx_order_returns_shop_id ON public.order_returns(shop_id);
CREATE INDEX idx_order_returns_status ON public.order_returns(status);
