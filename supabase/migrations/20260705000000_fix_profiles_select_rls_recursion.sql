-- Fix RLS policy for profiles SELECT to avoid infinite recursion.
-- The previous policy (20260704000000) used a subquery on profiles which
-- triggered RLS recursively. Switch to JWT metadata approach (matching the
-- original policy pattern) with extended roles.

DROP POLICY IF EXISTS "Admin staff can view all profiles" ON public.profiles;

CREATE POLICY "Admin staff can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'tipo_usuario') = ANY (ARRAY['admin'::text, 'diretor'::text, 'secretaria'::text, 'coordenacao'::text])
    OR
    (auth.jwt() -> 'user_metadata' ->> 'tipo_usuario') = ANY (ARRAY['admin'::text, 'diretor'::text, 'secretaria'::text, 'coordenacao'::text])
  );
