-- Restringe INSERT e UPDATE na tabela escola para roles administrativas
-- Antes: qualquer autenticado podia inserir/alterar dados da escola

DROP POLICY IF EXISTS escola_insert_allowed ON public.escola;
DROP POLICY IF EXISTS escola_update_allowed ON public.escola;

CREATE POLICY escola_insert_allowed ON public.escola
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor', 'coordenacao', 'secretaria')
    )
  );

CREATE POLICY escola_update_allowed ON public.escola
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor', 'coordenacao', 'secretaria')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor', 'coordenacao', 'secretaria')
    )
  );

COMMENT ON POLICY escola_insert_allowed ON public.escola IS 'Permite INSERT apenas para admin/diretor/coordenacao/secretaria';
COMMENT ON POLICY escola_update_allowed ON public.escola IS 'Permite UPDATE apenas para admin/diretor/coordenacao/secretaria';
