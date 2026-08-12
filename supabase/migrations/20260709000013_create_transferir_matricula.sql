-- =============================================================
-- Transferência entre turmas (item 5 do contrato)
-- Fecha a matrícula atual (status='transferida') e cria nova
-- matrícula ativa na turma destino. O trigger de histórico grava
-- os eventos automaticamente.
-- =============================================================

CREATE OR REPLACE FUNCTION public.transferir_matricula(
  p_matricula_id UUID,
  p_nova_turma_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_old_matricula public.matriculas%ROWTYPE;
  v_turma_destino public.turmas%ROWTYPE;
  v_ano_letivo integer;
  v_novo_numero text;
  v_nova_matricula_id uuid;
  v_qtd_ativas integer;
BEGIN
  -- Autorização: apenas staff de gestão (sem professor)
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND tipo_usuario IN ('admin', 'diretor', 'secretaria', 'coordenacao')
  ) THEN
    RAISE EXCEPTION 'access_denied' USING HINT = 'Somente gestão pode transferir matrículas';
  END IF;

  -- Matrícula atual
  SELECT * INTO v_old_matricula
  FROM public.matriculas
  WHERE id = p_matricula_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'matricula_nao_encontrada';
  END IF;

  IF v_old_matricula.status <> 'ativa' THEN
    RAISE EXCEPTION 'apenas_matriculas_ativas_podem_ser_transferidas'
      USING HINT = 'Status atual: ' || v_old_matricula.status;
  END IF;

  -- Turma destino
  SELECT * INTO v_turma_destino
  FROM public.turmas
  WHERE id = p_nova_turma_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'turma_destino_nao_encontrada';
  END IF;

  IF p_nova_turma_id = v_old_matricula.turma_id THEN
    RAISE EXCEPTION 'turma_destino_igual_a_atual';
  END IF;

  -- Capacidade da turma destino
  SELECT COUNT(*) INTO v_qtd_ativas
  FROM public.matriculas
  WHERE turma_id = p_nova_turma_id
    AND status = 'ativa';

  IF v_turma_destino.capacidade_maxima IS NOT NULL
     AND v_qtd_ativas >= v_turma_destino.capacidade_maxima THEN
    RAISE EXCEPTION 'capacidade_da_turma_destino_atingida';
  END IF;

  v_ano_letivo := v_old_matricula.ano_letivo;
  v_novo_numero := RIGHT(v_ano_letivo::text, 2) || substring(md5(random()::text) from 1 for 4);

  -- Marca o UPDATE da antiga como 'transferencia' (local à transação)
  PERFORM set_config('app.transferencia', 'true', true);

  UPDATE public.matriculas
  SET status = 'transferida'
  WHERE id = p_matricula_id;

  PERFORM set_config('app.transferencia', 'false', true);

  -- Nova matrícula ativa na turma destino
  INSERT INTO public.matriculas (
    numero_matricula, aluno_id, turma_id, ano_letivo, data_matricula, status, observacoes
  ) VALUES (
    v_novo_numero,
    v_old_matricula.aluno_id,
    p_nova_turma_id,
    v_ano_letivo,
    CURRENT_DATE,
    'ativa',
    'Transferida da matrícula ' || COALESCE(v_old_matricula.numero_matricula, '') || ' (turma anterior: ' ||
    COALESCE((SELECT nome FROM public.turmas WHERE id = v_old_matricula.turma_id), '') || ')'
  )
  RETURNING id INTO v_nova_matricula_id;

  RETURN v_nova_matricula_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.transferir_matricula(UUID, UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.transferir_matricula(UUID, UUID) FROM anon;