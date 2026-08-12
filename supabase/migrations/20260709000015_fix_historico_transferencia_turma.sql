-- =============================================================
-- Correção: histórico de transferência deve informar a turma de
-- origem e a turma de destino. Como o UPDATE da transferência não
-- altera turma_id (só status), o trigger não conseguia capturar a
-- turma destino. A função transferir_matricula() agora registra o
-- destino via custom setting local à transação.
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

  -- Marca o UPDATE da antiga como 'transferencia' e informa o destino
  -- (configs locais à transação, lidas pelo trigger de histórico)
  PERFORM set_config('app.transferencia', 'true', true);
  PERFORM set_config('app.transferencia_destino', p_nova_turma_id::text, true);

  UPDATE public.matriculas
  SET status = 'transferida'
  WHERE id = p_matricula_id;

  PERFORM set_config('app.transferencia', 'false', true);
  PERFORM set_config('app.transferencia_destino', '', true);

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

-- =============================================================
-- Trigger de histórico atualizado: usa app.transferencia_destino
-- para preencher turma_nova quando a turma não muda na transferência
-- =============================================================

CREATE OR REPLACE FUNCTION public.registrar_historico_matricula()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tipo TEXT;
  v_turma_nova uuid;
  v_turma_anterior uuid;
  v_destino_config text := NULLIF(current_setting('app.transferencia_destino', true), '');
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.matricula_historico (
      matricula_id, tipo, status_anterior, status_novo, turma_anterior, turma_nova, alterado_por
    ) VALUES (
      NEW.id, 'criacao', NULL, NEW.status, NULL, NEW.turma_id, auth.uid()
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
     AND (OLD.status IS DISTINCT FROM NEW.status
          OR OLD.turma_id IS DISTINCT FROM NEW.turma_id) THEN

    v_tipo := CASE
      WHEN current_setting('app.transferencia', true) = 'true' THEN 'transferencia'
      WHEN OLD.turma_id IS DISTINCT FROM NEW.turma_id
           AND OLD.status IS DISTINCT FROM NEW.status THEN 'transferencia'
      WHEN OLD.turma_id IS DISTINCT FROM NEW.turma_id THEN 'mudanca_turma'
      ELSE 'alteracao_status'
    END;

    v_turma_anterior := OLD.turma_id;
    v_turma_nova := NEW.turma_id;

    -- Transferência encerra matrícula sem mudar turma_id: preencher
    -- o destino a partir da config marcada por transferir_matricula()
    IF v_tipo = 'transferencia' AND v_destino_config IS NOT NULL THEN
      BEGIN
        v_turma_nova := v_destino_config::uuid;
      EXCEPTION
        WHEN invalid_text_representation THEN
          v_turma_nova := NULL;
      END;
    END IF;

    INSERT INTO public.matricula_historico (
      matricula_id, tipo, status_anterior, status_novo, turma_anterior, turma_nova, alterado_por
    ) VALUES (
      NEW.id, v_tipo, OLD.status, NEW.status, v_turma_anterior, v_turma_nova, auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$;