DROP POLICY IF EXISTS avisos_aluno_delete_owner ON public.avisos_aluno;

CREATE POLICY avisos_aluno_delete_staff ON public.avisos_aluno
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor', 'secretaria', 'coordenacao', 'professor')
    )
  );
