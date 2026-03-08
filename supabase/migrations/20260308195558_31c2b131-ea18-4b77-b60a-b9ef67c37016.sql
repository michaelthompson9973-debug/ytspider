
-- Migration 2: Founder upgrade, safeguard trigger, functions, RPCs

-- Upgrade the FIRST admin to super_admin (the founder)
UPDATE public.user_roles
SET role = 'super_admin'
WHERE id = (
  SELECT id FROM public.user_roles
  WHERE role = 'admin'
  ORDER BY created_at ASC
  LIMIT 1
);

-- Founder Safeguard Trigger
CREATE OR REPLACE FUNCTION public.protect_super_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD.role = 'super_admin' THEN
    RAISE EXCEPTION 'FOUNDER_PROTECTED: Cannot delete the platform founder account';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.role = 'super_admin' AND NEW.role != 'super_admin' THEN
    RAISE EXCEPTION 'FOUNDER_PROTECTED: Cannot demote the platform founder account';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_super_admin ON public.user_roles;
CREATE TRIGGER trg_protect_super_admin
  BEFORE UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_super_admin();

-- Update is_admin() to recognize super_admin + admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
  )
$$;

-- New: is_super_admin()
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
  )
$$;

-- Get platform staff list
CREATE OR REPLACE FUNCTION public.get_platform_staff()
RETURNS TABLE (
  role_id uuid,
  user_id uuid,
  role text,
  granted_at timestamptz,
  user_name text,
  user_email text,
  avatar_url text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    ur.id AS role_id,
    ur.user_id,
    ur.role::text,
    ur.created_at AS granted_at,
    p.full_name AS user_name,
    p.email AS user_email,
    p.avatar_url
  FROM public.user_roles ur
  LEFT JOIN public.profiles p ON p.id = ur.user_id
  ORDER BY
    CASE ur.role
      WHEN 'super_admin' THEN 0
      WHEN 'admin' THEN 1
      WHEN 'support' THEN 2
      ELSE 3
    END,
    ur.created_at ASC;
END;
$$;

-- Add platform staff (hierarchy-enforced)
CREATE OR REPLACE FUNCTION public.add_platform_staff(_email text, _role text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _target_user_id uuid;
  _caller_role text;
BEGIN
  SELECT role::text INTO _caller_role
  FROM public.user_roles WHERE user_id = auth.uid()
  ORDER BY CASE role WHEN 'super_admin' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END
  LIMIT 1;

  IF _caller_role IS NULL THEN
    RAISE EXCEPTION 'ACCESS_DENIED';
  END IF;

  IF _role = 'super_admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN', 'message', 'Cannot create another super_admin.');
  END IF;

  IF _role = 'admin' AND _caller_role != 'super_admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN', 'message', 'Only the founder can assign admin roles.');
  END IF;

  IF _role = 'support' AND _caller_role NOT IN ('super_admin', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN', 'message', 'Insufficient privileges.');
  END IF;

  SELECT id INTO _target_user_id FROM public.profiles WHERE email = _email;
  IF _target_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND', 'message', 'No account found with this email. The user must register first.');
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _target_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_STAFF', 'message', 'This user already has a platform role.');
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (_target_user_id, _role::app_role);
  RETURN jsonb_build_object('success', true, 'user_id', _target_user_id, 'role', _role);
END;
$$;

-- Remove platform staff (with trigger safeguard)
CREATE OR REPLACE FUNCTION public.remove_platform_staff(_role_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _target_role text;
  _caller_role text;
BEGIN
  SELECT role::text INTO _caller_role
  FROM public.user_roles WHERE user_id = auth.uid()
  ORDER BY CASE role WHEN 'super_admin' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END
  LIMIT 1;

  IF _caller_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'ACCESS_DENIED');
  END IF;

  SELECT role::text INTO _target_role FROM public.user_roles WHERE id = _role_id;
  IF _target_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND');
  END IF;

  IF _target_role = 'super_admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'FOUNDER_PROTECTED', 'message', 'The founder account cannot be removed.');
  END IF;

  IF _target_role = 'admin' AND _caller_role != 'super_admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN', 'message', 'Only the founder can remove admin staff.');
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_roles WHERE id = _role_id AND user_id = auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'SELF_REMOVAL', 'message', 'You cannot remove your own platform role.');
  END IF;

  DELETE FROM public.user_roles WHERE id = _role_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Change platform staff role
CREATE OR REPLACE FUNCTION public.change_platform_staff_role(_role_id uuid, _new_role text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _target_role text;
  _caller_role text;
BEGIN
  SELECT role::text INTO _caller_role
  FROM public.user_roles WHERE user_id = auth.uid()
  ORDER BY CASE role WHEN 'super_admin' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END
  LIMIT 1;

  IF _caller_role IS NULL OR _caller_role NOT IN ('super_admin', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'ACCESS_DENIED');
  END IF;

  SELECT role::text INTO _target_role FROM public.user_roles WHERE id = _role_id;

  IF _target_role = 'super_admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'FOUNDER_PROTECTED');
  END IF;

  IF _new_role = 'super_admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN', 'message', 'Cannot promote to super_admin.');
  END IF;

  IF _new_role = 'admin' AND _caller_role != 'super_admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN', 'message', 'Only the founder can assign admin roles.');
  END IF;

  UPDATE public.user_roles SET role = _new_role::app_role WHERE id = _role_id;
  RETURN jsonb_build_object('success', true);
END;
$$;
