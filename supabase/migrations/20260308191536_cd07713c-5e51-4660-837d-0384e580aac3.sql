
-- =====================================================
-- SECURITY PATCH: Missing RLS policies
-- =====================================================

-- 1. order_items: UPDATE policy (manager+ can update)
CREATE POLICY "Shop managers can update order items"
ON public.order_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
      AND has_shop_access(o.shop_id, 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
      AND has_shop_access(o.shop_id, 'manager')
  )
);

-- 2. order_items: DELETE policy (manager+ can delete)
CREATE POLICY "Shop managers can delete order items"
ON public.order_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
      AND has_shop_access(o.shop_id, 'manager')
  )
);

-- 3. messenger_conversations: DELETE policy (admin+ can delete)
CREATE POLICY "Shop admins can delete messenger conversations"
ON public.messenger_conversations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM messenger_connections mc
    WHERE mc.id = messenger_conversations.connection_id
      AND has_shop_access(mc.shop_id, 'admin')
  )
);

-- 4. messenger_messages: UPDATE policy (support+ can update, e.g. mark read)
CREATE POLICY "Shop support can update messenger messages"
ON public.messenger_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM messenger_connections mc
    WHERE mc.id = messenger_messages.connection_id
      AND has_shop_access(mc.shop_id, 'support')
  )
);

-- 5. messenger_messages: DELETE policy (admin+ can delete)
CREATE POLICY "Shop admins can delete messenger messages"
ON public.messenger_messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM messenger_connections mc
    WHERE mc.id = messenger_messages.connection_id
      AND has_shop_access(mc.shop_id, 'admin')
  )
);

-- 6. order_status_history: UPDATE policy (support+ can update notes)
CREATE POLICY "Shop support can update order status history"
ON public.order_status_history
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_status_history.order_id
      AND has_shop_access(o.shop_id, 'support')
  )
);

-- 7. order_status_history: DELETE policy (admin+ can delete)
CREATE POLICY "Shop admins can delete order status history"
ON public.order_status_history
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_status_history.order_id
      AND has_shop_access(o.shop_id, 'admin')
  )
);
