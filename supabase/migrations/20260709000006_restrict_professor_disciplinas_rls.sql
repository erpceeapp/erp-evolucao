-- Remove políticas permissivas anteriores
DROP POLICY IF EXISTS "Permitir atualização de professor_disciplinas para usuários " ON public.professor_disciplinas;
DROP POLICY IF EXISTS "Permitir exclusão de professor_disciplinas para usuários aute" ON public.professor_disciplinas;
DROP POLICY IF EXISTS "Permitir inserção de professor_disciplinas para usuários aut" ON public.professor_disciplinas;
DROP POLICY IF EXISTS "Permitir leitura de professor_disciplinas para usuários autent" ON public.professor_disciplinas;

-- SELECT: qualquer authenticated pode ler (dados não sensíveis, usado para lookup)
CREATE POLICY professor_disciplinas_select_all ON public.professor_disciplinas
  FOR SELECT TO authenticated
  USING (true);

-- INSERT: apenas admin/diretor/coordenacao
CREATE POLICY professor_disciplinas_insert_admin ON public.professor_disciplinas
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor', 'coordenacao')
    )
  );

-- UPDATE: apenas admin/diretor/coordenacao
CREATE POLICY professor_disciplinas_update_admin ON public.professor_disciplinas
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor', 'coordenacao')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor', 'coordenacao')
    )
  );

-- DELETE: apenas admin/diretor/coordenacao
CREATE POLICY professor_disciplinas_delete_admin ON public.professor_disciplinas
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor', 'coordenacao')
    )
  );
