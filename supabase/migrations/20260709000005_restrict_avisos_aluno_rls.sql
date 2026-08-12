-- Remove políticas permissivas anteriores
DROP POLICY IF EXISTS avisos_aluno_delete_authenticated ON public.avisos_aluno;
DROP POLICY IF EXISTS avisos_aluno_insert_authenticated ON public.avisos_aluno;
DROP POLICY IF EXISTS avisos_aluno_select_authenticated ON public.avisos_aluno;
DROP POLICY IF EXISTS avisos_aluno_update_authenticated ON public.avisos_aluno;

-- SELECT: staff (todas as funções) ou criador do aviso
CREATE POLICY avisos_aluno_select_staff ON public.avisos_aluno
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor', 'secretaria', 'coordenacao', 'professor')
    )
  );

-- INSERT: qualquer membro da staff
CREATE POLICY avisos_aluno_insert_staff ON public.avisos_aluno
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor', 'secretaria', 'coordenacao', 'professor')
    )
  );

-- UPDATE: criador do aviso ou admin/diretor
CREATE POLICY avisos_aluno_update_owner ON public.avisos_aluno
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor')
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor')
    )
  );

-- DELETE: criador do aviso ou admin/diretor
CREATE POLICY avisos_aluno_delete_owner ON public.avisos_aluno
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor')
    )
  );
