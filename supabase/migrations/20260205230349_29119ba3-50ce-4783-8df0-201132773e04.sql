-- ============================================
-- WORLD-CLASS DATABASE ARCHITECTURE
-- Physical vs Digital Products Extension
-- ============================================

-- ============================================
-- 1. NEW ENUMS
-- ============================================

-- Product type enum
CREATE TYPE public.product_type AS ENUM ('physical', 'digital', 'bundle');

-- Order type enum  
CREATE TYPE public.order_type AS ENUM ('physical', 'digital', 'mixed');

-- Digital delivery type
CREATE TYPE public.digital_delivery_type AS ENUM ('download', 'email', 'license_key', 'access_link');

-- License generator type
CREATE TYPE public.license_generator AS ENUM ('none', 'uuid', 'custom', 'external_api');

-- Payment status
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'partially_refunded');

-- Payment gateway provider
CREATE TYPE public.payment_provider AS ENUM ('stripe', 'bkash', 'nagad', 'rocket', 'sslcommerz', 'paypal', 'manual');

-- Transaction type
CREATE TYPE public.transaction_type AS ENUM ('charge', 'refund', 'partial_refund', 'chargeback');

-- Transaction status
CREATE TYPE public.transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');

-- Campaign channel
CREATE TYPE public.campaign_channel AS ENUM ('whatsapp', 'sms', 'email');

-- Campaign status
CREATE TYPE public.campaign_status AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled');

-- Email delivery status
CREATE TYPE public.email_delivery_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'bounced');

-- Recipient status
CREATE TYPE public.recipient_status AS ENUM ('pending', 'sent', 'delivered', 'read', 'clicked', 'failed', 'unsubscribed');

-- ============================================
-- 2. UPDATE EXISTING TABLES
-- ============================================

-- Add product_type to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS product_type public.product_type NOT NULL DEFAULT 'physical';

-- Add new columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_type public.order_type NOT NULL DEFAULT 'physical',
ADD COLUMN IF NOT EXISTS payment_status public.payment_status NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS payment_gateway TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC,
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

-- ============================================
-- 3. NEW EXTENSION TABLES
-- ============================================

-- Digital Product Meta (extension for digital products)
CREATE TABLE public.digital_product_meta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
  delivery_type public.digital_delivery_type NOT NULL DEFAULT 'download',
  file_url TEXT,
  file_size_bytes BIGINT,
  file_name TEXT,
  mime_type TEXT,
  max_downloads INTEGER,
  download_expires_days INTEGER,
  license_generator public.license_generator NOT NULL DEFAULT 'none',
  license_prefix TEXT,
  access_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Digital Deliveries (tracks individual digital deliveries)
CREATE TABLE public.digital_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  delivery_type public.digital_delivery_type NOT NULL DEFAULT 'download',
  download_url TEXT,
  download_token TEXT UNIQUE,
  license_key TEXT,
  access_credentials JSONB,
  expires_at TIMESTAMPTZ,
  max_downloads INTEGER,
  download_count INTEGER NOT NULL DEFAULT 0,
  first_downloaded_at TIMESTAMPTZ,
  last_downloaded_at TIMESTAMPTZ,
  email_sent_at TIMESTAMPTZ,
  email_status public.email_delivery_status DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Physical Order Shipping (extension for physical orders)
CREATE TABLE public.physical_order_shipping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  courier_provider TEXT,
  consignment_id TEXT,
  tracking_code TEXT,
  courier_status TEXT,
  courier_synced_at TIMESTAMPTZ,
  estimated_delivery TIMESTAMPTZ,
  actual_delivery TIMESTAMPTZ,
  delivery_attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  failure_reason TEXT,
  cod_amount NUMERIC,
  cod_collected BOOLEAN NOT NULL DEFAULT false,
  cod_collected_at TIMESTAMPTZ,
  weight_kg NUMERIC,
  dimensions JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 4. PAYMENT TABLES
-- ============================================

-- Payment Gateways (shop-specific payment configurations)
CREATE TABLE public.payment_gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  provider public.payment_provider NOT NULL,
  display_name TEXT NOT NULL,
  credentials JSONB NOT NULL DEFAULT '{}',
  webhook_secret TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_test_mode BOOLEAN NOT NULL DEFAULT true,
  supported_currencies TEXT[] DEFAULT ARRAY['BDT'],
  supported_methods TEXT[] DEFAULT ARRAY['card'],
  min_amount NUMERIC,
  max_amount NUMERIC,
  transaction_fee_percent NUMERIC,
  transaction_fee_fixed NUMERIC,
  payout_schedule TEXT DEFAULT 'weekly',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(shop_id, provider)
);

-- Payment Transactions (complete transaction history)
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  gateway_id UUID REFERENCES public.payment_gateways(id) ON DELETE SET NULL,
  transaction_type public.transaction_type NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BDT',
  status public.transaction_status NOT NULL DEFAULT 'pending',
  provider_transaction_id TEXT,
  provider_response JSONB,
  failure_reason TEXT,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- 5. MARKETING TABLES
-- ============================================

-- WhatsApp Connections
CREATE TABLE public.whatsapp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  phone_number_id TEXT,
  business_account_id TEXT,
  access_token TEXT,
  webhook_verify_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  display_name TEXT,
  quality_rating TEXT,
  messaging_limit TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Marketing Campaigns (unified for WhatsApp, SMS, Email)
CREATE TABLE public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  channel public.campaign_channel NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status public.campaign_status NOT NULL DEFAULT 'draft',
  template_id TEXT,
  template_content TEXT,
  subject TEXT,
  target_segment JSONB DEFAULT '{}',
  target_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  read_count INTEGER NOT NULL DEFAULT 0,
  clicked_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Campaign Recipients
CREATE TABLE public.campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customer_profiles(id) ON DELETE SET NULL,
  recipient_phone TEXT,
  recipient_email TEXT,
  status public.recipient_status NOT NULL DEFAULT 'pending',
  provider_message_id TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  failure_reason TEXT,
  metadata JSONB
);

-- ============================================
-- 6. INDEXES
-- ============================================

-- Products
CREATE INDEX idx_products_type ON public.products(product_type);
CREATE INDEX idx_products_shop_type ON public.products(shop_id, product_type);

-- Digital Product Meta
CREATE INDEX idx_digital_meta_product ON public.digital_product_meta(product_id);

-- Digital Deliveries
CREATE INDEX idx_digital_deliveries_order ON public.digital_deliveries(order_id);
CREATE INDEX idx_digital_deliveries_token ON public.digital_deliveries(download_token);
CREATE INDEX idx_digital_deliveries_expires ON public.digital_deliveries(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_digital_deliveries_product ON public.digital_deliveries(product_id);

-- Physical Shipping
CREATE INDEX idx_physical_shipping_order ON public.physical_order_shipping(order_id);
CREATE INDEX idx_physical_shipping_tracking ON public.physical_order_shipping(tracking_code) WHERE tracking_code IS NOT NULL;
CREATE INDEX idx_physical_shipping_courier ON public.physical_order_shipping(courier_provider, consignment_id);

-- Orders (new columns)
CREATE INDEX idx_orders_type ON public.orders(order_type);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);

-- Payment Gateways
CREATE INDEX idx_payment_gateways_shop ON public.payment_gateways(shop_id, is_active);
CREATE INDEX idx_payment_gateways_provider ON public.payment_gateways(provider);

-- Payment Transactions
CREATE INDEX idx_payment_transactions_order ON public.payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_shop ON public.payment_transactions(shop_id, created_at DESC);
CREATE INDEX idx_payment_transactions_gateway ON public.payment_transactions(gateway_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);

-- WhatsApp Connections
CREATE INDEX idx_whatsapp_connections_shop ON public.whatsapp_connections(shop_id);
CREATE INDEX idx_whatsapp_connections_phone ON public.whatsapp_connections(phone_number);

-- Marketing Campaigns
CREATE INDEX idx_campaigns_shop ON public.marketing_campaigns(shop_id, status);
CREATE INDEX idx_campaigns_channel ON public.marketing_campaigns(channel);
CREATE INDEX idx_campaigns_scheduled ON public.marketing_campaigns(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_campaigns_created_by ON public.marketing_campaigns(created_by);

-- Campaign Recipients
CREATE INDEX idx_campaign_recipients_campaign ON public.campaign_recipients(campaign_id, status);
CREATE INDEX idx_campaign_recipients_customer ON public.campaign_recipients(customer_id);

-- ============================================
-- 7. TRIGGERS
-- ============================================

-- Update timestamp trigger for new tables
CREATE TRIGGER update_digital_product_meta_updated_at
  BEFORE UPDATE ON public.digital_product_meta
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_physical_order_shipping_updated_at
  BEFORE UPDATE ON public.physical_order_shipping
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_gateways_updated_at
  BEFORE UPDATE ON public.payment_gateways
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_connections_updated_at
  BEFORE UPDATE ON public.whatsapp_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketing_campaigns_updated_at
  BEFORE UPDATE ON public.marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create digital_product_meta when product is digital
CREATE OR REPLACE FUNCTION public.auto_create_digital_meta()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.product_type IN ('digital', 'bundle') THEN
    INSERT INTO public.digital_product_meta (product_id)
    VALUES (NEW.id)
    ON CONFLICT (product_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_create_digital_meta
  AFTER INSERT OR UPDATE OF product_type ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_digital_meta();

-- Auto-create physical_order_shipping when order is physical
CREATE OR REPLACE FUNCTION public.auto_create_physical_shipping()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.order_type IN ('physical', 'mixed') THEN
    INSERT INTO public.physical_order_shipping (order_id)
    VALUES (NEW.id)
    ON CONFLICT (order_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_create_physical_shipping
  AFTER INSERT OR UPDATE OF order_type ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_physical_shipping();

-- Auto-create digital_deliveries for digital order items
CREATE OR REPLACE FUNCTION public.auto_create_digital_delivery()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product public.products;
  v_meta public.digital_product_meta;
BEGIN
  SELECT * INTO v_product FROM public.products WHERE id = NEW.product_id;
  
  IF v_product.product_type IN ('digital', 'bundle') THEN
    SELECT * INTO v_meta FROM public.digital_product_meta WHERE product_id = NEW.product_id;
    
    INSERT INTO public.digital_deliveries (
      order_id, 
      order_item_id, 
      product_id, 
      delivery_type,
      download_token,
      max_downloads,
      expires_at
    ) VALUES (
      NEW.order_id,
      NEW.id,
      NEW.product_id,
      COALESCE(v_meta.delivery_type, 'download'),
      encode(gen_random_bytes(32), 'hex'),
      v_meta.max_downloads,
      CASE 
        WHEN v_meta.download_expires_days IS NOT NULL 
        THEN NOW() + (v_meta.download_expires_days || ' days')::interval
        ELSE NULL
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_create_digital_delivery
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_digital_delivery();

-- ============================================
-- 8. ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE public.digital_product_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_order_shipping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;

-- Digital Product Meta RLS
CREATE POLICY "Shop members can manage digital meta"
ON public.digital_product_meta FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.products p 
    WHERE p.id = digital_product_meta.product_id 
    AND public.has_shop_access(p.shop_id, 'editor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products p 
    WHERE p.id = digital_product_meta.product_id 
    AND public.has_shop_access(p.shop_id, 'editor')
  )
);

CREATE POLICY "Public can view digital meta of active products"
ON public.digital_product_meta FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.products p 
    WHERE p.id = digital_product_meta.product_id 
    AND p.active = true
  )
);

-- Digital Deliveries RLS
CREATE POLICY "Shop support can view digital deliveries"
ON public.digital_deliveries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = digital_deliveries.order_id 
    AND public.has_shop_access(o.shop_id, 'support')
  )
);

CREATE POLICY "Shop managers can manage digital deliveries"
ON public.digital_deliveries FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = digital_deliveries.order_id 
    AND public.has_shop_access(o.shop_id, 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = digital_deliveries.order_id 
    AND public.has_shop_access(o.shop_id, 'manager')
  )
);

CREATE POLICY "Service role can insert digital deliveries"
ON public.digital_deliveries FOR INSERT
WITH CHECK (true);

-- Physical Order Shipping RLS
CREATE POLICY "Shop support can view physical shipping"
ON public.physical_order_shipping FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = physical_order_shipping.order_id 
    AND public.has_shop_access(o.shop_id, 'support')
  )
);

CREATE POLICY "Shop support can manage physical shipping"
ON public.physical_order_shipping FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = physical_order_shipping.order_id 
    AND public.has_shop_access(o.shop_id, 'support')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = physical_order_shipping.order_id 
    AND public.has_shop_access(o.shop_id, 'support')
  )
);

CREATE POLICY "Service role can insert physical shipping"
ON public.physical_order_shipping FOR INSERT
WITH CHECK (true);

-- Payment Gateways RLS (admin only)
CREATE POLICY "Shop admins can manage payment gateways"
ON public.payment_gateways FOR ALL
USING (public.has_shop_access(shop_id, 'admin'))
WITH CHECK (public.has_shop_access(shop_id, 'admin'));

-- Payment Transactions RLS
CREATE POLICY "Shop viewers can view payment transactions"
ON public.payment_transactions FOR SELECT
USING (public.has_shop_access(shop_id, 'viewer'));

CREATE POLICY "Shop admins can manage payment transactions"
ON public.payment_transactions FOR ALL
USING (public.has_shop_access(shop_id, 'admin'))
WITH CHECK (public.has_shop_access(shop_id, 'admin'));

CREATE POLICY "Service role can insert payment transactions"
ON public.payment_transactions FOR INSERT
WITH CHECK (true);

-- WhatsApp Connections RLS
CREATE POLICY "Shop admins can manage whatsapp connections"
ON public.whatsapp_connections FOR ALL
USING (
  shop_id IS NULL AND public.is_admin()
  OR public.has_shop_access(shop_id, 'admin')
)
WITH CHECK (
  shop_id IS NULL AND public.is_admin()
  OR public.has_shop_access(shop_id, 'admin')
);

-- Marketing Campaigns RLS
CREATE POLICY "Shop managers can manage campaigns"
ON public.marketing_campaigns FOR ALL
USING (
  shop_id IS NULL AND public.is_admin()
  OR public.has_shop_access(shop_id, 'manager')
)
WITH CHECK (
  shop_id IS NULL AND public.is_admin()
  OR public.has_shop_access(shop_id, 'manager')
);

CREATE POLICY "Shop viewers can view campaigns"
ON public.marketing_campaigns FOR SELECT
USING (
  shop_id IS NULL AND public.is_admin()
  OR public.has_shop_access(shop_id, 'viewer')
);

-- Campaign Recipients RLS
CREATE POLICY "Shop managers can manage campaign recipients"
ON public.campaign_recipients FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.marketing_campaigns mc 
    WHERE mc.id = campaign_recipients.campaign_id 
    AND (
      mc.shop_id IS NULL AND public.is_admin()
      OR public.has_shop_access(mc.shop_id, 'manager')
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.marketing_campaigns mc 
    WHERE mc.id = campaign_recipients.campaign_id 
    AND (
      mc.shop_id IS NULL AND public.is_admin()
      OR public.has_shop_access(mc.shop_id, 'manager')
    )
  )
);

CREATE POLICY "Shop viewers can view campaign recipients"
ON public.campaign_recipients FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.marketing_campaigns mc 
    WHERE mc.id = campaign_recipients.campaign_id 
    AND (
      mc.shop_id IS NULL AND public.is_admin()
      OR public.has_shop_access(mc.shop_id, 'viewer')
    )
  )
);

-- ============================================
-- 9. DATA MIGRATION
-- ============================================

-- Migrate existing courier data to physical_order_shipping
INSERT INTO public.physical_order_shipping (
  order_id, 
  courier_provider, 
  consignment_id, 
  tracking_code, 
  courier_status, 
  courier_synced_at
)
SELECT 
  id, 
  courier_provider, 
  consignment_id, 
  tracking_code, 
  courier_status, 
  courier_synced_at
FROM public.orders 
WHERE courier_provider IS NOT NULL
ON CONFLICT (order_id) DO NOTHING;

-- Set order_type based on shop_type
UPDATE public.orders o
SET order_type = CASE 
  WHEN s.shop_type = 'physical' THEN 'physical'::public.order_type
  WHEN s.shop_type = 'digital' THEN 'digital'::public.order_type
  ELSE 'physical'::public.order_type
END
FROM public.shops s
WHERE o.shop_id = s.id
AND o.order_type = 'physical';