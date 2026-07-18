-- Remove políticas permissivas anteriores
DROP POLICY IF EXISTS user_invites_select_authenticated ON public.user_invites;
DROP POLICY IF EXISTS user_invites_insert_authenticated ON public.user_invites;
DROP POLICY IF EXISTS user_invites_delete_authenticated ON public.user_invites;

-- SELECT: apenas admin/diretor
CREATE POLICY user_invites_select_admin ON public.user_invites
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor')
    )
  );

-- INSERT: apenas admin/diretor
CREATE POLICY user_invites_insert_admin ON public.user_invites
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor')
    )
  );

-- DELETE: apenas admin/diretor
CREATE POLICY user_invites_delete_admin ON public.user_invites
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor')
    )
  );
