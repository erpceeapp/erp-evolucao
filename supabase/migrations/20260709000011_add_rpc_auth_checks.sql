-- Helper function: verifica se o usuario logado tem acesso ao aluno
-- Funciona em conjunto com Abordagem B (service_role no portal responsavel):
-- - auth.uid() IS NULL (service_role): permite sem check
-- - auth.uid() presente (staff via Supabase Auth): verifica permissao
CREATE OR REPLACE FUNCTION public.check_aluno_access(p_aluno_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor', 'secretaria', 'coordenacao')
    ) THEN
      RETURN;
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.professores p
      JOIN public.turmas t ON t.professor_responsavel_id = p.id
      JOIN public.matriculas m ON m.turma_id = t.id
      WHERE p.user_id = auth.uid()
      AND m.aluno_id = p_aluno_id
      AND m.status NOT IN ('cancelada', 'cancelado', 'inativo', 'inativa')
    ) THEN
      RETURN;
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.professores p
      JOIN public.turma_disciplinas td ON td.professor_id = p.id
      JOIN public.matriculas m ON m.turma_id = td.turma_id
      WHERE p.user_id = auth.uid()
      AND m.aluno_id = p_aluno_id
      AND m.status NOT IN ('cancelada', 'cancelado', 'inativo', 'inativa')
    ) THEN
      RETURN;
    END IF;
    RAISE EXCEPTION 'access_denied' USING HINT = 'Você não tem permissão para acessar dados deste aluno';
  END IF;
END;
$$;

-- ── get_aluno_basico ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_aluno_basico(p_aluno_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
BEGIN
  PERFORM public.check_aluno_access(p_aluno_id);

  SELECT jsonb_build_object(
    'id', a.id,
    'nome_completo', a.nome_completo,
    'cpf', a.cpf,
    'email', a.email,
    'telefone', a.telefone,
    'data_nascimento', a.data_nascimento,
    'nivel', a.nivel,
    'matricula', a.matricula,
    'nome_responsavel', a.nome_responsavel,
    'email_responsavel', a.email_responsavel
  ) INTO result
  FROM alunos a
  WHERE a.id = p_aluno_id;
  RETURN result;
END;
$$;

-- ── get_matricula_ativa ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_matricula_ativa(p_aluno_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
BEGIN
  PERFORM public.check_aluno_access(p_aluno_id);

  SELECT jsonb_build_object(
    'id', m.id,
    'turma_id', m.turma_id,
    'status', m.status,
    'numero_matricula', m.numero_matricula
  ) INTO result
  FROM matriculas m
  WHERE m.aluno_id = p_aluno_id
    AND m.status NOT IN ('cancelada', 'cancelado', 'inativo', 'inativa')
  ORDER BY m.created_at DESC
  LIMIT 1;
  RETURN result;
END;
$$;

-- ── get_turma ──────────────────────────────────────────────────────────────
-- Apenas verifica se o usuario logado tem perfil staff
CREATE OR REPLACE FUNCTION public.get_turma(p_turma_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND tipo_usuario IN ('admin', 'diretor', 'secretaria', 'coordenacao', 'professor')
    ) THEN
      RAISE EXCEPTION 'access_denied';
    END IF;
  END IF;

  SELECT jsonb_build_object('nome', t.nome, 'serie', t.serie, 'turno', t.turno)
  INTO result
  FROM turmas t
  WHERE t.id = p_turma_id;
  RETURN result;
END;
$$;

-- ── get_avisos_aluno ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_avisos_aluno(p_aluno_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
BEGIN
  PERFORM public.check_aluno_access(p_aluno_id);

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', a.id,
      'titulo', a.titulo,
      'descricao', a.descricao,
      'tipo_aviso', a.tipo_aviso,
      'data_aviso', a.data_aviso,
      'hora_aviso', a.hora_aviso,
      'created_at', a.created_at
    ) ORDER BY a.data_aviso DESC
  ) INTO result
  FROM avisos_aluno a
  WHERE a.aluno_id = p_aluno_id;
  RETURN COALESCE(result, '[]'::JSONB);
END;
$$;

-- ── get_aluno_notas ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_aluno_notas(p_aluno_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
BEGIN
  PERFORM public.check_aluno_access(p_aluno_id);

  SELECT jsonb_build_object(
    'aluno', jsonb_build_object('id', a.id, 'nome_completo', a.nome_completo, 'matricula', a.matricula, 'nivel', a.nivel),
    'disciplinas', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', d.id,
        'nome', d.nome,
        'codigo', d.codigo,
        'notas', (
          SELECT jsonb_object_agg(
            n.bimestre::TEXT,
            jsonb_build_object('nota', n.nota, 'observacoes', n.observacoes)
          )
          FROM notas n
          WHERE n.matricula_id IN (
            SELECT m.id FROM matriculas m
            WHERE m.aluno_id = p_aluno_id AND m.status NOT IN ('cancelada', 'cancelado', 'inativo', 'inativa')
          )
          AND n.disciplina_id = d.id
        )
      ) ORDER BY d.nome)
      FROM turma_disciplinas td
      JOIN disciplinas d ON d.id = td.disciplina_id
      WHERE td.turma_id IN (
        SELECT m.turma_id FROM matriculas m
        WHERE m.aluno_id = p_aluno_id AND m.status NOT IN ('cancelada', 'cancelado', 'inativo', 'inativa')
      )
    ), '[]'::JSONB)
  ) INTO result
  FROM alunos a
  WHERE a.id = p_aluno_id;
  RETURN result;
END;
$$;

-- ── get_ultima_revogacao ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_ultima_revogacao(p_aluno_id UUID)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result TIMESTAMPTZ;
BEGIN
  PERFORM public.check_aluno_access(p_aluno_id);

  SELECT ultima_revogacao_sessao INTO result
  FROM alunos
  WHERE id = p_aluno_id;
  RETURN result;
END;
$$;
