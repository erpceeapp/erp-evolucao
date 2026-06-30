-- Restringe profiles_insert_system para permitir apenas inserção do próprio perfil
-- Antes: WITH CHECK (true) — qualquer autenticado podia criar perfil com qualquer tipo_usuario
-- Depois: WITH CHECK (id = auth.uid()) — só pode criar o próprio perfil

DROP POLICY IF EXISTS profiles_insert_system ON public.profiles;

CREATE POLICY profiles_insert_system ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

COMMENT ON POLICY profiles_insert_system ON public.profiles IS 'Permite que o usuario crie seu proprio perfil durante o cadastro';
