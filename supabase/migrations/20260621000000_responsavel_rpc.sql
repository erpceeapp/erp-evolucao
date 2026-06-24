-- RPC 1: Buscar aluno por email+CPF (para login, sem RLS)
CREATE OR REPLACE FUNCTION public.buscar_aluno_responsavel(
  p_email TEXT,
  p_cpf TEXT
)
RETURNS TABLE (
  id UUID,
  nome_completo TEXT,
  cpf TEXT,
  email_responsavel TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.nome_completo, a.cpf, a.email_responsavel
  FROM alunos a
  WHERE a.email_responsavel ILIKE p_email
    AND a.cpf = p_cpf
    AND a.ativo = true
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.buscar_aluno_responsavel TO anon;
GRANT EXECUTE ON FUNCTION public.buscar_aluno_responsavel TO authenticated;

-- RPC 2: Buscar matricula ativa do aluno
CREATE OR REPLACE FUNCTION public.get_matricula_ativa(p_aluno_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
BEGIN
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

GRANT EXECUTE ON FUNCTION public.get_matricula_ativa TO anon;
GRANT EXECUTE ON FUNCTION public.get_matricula_ativa TO authenticated;

-- RPC 3: Buscar turma por ID
CREATE OR REPLACE FUNCTION public.get_turma(p_turma_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object('nome', t.nome, 'serie', t.serie, 'turno', t.turno)
  INTO result
  FROM turmas t
  WHERE t.id = p_turma_id;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_turma TO anon;
GRANT EXECUTE ON FUNCTION public.get_turma TO authenticated;

-- RPC 4: Buscar avisos do aluno
CREATE OR REPLACE FUNCTION public.get_avisos_aluno(p_aluno_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
BEGIN
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

GRANT EXECUTE ON FUNCTION public.get_avisos_aluno TO anon;
GRANT EXECUTE ON FUNCTION public.get_avisos_aluno TO authenticated;

-- RPC 5: Buscar notas completas do aluno
CREATE OR REPLACE FUNCTION public.get_aluno_notas(p_aluno_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
BEGIN
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

GRANT EXECUTE ON FUNCTION public.get_aluno_notas TO anon;
GRANT EXECUTE ON FUNCTION public.get_aluno_notas TO authenticated;
