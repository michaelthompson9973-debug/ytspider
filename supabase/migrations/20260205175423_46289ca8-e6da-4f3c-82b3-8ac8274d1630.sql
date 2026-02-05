
-- =====================================================
-- Update RLS policies to use has_shop_access() for shop-scoped tables
-- This enables shop owners/members to access their shop's data
-- =====================================================

-- PRODUCTS TABLE
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;

CREATE POLICY "Shop members can manage products"
ON public.products FOR ALL
USING (has_shop_access(shop_id, 'editor'))
WITH CHECK (has_shop_access(shop_id, 'editor'));

-- ORDERS TABLE
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;

CREATE POLICY "Shop members can view orders"
ON public.orders FOR SELECT
USING (has_shop_access(shop_id, 'viewer'));

CREATE POLICY "Shop members can update orders"
ON public.orders FOR UPDATE
USING (has_shop_access(shop_id, 'support'));

CREATE POLICY "Shop members can delete orders"
ON public.orders FOR DELETE
USING (has_shop_access(shop_id, 'manager'));

-- LANDING PAGES TABLE
DROP POLICY IF EXISTS "Admins can delete landing pages" ON public.landing_pages;
DROP POLICY IF EXISTS "Admins can insert landing pages" ON public.landing_pages;
DROP POLICY IF EXISTS "Admins can update landing pages" ON public.landing_pages;

CREATE POLICY "Shop members can manage landing pages"
ON public.landing_pages FOR ALL
USING (has_shop_access(shop_id, 'editor'))
WITH CHECK (has_shop_access(shop_id, 'editor'));

-- LANDING PAGE SECTIONS
DROP POLICY IF EXISTS "Admins can delete landing page sections" ON public.landing_page_sections;
DROP POLICY IF EXISTS "Admins can insert landing page sections" ON public.landing_page_sections;
DROP POLICY IF EXISTS "Admins can update landing page sections" ON public.landing_page_sections;

CREATE POLICY "Shop members can manage landing page sections"
ON public.landing_page_sections FOR ALL
USING (EXISTS (
  SELECT 1 FROM landing_pages lp 
  WHERE lp.id = landing_page_sections.landing_page_id 
  AND has_shop_access(lp.shop_id, 'editor')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM landing_pages lp 
  WHERE lp.id = landing_page_sections.landing_page_id 
  AND has_shop_access(lp.shop_id, 'editor')
));

-- LANDING PAGE THEME
DROP POLICY IF EXISTS "Admins can delete landing page theme" ON public.landing_page_theme;
DROP POLICY IF EXISTS "Admins can insert landing page theme" ON public.landing_page_theme;
DROP POLICY IF EXISTS "Admins can update landing page theme" ON public.landing_page_theme;

CREATE POLICY "Shop members can manage landing page theme"
ON public.landing_page_theme FOR ALL
USING (EXISTS (
  SELECT 1 FROM landing_pages lp 
  WHERE lp.id = landing_page_theme.landing_page_id 
  AND has_shop_access(lp.shop_id, 'editor')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM landing_pages lp 
  WHERE lp.id = landing_page_theme.landing_page_id 
  AND has_shop_access(lp.shop_id, 'editor')
));

-- LANDING PAGE CHECKOUT SETTINGS
DROP POLICY IF EXISTS "Admins can manage checkout settings" ON public.landing_page_checkout_settings;

CREATE POLICY "Shop members can manage checkout settings"
ON public.landing_page_checkout_settings FOR ALL
USING (EXISTS (
  SELECT 1 FROM landing_pages lp 
  WHERE lp.id = landing_page_checkout_settings.landing_page_id 
  AND has_shop_access(lp.shop_id, 'editor')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM landing_pages lp 
  WHERE lp.id = landing_page_checkout_settings.landing_page_id 
  AND has_shop_access(lp.shop_id, 'editor')
));

-- LANDING PAGE PRODUCTS
DROP POLICY IF EXISTS "Admins can manage landing_page_products" ON public.landing_page_products;

CREATE POLICY "Shop members can manage landing page products"
ON public.landing_page_products FOR ALL
USING (EXISTS (
  SELECT 1 FROM landing_pages lp 
  WHERE lp.id = landing_page_products.landing_page_id 
  AND has_shop_access(lp.shop_id, 'editor')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM landing_pages lp 
  WHERE lp.id = landing_page_products.landing_page_id 
  AND has_shop_access(lp.shop_id, 'editor')
));

-- MEDIA TABLE
DROP POLICY IF EXISTS "Admins can delete media" ON public.media;
DROP POLICY IF EXISTS "Admins can insert media" ON public.media;
DROP POLICY IF EXISTS "Admins can update media" ON public.media;
DROP POLICY IF EXISTS "Admins can view all media" ON public.media;

CREATE POLICY "Shop members can manage media"
ON public.media FOR ALL
USING (has_shop_access(shop_id, 'editor'))
WITH CHECK (has_shop_access(shop_id, 'editor'));

-- MESSENGER CONNECTIONS
DROP POLICY IF EXISTS "Admins can manage messenger_connections" ON public.messenger_connections;

CREATE POLICY "Shop members can manage messenger connections"
ON public.messenger_connections FOR ALL
USING (has_shop_access(shop_id, 'admin'))
WITH CHECK (has_shop_access(shop_id, 'admin'));

-- MESSENGER CONVERSATIONS
DROP POLICY IF EXISTS "Admins can manage messenger_conversations" ON public.messenger_conversations;

CREATE POLICY "Shop members can view messenger conversations"
ON public.messenger_conversations FOR SELECT
USING (EXISTS (
  SELECT 1 FROM messenger_connections mc 
  WHERE mc.id = messenger_conversations.connection_id 
  AND has_shop_access(mc.shop_id, 'support')
));

CREATE POLICY "Shop members can update messenger conversations"
ON public.messenger_conversations FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM messenger_connections mc 
  WHERE mc.id = messenger_conversations.connection_id 
  AND has_shop_access(mc.shop_id, 'support')
));

-- MESSENGER MESSAGES
DROP POLICY IF EXISTS "Admins can manage messenger_messages" ON public.messenger_messages;

CREATE POLICY "Shop members can view messenger messages"
ON public.messenger_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM messenger_connections mc 
  WHERE mc.id = messenger_messages.connection_id 
  AND has_shop_access(mc.shop_id, 'support')
));

CREATE POLICY "Shop members can send messenger messages"
ON public.messenger_messages FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM messenger_connections mc 
  WHERE mc.id = messenger_messages.connection_id 
  AND has_shop_access(mc.shop_id, 'support')
));

-- MESSENGER AGENTS
DROP POLICY IF EXISTS "Admins can manage messenger_agents" ON public.messenger_agents;

CREATE POLICY "Shop members can manage messenger agents"
ON public.messenger_agents FOR ALL
USING (has_shop_access(shop_id, 'admin'))
WITH CHECK (has_shop_access(shop_id, 'admin'));

-- COURIER CREDENTIALS
DROP POLICY IF EXISTS "Admins can delete courier_credentials" ON public.courier_credentials;
DROP POLICY IF EXISTS "Admins can insert courier_credentials" ON public.courier_credentials;
DROP POLICY IF EXISTS "Admins can update courier_credentials" ON public.courier_credentials;
DROP POLICY IF EXISTS "Admins can view courier_credentials" ON public.courier_credentials;

CREATE POLICY "Shop members can manage courier credentials"
ON public.courier_credentials FOR ALL
USING (has_shop_access(shop_id, 'admin'))
WITH CHECK (has_shop_access(shop_id, 'admin'));

-- API KEYS
DROP POLICY IF EXISTS "Admins can delete api_keys" ON public.api_keys;
DROP POLICY IF EXISTS "Admins can insert api_keys" ON public.api_keys;
DROP POLICY IF EXISTS "Admins can update api_keys" ON public.api_keys;
DROP POLICY IF EXISTS "Admins can view api_keys" ON public.api_keys;

CREATE POLICY "Shop members can manage api keys"
ON public.api_keys FOR ALL
USING (has_shop_access(shop_id, 'admin'))
WITH CHECK (has_shop_access(shop_id, 'admin'));

-- AI TRAINING DATA
DROP POLICY IF EXISTS "Admins can manage ai_training_data" ON public.ai_training_data;

CREATE POLICY "Shop members can manage ai training data"
ON public.ai_training_data FOR ALL
USING (has_shop_access(shop_id, 'manager'))
WITH CHECK (has_shop_access(shop_id, 'manager'));

-- AUTO REPLY RULES
DROP POLICY IF EXISTS "Admins can manage auto_reply_rules" ON public.auto_reply_rules;

CREATE POLICY "Shop members can manage auto reply rules"
ON public.auto_reply_rules FOR ALL
USING (has_shop_access(shop_id, 'manager'))
WITH CHECK (has_shop_access(shop_id, 'manager'));

-- ALLOWED DOMAINS
DROP POLICY IF EXISTS "Admins can manage allowed_domains" ON public.allowed_domains;

CREATE POLICY "Shop members can manage allowed domains"
ON public.allowed_domains FOR ALL
USING (has_shop_access(shop_id, 'admin'))
WITH CHECK (has_shop_access(shop_id, 'admin'));

-- COMPONENT LIBRARY
DROP POLICY IF EXISTS "Admins can delete components" ON public.component_library;
DROP POLICY IF EXISTS "Admins can insert components" ON public.component_library;
DROP POLICY IF EXISTS "Admins can update components" ON public.component_library;
DROP POLICY IF EXISTS "Admins can view all components" ON public.component_library;

CREATE POLICY "Shop members can manage components"
ON public.component_library FOR ALL
USING (has_shop_access(shop_id, 'editor'))
WITH CHECK (has_shop_access(shop_id, 'editor'));

-- CUSTOMER LABELS
DROP POLICY IF EXISTS "Admins can manage customer_labels" ON public.customer_labels;

CREATE POLICY "Shop members can manage customer labels"
ON public.customer_labels FOR ALL
USING (has_shop_access(shop_id, 'support'))
WITH CHECK (has_shop_access(shop_id, 'support'));

-- CUSTOMER PROFILES
DROP POLICY IF EXISTS "Admins can manage customer_profiles" ON public.customer_profiles;

CREATE POLICY "Shop members can manage customer profiles"
ON public.customer_profiles FOR ALL
USING (has_shop_access(shop_id, 'support'))
WITH CHECK (has_shop_access(shop_id, 'support'));

-- QUICK REPLIES
DROP POLICY IF EXISTS "Admins can manage quick_replies" ON public.quick_replies;

CREATE POLICY "Shop members can manage quick replies"
ON public.quick_replies FOR ALL
USING (has_shop_access(shop_id, 'support'))
WITH CHECK (has_shop_access(shop_id, 'support'));

-- SHOP SETTINGS
DROP POLICY IF EXISTS "Admins can manage shop_settings" ON public.shop_settings;

CREATE POLICY "Shop members can manage shop settings"
ON public.shop_settings FOR ALL
USING (has_shop_access(shop_id, 'admin'))
WITH CHECK (has_shop_access(shop_id, 'admin'));

-- ORDER ITEMS (via order_id -> orders -> shop_id)
CREATE POLICY "Shop members can view order items"
ON public.order_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM orders o 
  WHERE o.id = order_items.order_id 
  AND has_shop_access(o.shop_id, 'viewer')
));

-- ORDER STATUS HISTORY (via order_id -> orders -> shop_id)
CREATE POLICY "Shop members can view order status history"
ON public.order_status_history FOR SELECT
USING (EXISTS (
  SELECT 1 FROM orders o 
  WHERE o.id = order_status_history.order_id 
  AND has_shop_access(o.shop_id, 'viewer')
));

CREATE POLICY "Shop members can insert order status history"
ON public.order_status_history FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM orders o 
  WHERE o.id = order_status_history.order_id 
  AND has_shop_access(o.shop_id, 'support')
));

-- CUSTOMER LABEL ASSIGNMENTS (via customer_id -> customer_profiles -> shop_id)
DROP POLICY IF EXISTS "Admins can manage customer_label_assignments" ON public.customer_label_assignments;

CREATE POLICY "Shop members can manage customer label assignments"
ON public.customer_label_assignments FOR ALL
USING (EXISTS (
  SELECT 1 FROM customer_profiles cp 
  WHERE cp.id = customer_label_assignments.customer_id 
  AND has_shop_access(cp.shop_id, 'support')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM customer_profiles cp 
  WHERE cp.id = customer_label_assignments.customer_id 
  AND has_shop_access(cp.shop_id, 'support')
));

-- AD SOURCES (via conversation_id -> messenger_conversations -> connection -> shop)
DROP POLICY IF EXISTS "Admins can manage ad_sources" ON public.ad_sources;

CREATE POLICY "Shop members can manage ad sources"
ON public.ad_sources FOR ALL
USING (EXISTS (
  SELECT 1 FROM messenger_conversations mc
  JOIN messenger_connections conn ON conn.id = mc.connection_id
  WHERE mc.id = ad_sources.conversation_id
  AND has_shop_access(conn.shop_id, 'manager')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM messenger_conversations mc
  JOIN messenger_connections conn ON conn.id = mc.connection_id
  WHERE mc.id = ad_sources.conversation_id
  AND has_shop_access(conn.shop_id, 'manager')
));

-- CONVERSATION TAGS
DROP POLICY IF EXISTS "Admins can manage conversation_tags" ON public.conversation_tags;

CREATE POLICY "Shop members can manage conversation tags"
ON public.conversation_tags FOR ALL
USING (EXISTS (
  SELECT 1 FROM messenger_conversations mc
  JOIN messenger_connections conn ON conn.id = mc.connection_id
  WHERE mc.id = conversation_tags.conversation_id
  AND has_shop_access(conn.shop_id, 'support')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM messenger_conversations mc
  JOIN messenger_connections conn ON conn.id = mc.connection_id
  WHERE mc.id = conversation_tags.conversation_id
  AND has_shop_access(conn.shop_id, 'support')
));

-- CONVERSATION ASSIGNMENTS
DROP POLICY IF EXISTS "Admins can manage conversation_assignments" ON public.conversation_assignments;

CREATE POLICY "Shop members can manage conversation assignments"
ON public.conversation_assignments FOR ALL
USING (EXISTS (
  SELECT 1 FROM messenger_conversations mc
  JOIN messenger_connections conn ON conn.id = mc.connection_id
  WHERE mc.id = conversation_assignments.conversation_id
  AND has_shop_access(conn.shop_id, 'manager')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM messenger_conversations mc
  JOIN messenger_connections conn ON conn.id = mc.connection_id
  WHERE mc.id = conversation_assignments.conversation_id
  AND has_shop_access(conn.shop_id, 'manager')
));

-- CUSTOMER COURIER HISTORY (no shop_id - keep public read, admin write)
DROP POLICY IF EXISTS "Admins can manage customer_courier_history" ON public.customer_courier_history;

CREATE POLICY "Authenticated users can view courier history"
ON public.customer_courier_history FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Platform admins can manage courier history"
ON public.customer_courier_history FOR ALL
USING (is_admin())
WITH CHECK (is_admin());
