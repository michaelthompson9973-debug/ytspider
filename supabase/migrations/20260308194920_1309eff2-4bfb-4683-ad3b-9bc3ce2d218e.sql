
-- Single RPC that returns both current usage and dynamic plan limits
-- Eliminates the need for hardcoded PLAN_LIMITS on the frontend

CREATE OR REPLACE FUNCTION public.get_shop_quota_status(_shop_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _plan text;
  _result jsonb;
  _limits record;
  _product_count bigint;
  _page_count bigint;
  _team_count bigint;
  _order_count bigint;
  _start_of_month timestamptz;
BEGIN
  -- Must have shop access
  IF NOT (public.has_shop_access(_shop_id, 'viewer') OR public.is_admin()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Get shop plan
  SELECT plan INTO _plan FROM public.shops WHERE id = _shop_id;
  IF _plan IS NULL THEN
    RETURN jsonb_build_object('error', 'Shop not found');
  END IF;

  -- Get limits from pricing_plans (dynamic, not hardcoded)
  SELECT * INTO _limits FROM public.pricing_plans
    WHERE slug = _plan AND is_active = true
    ORDER BY created_at DESC LIMIT 1;

  -- Count current usage (optimized parallel-safe queries)
  SELECT count(*) INTO _product_count FROM public.products WHERE shop_id = _shop_id;
  SELECT count(*) INTO _page_count FROM public.landing_pages WHERE shop_id = _shop_id;
  SELECT count(*) INTO _team_count FROM public.shop_members WHERE shop_id = _shop_id AND accepted_at IS NOT NULL;
  
  _start_of_month := date_trunc('month', now());
  SELECT count(*) INTO _order_count FROM public.orders WHERE shop_id = _shop_id AND created_at >= _start_of_month;

  RETURN jsonb_build_object(
    'plan', _plan,
    'resources', jsonb_build_object(
      'products', jsonb_build_object(
        'current', _product_count,
        'limit', COALESCE(_limits.max_products, 50)
      ),
      'landing_pages', jsonb_build_object(
        'current', _page_count,
        'limit', COALESCE(_limits.max_landing_pages, 10)
      ),
      'team_members', jsonb_build_object(
        'current', _team_count,
        'limit', COALESCE(_limits.max_team_members, 2)
      ),
      'orders', jsonb_build_object(
        'current', _order_count,
        'limit', COALESCE(_limits.max_orders_per_month, 100)
      )
    )
  );
END;
$$;
