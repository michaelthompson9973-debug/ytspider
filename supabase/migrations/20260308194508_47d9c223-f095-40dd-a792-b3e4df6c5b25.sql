
-- RPC: get_admin_shops_overview
-- Returns paginated, searchable shop list with owner profile data
-- SECURITY: Only callable by platform admins (is_admin())

CREATE OR REPLACE FUNCTION public.get_admin_shops_overview(
  _limit int DEFAULT 20,
  _offset int DEFAULT 0,
  _search text DEFAULT '',
  _status_filter text DEFAULT ''
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  plan text,
  status text,
  is_active boolean,
  shop_type text,
  logo_url text,
  owner_id uuid,
  owner_name text,
  owner_email text,
  grace_period_ends_at timestamptz,
  created_at timestamptz,
  product_count bigint,
  landing_page_count bigint,
  order_count bigint,
  team_member_count bigint,
  total_rows bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _total bigint;
BEGIN
  -- Enforce admin-only access
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  -- Count total matching rows for pagination metadata
  SELECT count(*) INTO _total
  FROM public.shops s
  LEFT JOIN public.profiles p ON p.id = s.owner_id
  WHERE (
    _search = '' 
    OR s.name ILIKE '%' || _search || '%'
    OR s.slug ILIKE '%' || _search || '%'
    OR p.email ILIKE '%' || _search || '%'
    OR p.full_name ILIKE '%' || _search || '%'
  )
  AND (
    _status_filter = '' 
    OR s.status::text = _status_filter
  );

  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.slug,
    s.plan,
    s.status::text,
    s.is_active,
    s.shop_type,
    s.logo_url,
    s.owner_id,
    p.full_name AS owner_name,
    p.email AS owner_email,
    s.grace_period_ends_at,
    s.created_at,
    (SELECT count(*) FROM public.products pr WHERE pr.shop_id = s.id) AS product_count,
    (SELECT count(*) FROM public.landing_pages lp WHERE lp.shop_id = s.id) AS landing_page_count,
    (SELECT count(*) FROM public.orders o WHERE o.shop_id = s.id) AS order_count,
    (SELECT count(*) FROM public.shop_members sm WHERE sm.shop_id = s.id AND sm.accepted_at IS NOT NULL) AS team_member_count,
    _total AS total_rows
  FROM public.shops s
  LEFT JOIN public.profiles p ON p.id = s.owner_id
  WHERE (
    _search = '' 
    OR s.name ILIKE '%' || _search || '%'
    OR s.slug ILIKE '%' || _search || '%'
    OR p.email ILIKE '%' || _search || '%'
    OR p.full_name ILIKE '%' || _search || '%'
  )
  AND (
    _status_filter = '' 
    OR s.status::text = _status_filter
  )
  ORDER BY s.created_at DESC
  LIMIT _limit
  OFFSET _offset;
END;
$$;
