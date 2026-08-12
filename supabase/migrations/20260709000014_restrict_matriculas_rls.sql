-- =============================================================
-- Restringe RLS de matriculas (antes: qualquer authenticated)
-- =============================================================

DROP POLICY IF EXISTS matriculas_delete_authenticated ON public.matriculas;
DROP POLICY IF EXISTS matriculas_insert_authenticated ON public.matriculas;
DROP POLICY IF EXISTS matriculas_select_authenticated ON public.matriculas;
DROP POLICY IF EXISTS matriculas_update_authenticated ON public.matriculas;

-- SELECT: qualquer membro da staff
CREATE POLICY matriculas_select_staff ON public.matriculas
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor', 'secretaria', 'coordenacao', 'professor')
    )
  );

-- INSERT: apenas gestão (sem professor)
CREATE POLICY matriculas_insert_staff ON public.matriculas
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor', 'secretaria', 'coordenacao')
    )
  );

-- UPDATE: apenas gestão (sem professor)
CREATE POLICY matriculas_update_staff ON public.matriculas
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor', 'secretaria', 'coordenacao')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor', 'secretaria', 'coordenacao')
    )
  );

-- DELETE: apenas admin/diretor
CREATE POLICY matriculas_delete_admin ON public.matriculas
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor')
    )
  );