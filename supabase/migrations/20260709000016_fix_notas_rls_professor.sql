-- =============================================================
-- Corrige RLS de notas: o vínculo professor-disciplina-turma real
-- está em turma_disciplinas (não professor_disciplinas), e muitos
-- professores têm user_id NULL (vincular por email como fallback).
-- =============================================================

DROP POLICY IF EXISTS notas_select_staff ON public.notas;
DROP POLICY IF EXISTS notas_insert_staff ON public.notas;
DROP POLICY IF EXISTS notas_update_staff ON public.notas;
DROP POLICY IF EXISTS notas_delete_admin ON public.notas;

-- SELECT: staff ou professor que leciona a disciplina na turma do aluno
CREATE POLICY notas_select_staff ON public.notas
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor', 'secretaria', 'coordenacao')
    )
    OR EXISTS (
      SELECT 1
      FROM public.turma_disciplinas td
      JOIN public.professores p ON p.id = td.professor_id
      JOIN public.matriculas m ON m.turma_id = td.turma_id
      WHERE td.disciplina_id = notas.disciplina_id
        AND m.id = notas.matricula_id
        AND (p.user_id = auth.uid() OR p.email = auth.jwt() ->> 'email')
    )
  );

-- INSERT: staff ou professor que leciona a disciplina na turma do aluno
CREATE POLICY notas_insert_staff ON public.notas
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor', 'secretaria', 'coordenacao')
    )
    OR EXISTS (
      SELECT 1
      FROM public.turma_disciplinas td
      JOIN public.professores p ON p.id = td.professor_id
      JOIN public.matriculas m ON m.turma_id = td.turma_id
      WHERE td.disciplina_id = notas.disciplina_id
        AND m.id = notas.matricula_id
        AND (p.user_id = auth.uid() OR p.email = auth.jwt() ->> 'email')
    )
  );

-- UPDATE: staff ou professor que leciona a disciplina na turma do aluno
CREATE POLICY notas_update_staff ON public.notas
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor', 'secretaria', 'coordenacao')
    )
    OR EXISTS (
      SELECT 1
      FROM public.turma_disciplinas td
      JOIN public.professores p ON p.id = td.professor_id
      JOIN public.matriculas m ON m.turma_id = td.turma_id
      WHERE td.disciplina_id = notas.disciplina_id
        AND m.id = notas.matricula_id
        AND (p.user_id = auth.uid() OR p.email = auth.jwt() ->> 'email')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor', 'secretaria', 'coordenacao')
    )
    OR EXISTS (
      SELECT 1
      FROM public.turma_disciplinas td
      JOIN public.professores p ON p.id = td.professor_id
      JOIN public.matriculas m ON m.turma_id = td.turma_id
      WHERE td.disciplina_id = notas.disciplina_id
        AND m.id = notas.matricula_id
        AND (p.user_id = auth.uid() OR p.email = auth.jwt() ->> 'email')
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
