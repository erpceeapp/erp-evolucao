-- Fix RLS policy for profiles SELECT to allow admin, diretor, coordenacao, and secretaria
-- to view all profiles (not just their own).
-- The original policy only allowed 'admin'.

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admin staff can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo_usuario = ANY (ARRAY['admin'::text, 'diretor'::text, 'secretaria'::text, 'coordenacao'::text])
    )
  );
