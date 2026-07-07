-- Use SECURITY DEFINER function get_user_tipo_usuario() instead of JWT metadata
-- for profiles SELECT RLS policy. This avoids:
--   1. Infinite recursion (subquery approach)
--   2. Fragile JWT metadata that may not contain tipo_usuario (JWT approach)
-- The function is SECURITY DEFINER so it bypasses RLS safely.

DROP POLICY IF EXISTS "Admin staff can view all profiles" ON public.profiles;

CREATE POLICY "Admin staff can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.get_user_tipo_usuario() = ANY (ARRAY['admin', 'diretor', 'secretaria', 'coordenacao'])
  );
