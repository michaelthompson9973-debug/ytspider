
CREATE OR REPLACE FUNCTION public.get_user_shops()
 RETURNS SETOF shops
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Platform admins (super_admin, admin) can see ALL shops
  SELECT s.*
  FROM public.shops s
  WHERE public.is_admin()
    AND s.is_active = true

  UNION

  -- Regular users see only shops they are members of
  SELECT s.*
  FROM public.shops s
  INNER JOIN public.shop_members sm ON sm.shop_id = s.id
  WHERE sm.user_id = auth.uid()
    AND sm.accepted_at IS NOT NULL
    AND s.is_active = true
    AND NOT public.is_admin()

  ORDER BY name;
$function$;
