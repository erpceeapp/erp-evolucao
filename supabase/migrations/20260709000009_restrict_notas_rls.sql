-- Remove políticas permissivas anteriores
DROP POLICY IF EXISTS "Authenticated users can insert notas" ON public.notas;
DROP POLICY IF EXISTS "Authenticated users can read notas" ON public.notas;
DROP POLICY IF EXISTS "Authenticated users can update notas" ON public.notas;
DROP POLICY IF EXISTS notas_delete_authenticated ON public.notas;
DROP POLICY IF EXISTS notas_insert_authenticated ON public.notas;
DROP POLICY IF EXISTS notas_select_authenticated ON public.notas;
DROP POLICY IF EXISTS notas_update_authenticated ON public.notas;

-- SELECT: staff (admin/diretor/secretaria/coordenacao) ou professor da disciplina
CREATE POLICY notas_select_staff ON public.notas
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor', 'secretaria', 'coordenacao')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.professores p
      JOIN public.professor_disciplinas pd ON pd.professor_id = p.id
      WHERE p.user_id = auth.uid()
      AND pd.disciplina_id = notas.disciplina_id
    )
  );

-- INSERT: staff (admin/diretor/secretaria/coordenacao) ou professor da disciplina
CREATE POLICY notas_insert_staff ON public.notas
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor', 'secretaria', 'coordenacao')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.professores p
      JOIN public.professor_disciplinas pd ON pd.professor_id = p.id
      WHERE p.user_id = auth.uid()
      AND pd.disciplina_id = notas.disciplina_id
    )
  );

-- UPDATE: staff (admin/diretor/secretaria/coordenacao) ou professor da disciplina
CREATE POLICY notas_update_staff ON public.notas
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor', 'secretaria', 'coordenacao')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.professores p
      JOIN public.professor_disciplinas pd ON pd.professor_id = p.id
      WHERE p.user_id = auth.uid()
      AND pd.disciplina_id = notas.disciplina_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor', 'secretaria', 'coordenacao')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.professores p
      JOIN public.professor_disciplinas pd ON pd.professor_id = p.id
      WHERE p.user_id = auth.uid()
      AND pd.disciplina_id = notas.disciplina_id
    )
  );

-- DELETE: apenas admin/diretor
CREATE POLICY notas_delete_admin ON public.notas
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor')
    )
  );
