-- Fix RLS policies for turmas: add 'admin' to allow admin users to manage turmas
-- The original policies in 20260619191517_remote_schema.sql only included
-- diretor, secretaria, and coordenacao but omitted admin.

DROP POLICY IF EXISTS turmas_delete_allowed_users ON public.turmas;
DROP POLICY IF EXISTS turmas_insert_allowed_users ON public.turmas;
DROP POLICY IF EXISTS turmas_update_allowed_users ON public.turmas;

CREATE POLICY turmas_delete_allowed_users ON public.turmas
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo_usuario = ANY (ARRAY['admin'::text, 'diretor'::text, 'secretaria'::text, 'coordenacao'::text])
    )
  );

CREATE POLICY turmas_insert_allowed_users ON public.turmas
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo_usuario = ANY (ARRAY['admin'::text, 'diretor'::text, 'secretaria'::text, 'coordenacao'::text])
    )
  );

CREATE POLICY turmas_update_allowed_users ON public.turmas
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo_usuario = ANY (ARRAY['admin'::text, 'diretor'::text, 'secretaria'::text, 'coordenacao'::text])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo_usuario = ANY (ARRAY['admin'::text, 'diretor'::text, 'secretaria'::text, 'coordenacao'::text])
    )
  );
