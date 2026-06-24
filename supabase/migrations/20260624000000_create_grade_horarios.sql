CREATE TABLE public.grade_horarios (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  turma_disciplina_id uuid NOT NULL REFERENCES public.turma_disciplinas(id) ON DELETE CASCADE,
  dia_semana integer NOT NULL CHECK (dia_semana BETWEEN 1 AND 5),
  hora_inicio time NOT NULL,
  hora_fim time NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX idx_grade_horarios_unique_slot
  ON public.grade_horarios (turma_disciplina_id, dia_semana, hora_inicio);

ALTER TABLE public.grade_horarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY grade_horarios_select_all ON public.grade_horarios
  FOR SELECT TO authenticated USING (true);

CREATE POLICY grade_horarios_insert_allowed ON public.grade_horarios
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.tipo_usuario = ANY (ARRAY['admin'::text, 'diretor'::text, 'secretaria'::text, 'coordenacao'::text]))
  );

CREATE POLICY grade_horarios_update_allowed ON public.grade_horarios
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
    AND profiles.tipo_usuario = ANY (ARRAY['admin'::text, 'diretor'::text, 'secretaria'::text, 'coordenacao'::text])))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
    AND profiles.tipo_usuario = ANY (ARRAY['admin'::text, 'diretor'::text, 'secretaria'::text, 'coordenacao'::text])));

CREATE POLICY grade_horarios_delete_allowed ON public.grade_horarios
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.tipo_usuario = ANY (ARRAY['admin'::text, 'diretor'::text, 'secretaria'::text, 'coordenacao'::text]))
  );

CREATE TRIGGER set_grade_horarios_updated_at
  BEFORE UPDATE ON public.grade_horarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
