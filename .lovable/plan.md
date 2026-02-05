
# বিশ্বমানের ডাটাবেজ আর্কিটেকচার - Physical vs Digital প্রোডাক্ট

## বর্তমান অবস্থা বিশ্লেষণ

### ইতিমধ্যে আছে:
- `shops.shop_type` ENUM ('physical', 'digital') ✅
- Multi-tenant RLS via `has_shop_access()` ✅
- Basic products, orders, subscriptions tables ✅

### যা নেই এবং প্রয়োজন:
- Digital product delivery tracking
- Payment gateway credentials
- Order type differentiation
- Digital asset management
- WhatsApp/SMS campaign tables

---

## আর্কিটেকচার ডিজাইন প্রিন্সিপল

### 1. Polymorphic Approach (NOT Separate Tables)
আমরা **একই `products` এবং `orders` টেবিল ব্যবহার করব** কিন্তু type-specific columns এবং extension tables দিয়ে। এটা:
- Query complexity কমায়
- Data consistency বজায় রাখে
- Analytics এবং reporting সহজ করে
- Future hybrid products (physical + digital bundle) support করে

### 2. Extension Pattern
- Core table (`products`, `orders`) সবার জন্য
- Extension tables (`digital_product_meta`, `digital_deliveries`) শুধু digital এর জন্য
- Extension tables (`physical_order_shipping`) শুধু physical এর জন্য

---

## নতুন টেবিল স্ট্রাকচার

### A. Products Domain

#### 1. products টেবিল আপডেট
```text
products (বিদ্যমান)
├── id UUID PK
├── shop_id UUID FK
├── name TEXT
├── description TEXT
├── price NUMERIC
├── active BOOLEAN
├── images TEXT[]
├── videos TEXT[]
├── product_type ENUM ('physical', 'digital', 'bundle') NEW
├── size_options JSONB
├── created_at, updated_at
```

#### 2. digital_product_meta (নতুন)
```text
digital_product_meta
├── id UUID PK
├── product_id UUID FK UNIQUE (products.id)
├── delivery_type ENUM ('download', 'email', 'license_key', 'access_link')
├── file_url TEXT (encrypted storage path)
├── file_size_bytes BIGINT
├── file_name TEXT
├── mime_type TEXT
├── max_downloads INTEGER (null = unlimited)
├── download_expires_days INTEGER (null = never)
├── license_generator ENUM ('none', 'uuid', 'custom', 'external_api')
├── license_prefix TEXT
├── access_instructions TEXT (rich text for email)
├── created_at, updated_at
```

### B. Orders Domain

#### 3. orders টেবিল আপডেট
```text
orders (বিদ্যমান + নতুন columns)
├── ... existing columns ...
├── order_type ENUM ('physical', 'digital', 'mixed') NEW
├── payment_status ENUM ('pending', 'paid', 'failed', 'refunded', 'partially_refunded') NEW
├── payment_method TEXT NEW
├── payment_transaction_id TEXT NEW
├── payment_gateway TEXT NEW (stripe, bkash, nagad, sslcommerz)
├── paid_at TIMESTAMP NEW
├── refund_amount NUMERIC NEW
├── refund_reason TEXT NEW
├── refunded_at TIMESTAMP NEW
```

#### 4. digital_deliveries (নতুন)
```text
digital_deliveries
├── id UUID PK
├── order_id UUID FK
├── order_item_id UUID FK (order_items.id)
├── product_id UUID FK
├── delivery_type ENUM ('download', 'email', 'license_key', 'access_link')
├── download_url TEXT (signed, temporary URL)
├── download_token TEXT UNIQUE (secure random)
├── license_key TEXT
├── access_credentials JSONB (encrypted)
├── expires_at TIMESTAMP
├── max_downloads INTEGER
├── download_count INTEGER DEFAULT 0
├── first_downloaded_at TIMESTAMP
├── last_downloaded_at TIMESTAMP
├── email_sent_at TIMESTAMP
├── email_status ENUM ('pending', 'sent', 'delivered', 'failed', 'bounced')
├── created_at TIMESTAMP
```

#### 5. physical_order_shipping (নতুন - courier tracking extension)
```text
physical_order_shipping
├── id UUID PK
├── order_id UUID FK UNIQUE
├── courier_provider TEXT
├── consignment_id TEXT
├── tracking_code TEXT
├── courier_status TEXT
├── courier_synced_at TIMESTAMP
├── estimated_delivery TIMESTAMP
├── actual_delivery TIMESTAMP
├── delivery_attempts INTEGER DEFAULT 0
├── last_attempt_at TIMESTAMP
├── failure_reason TEXT
├── cod_amount NUMERIC
├── cod_collected BOOLEAN DEFAULT false
├── cod_collected_at TIMESTAMP
├── weight_kg NUMERIC
├── dimensions JSONB (length, width, height)
├── created_at, updated_at
```

### C. Payment Domain

#### 6. payment_gateways (নতুন)
```text
payment_gateways
├── id UUID PK
├── shop_id UUID FK
├── provider ENUM ('stripe', 'bkash', 'nagad', 'rocket', 'sslcommerz', 'paypal')
├── display_name TEXT
├── credentials JSONB (encrypted)
├── webhook_secret TEXT
├── is_active BOOLEAN DEFAULT false
├── is_test_mode BOOLEAN DEFAULT true
├── supported_currencies TEXT[]
├── supported_methods TEXT[] (card, bank, mobile)
├── min_amount NUMERIC
├── max_amount NUMERIC
├── transaction_fee_percent NUMERIC
├── transaction_fee_fixed NUMERIC
├── payout_schedule TEXT (daily, weekly, monthly)
├── created_at, updated_at
```

#### 7. payment_transactions (নতুন)
```text
payment_transactions
├── id UUID PK
├── shop_id UUID FK
├── order_id UUID FK
├── gateway_id UUID FK (payment_gateways.id)
├── transaction_type ENUM ('charge', 'refund', 'partial_refund', 'chargeback')
├── amount NUMERIC
├── currency TEXT
├── status ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled')
├── provider_transaction_id TEXT
├── provider_response JSONB
├── failure_reason TEXT
├── metadata JSONB
├── ip_address TEXT
├── user_agent TEXT
├── created_at TIMESTAMP
├── completed_at TIMESTAMP
```

### D. Marketing Domain

#### 8. whatsapp_connections (নতুন)
```text
whatsapp_connections
├── id UUID PK
├── shop_id UUID FK (null = platform-wide)
├── phone_number TEXT
├── phone_number_id TEXT (Meta API)
├── business_account_id TEXT
├── access_token TEXT (encrypted)
├── webhook_verify_token TEXT
├── display_name TEXT
├── quality_rating TEXT
├── messaging_limit TEXT
├── is_active BOOLEAN
├── is_verified BOOLEAN
├── created_at, updated_at
```

#### 9. marketing_campaigns (নতুন - unified for WhatsApp, SMS, Email)
```text
marketing_campaigns
├── id UUID PK
├── shop_id UUID FK (null = platform-wide)
├── channel ENUM ('whatsapp', 'sms', 'email')
├── name TEXT
├── description TEXT
├── status ENUM ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')
├── template_id TEXT (for WhatsApp templates)
├── template_content TEXT (for SMS/Email)
├── subject TEXT (for Email)
├── target_segment JSONB (filter criteria)
├── target_count INTEGER
├── sent_count INTEGER DEFAULT 0
├── delivered_count INTEGER DEFAULT 0
├── read_count INTEGER DEFAULT 0
├── clicked_count INTEGER DEFAULT 0
├── failed_count INTEGER DEFAULT 0
├── scheduled_at TIMESTAMP
├── started_at TIMESTAMP
├── completed_at TIMESTAMP
├── created_by UUID FK (profiles)
├── created_at, updated_at
```

#### 10. campaign_recipients (নতুন)
```text
campaign_recipients
├── id UUID PK
├── campaign_id UUID FK
├── customer_id UUID FK (customer_profiles)
├── recipient_phone TEXT
├── recipient_email TEXT
├── status ENUM ('pending', 'sent', 'delivered', 'read', 'clicked', 'failed', 'unsubscribed')
├── provider_message_id TEXT
├── sent_at TIMESTAMP
├── delivered_at TIMESTAMP
├── read_at TIMESTAMP
├── clicked_at TIMESTAMP
├── failure_reason TEXT
├── metadata JSONB
```

---

## ENUMs যোগ করতে হবে

```sql
-- Product type
CREATE TYPE product_type AS ENUM ('physical', 'digital', 'bundle');

-- Digital delivery type
CREATE TYPE digital_delivery_type AS ENUM ('download', 'email', 'license_key', 'access_link');

-- License generator
CREATE TYPE license_generator AS ENUM ('none', 'uuid', 'custom', 'external_api');

-- Payment status
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'partially_refunded');

-- Payment gateway provider
CREATE TYPE payment_provider AS ENUM ('stripe', 'bkash', 'nagad', 'rocket', 'sslcommerz', 'paypal', 'manual');

-- Transaction type
CREATE TYPE transaction_type AS ENUM ('charge', 'refund', 'partial_refund', 'chargeback');

-- Transaction status
CREATE TYPE transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');

-- Campaign channel
CREATE TYPE campaign_channel AS ENUM ('whatsapp', 'sms', 'email');

-- Campaign status
CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled');

-- Email delivery status
CREATE TYPE email_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'bounced');

-- Recipient status
CREATE TYPE recipient_status AS ENUM ('pending', 'sent', 'delivered', 'read', 'clicked', 'failed', 'unsubscribed');
```

---

## RLS Policies

### Pattern: Shop-level isolation with role-based access

```sql
-- Digital product meta - same as products
CREATE POLICY "Shop members can manage digital meta"
ON digital_product_meta FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM products p 
    WHERE p.id = digital_product_meta.product_id 
    AND has_shop_access(p.shop_id, 'editor')
  )
)
WITH CHECK (...);

-- Digital deliveries - support can view, manager can manage
CREATE POLICY "Shop members can view digital deliveries"
ON digital_deliveries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.id = digital_deliveries.order_id 
    AND has_shop_access(o.shop_id, 'support')
  )
);

-- Payment gateways - admin only
CREATE POLICY "Shop admins can manage payment gateways"
ON payment_gateways FOR ALL
USING (has_shop_access(shop_id, 'admin'))
WITH CHECK (has_shop_access(shop_id, 'admin'));

-- Marketing campaigns - manager+
CREATE POLICY "Shop managers can manage campaigns"
ON marketing_campaigns FOR ALL
USING (
  shop_id IS NULL AND is_admin() -- Platform campaigns
  OR has_shop_access(shop_id, 'manager')
)
WITH CHECK (...);
```

---

## Indexes

```sql
-- Digital products
CREATE INDEX idx_digital_meta_product ON digital_product_meta(product_id);
CREATE INDEX idx_products_type ON products(product_type);

-- Digital deliveries
CREATE INDEX idx_digital_deliveries_order ON digital_deliveries(order_id);
CREATE INDEX idx_digital_deliveries_token ON digital_deliveries(download_token);
CREATE INDEX idx_digital_deliveries_expires ON digital_deliveries(expires_at) WHERE expires_at IS NOT NULL;

-- Physical shipping
CREATE INDEX idx_physical_shipping_order ON physical_order_shipping(order_id);
CREATE INDEX idx_physical_shipping_tracking ON physical_order_shipping(tracking_code);
CREATE INDEX idx_physical_shipping_courier ON physical_order_shipping(courier_provider, consignment_id);

-- Payment
CREATE INDEX idx_payment_gateways_shop ON payment_gateways(shop_id, is_active);
CREATE INDEX idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_shop ON payment_transactions(shop_id, created_at DESC);

-- Campaigns
CREATE INDEX idx_campaigns_shop ON marketing_campaigns(shop_id, status);
CREATE INDEX idx_campaigns_scheduled ON marketing_campaigns(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_campaign_recipients_campaign ON campaign_recipients(campaign_id, status);
```

---

## Triggers

```sql
-- Auto-create digital_product_meta when product is digital
CREATE OR REPLACE FUNCTION auto_create_digital_meta()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_type = 'digital' OR NEW.product_type = 'bundle' THEN
    INSERT INTO digital_product_meta (product_id)
    VALUES (NEW.id)
    ON CONFLICT (product_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-create physical_order_shipping when order is physical
CREATE OR REPLACE FUNCTION auto_create_physical_shipping()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_type = 'physical' OR NEW.order_type = 'mixed' THEN
    INSERT INTO physical_order_shipping (order_id)
    VALUES (NEW.id)
    ON CONFLICT (order_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-create digital_deliveries for digital order items
CREATE OR REPLACE FUNCTION auto_create_digital_delivery()
RETURNS TRIGGER AS $$
DECLARE
  v_order orders;
  v_product products;
  v_meta digital_product_meta;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = NEW.order_id;
  SELECT * INTO v_product FROM products WHERE id = NEW.product_id;
  
  IF v_product.product_type IN ('digital', 'bundle') THEN
    SELECT * INTO v_meta FROM digital_product_meta WHERE product_id = NEW.product_id;
    
    INSERT INTO digital_deliveries (
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
      encode(extensions.gen_random_bytes(32), 'hex'),
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
$$ LANGUAGE plpgsql;
```

---

## Data Migration Strategy

### Step 1: Move existing courier data to extension table
```sql
-- Migrate courier fields from orders to physical_order_shipping
INSERT INTO physical_order_shipping (
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
FROM orders 
WHERE courier_provider IS NOT NULL;
```

### Step 2: Set order_type based on shop_type
```sql
UPDATE orders o
SET order_type = CASE 
  WHEN s.shop_type = 'physical' THEN 'physical'::order_type
  WHEN s.shop_type = 'digital' THEN 'digital'::order_type
  ELSE 'physical'::order_type
END
FROM shops s
WHERE o.shop_id = s.id;
```

---

## ফাইল পরিবর্তন সারসংক্ষেপ

### Database Migration:
- 1 comprehensive migration file with all ENUMs, tables, indexes, triggers, RLS

### Frontend Updates:
- `src/hooks/useDigitalProducts.ts` - Digital product CRUD
- `src/hooks/usePaymentGateways.ts` - Payment gateway management
- `src/hooks/useDigitalDelivery.ts` - Delivery tracking
- `src/components/admin/products/DigitalProductForm.tsx` - Digital product editor
- `src/components/admin/payments/PaymentGatewaySetup.tsx` - Gateway config
- `src/pages/shop/ShopPayments.tsx` - Digital shop payments page

### Edge Functions:
- `generate-download-url/index.ts` - Signed URL generation
- `process-digital-delivery/index.ts` - Auto email/license delivery
- `payment-webhook/index.ts` - Unified payment webhook handler

---

## সুবিধাসমূহ

1. **Clean Separation**: Physical ও Digital সম্পূর্ণ আলাদা extension tables
2. **Flexible**: Bundle products (physical + digital) future support
3. **Secure**: RLS shop-level isolation
4. **Performant**: Proper indexes on all FK and search columns
5. **Automatic**: Triggers handle extension table creation
6. **Auditable**: Complete transaction history
7. **Scalable**: Ready for millions of orders

