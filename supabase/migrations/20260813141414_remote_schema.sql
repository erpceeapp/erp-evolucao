SET check_function_bodies = false;
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'auth', 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND tipo_usuario IN ('admin', 'diretor')
  ) THEN
    RAISE EXCEPTION 'access_denied' USING HINT = 'Only administrators can execute this function';
  END IF;

  DELETE FROM public.professores WHERE user_id = p_user_id;

  UPDATE public.avisos_aluno     SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE public.links_documentos SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE public.user_invites     SET invited_by = NULL WHERE invited_by = p_user_id;
  UPDATE public.escola           SET diretor_id = NULL WHERE diretor_id = p_user_id;

  DELETE FROM public.profiles WHERE id = p_user_id;
  DELETE FROM auth.users  WHERE id = p_user_id;
  RETURN FOUND;
END;
$function$;
CREATE OR REPLACE FUNCTION public.admin_update_user_email(p_user_id uuid, p_new_email text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'auth', 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND tipo_usuario IN ('admin', 'diretor')
  ) THEN
    RAISE EXCEPTION 'access_denied' USING HINT = 'Only administrators can execute this function';
  END IF;

  UPDATE auth.users
  SET email = p_new_email,
      raw_user_meta_data = raw_user_meta_data || jsonb_build_object('email', p_new_email),
      updated_at = NOW()
  WHERE id = p_user_id;

  UPDATE public.profiles
  SET email = p_new_email,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN FOUND;
END;
$function$;
CREATE OR REPLACE FUNCTION public.admin_update_user_password(p_user_id uuid, p_encrypted_password text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'auth', 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND tipo_usuario IN ('admin', 'diretor')
  ) THEN
    RAISE EXCEPTION 'access_denied' USING HINT = 'Only administrators can execute this function';
  END IF;

  UPDATE auth.users
  SET encrypted_password = p_encrypted_password,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN FOUND;
END;
$function$;
CREATE OR REPLACE FUNCTION public.admin_update_user_profile(p_user_id uuid, p_nome_completo text DEFAULT NULL::text, p_tipo_usuario text DEFAULT NULL::text, p_telefone text DEFAULT NULL::text, p_email text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'auth', 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND tipo_usuario IN ('admin', 'diretor')
  ) THEN
    RAISE EXCEPTION 'access_denied' USING HINT = 'Only administrators can execute this function';
  END IF;

  UPDATE public.profiles
  SET
    nome_completo = COALESCE(p_nome_completo, nome_completo),
    telefone      = COALESCE(p_telefone, telefone),
    tipo_usuario  = COALESCE(p_tipo_usuario, tipo_usuario),
    email         = COALESCE(p_email, email),
    updated_at = NOW()
  WHERE id = p_user_id;

  IF p_email IS NOT NULL THEN
    UPDATE auth.users
    SET email = p_email,
        raw_user_meta_data = raw_user_meta_data || jsonb_build_object('email', p_email),
        updated_at = NOW()
    WHERE id = p_user_id;
  END IF;

  RETURN FOUND;
END;
$function$;
CREATE OR REPLACE FUNCTION public.buscar_aluno_responsavel(p_email text, p_cpf text)
 RETURNS TABLE(id uuid, nome_completo text, cpf text, email_responsavel text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT a.id, a.nome_completo, a.cpf, a.email_responsavel
  FROM alunos a
  WHERE a.email_responsavel ILIKE p_email
    AND REGEXP_REPLACE(a.cpf, '[^0-9]', '', 'g') = p_cpf
    AND a.ativo = true
  LIMIT 1;
END;
$function$;
CREATE OR REPLACE FUNCTION public.check_aluno_access(p_aluno_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;
CREATE OR REPLACE FUNCTION public.create_professor_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_password TEXT;
  new_user_id UUID;
BEGIN
  -- Apenas criar usuário se o professor tiver email e CPF
  IF NEW.email IS NOT NULL AND NEW.cpf IS NOT NULL THEN
    -- Usar CPF sem formatação como senha padrão
    user_password := REGEXP_REPLACE(NEW.cpf, '[^0-9]', '', 'g');
    
    -- Criar usuário no auth.users (isso só funciona via service_role)
    -- Este código será executado via trigger quando secretaria cadastrar professor
    
    -- Criar perfil vinculado
    INSERT INTO profiles (id, email, nome_completo, telefone, tipo_usuario, ativo, primeira_senha)
    VALUES (
      gen_random_uuid(),
      NEW.email,
      NEW.nome_completo,
      NEW.telefone,
      'professor',
      NEW.ativo,
      true
    )
    ON CONFLICT (email) DO UPDATE
    SET nome_completo = EXCLUDED.nome_completo,
        telefone = EXCLUDED.telefone,
        ativo = EXCLUDED.ativo;
    
    -- Atualizar user_id no registro do professor
    UPDATE professores 
    SET user_id = (SELECT id FROM profiles WHERE email = NEW.email LIMIT 1)
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.generate_matricula()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  next_number INTEGER;
  formatted_matricula TEXT;
BEGIN
  -- Obter próximo número da sequência
  next_number := nextval('alunos_matricula_seq');
  
  -- Formatar como string com zeros à esquerda (5 dígitos)
  formatted_matricula := LPAD(next_number::TEXT, 5, '0');
  
  RETURN formatted_matricula;
END;
$function$;
CREATE OR REPLACE FUNCTION public.get_aluno_basico(p_aluno_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;
CREATE OR REPLACE FUNCTION public.get_aluno_notas(p_aluno_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;
CREATE OR REPLACE FUNCTION public.get_avisos_aluno(p_aluno_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;
CREATE OR REPLACE FUNCTION public.get_escola()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
BEGIN
  SELECT to_jsonb(e.*) INTO result
  FROM escola e
  LIMIT 1;
  RETURN result;
END;
$function$;
CREATE OR REPLACE FUNCTION public.get_matricula_ativa(p_aluno_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;
CREATE OR REPLACE FUNCTION public.get_turma(p_turma_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;
CREATE OR REPLACE FUNCTION public.get_ultima_revogacao(p_aluno_id uuid)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result TIMESTAMPTZ;
BEGIN
  PERFORM public.check_aluno_access(p_aluno_id);

  SELECT ultima_revogacao_sessao INTO result
  FROM alunos
  WHERE id = p_aluno_id;
  RETURN result;
END;
$function$;
CREATE OR REPLACE FUNCTION public.get_user_tipo_usuario()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_tipo text;
BEGIN
  SELECT tipo_usuario INTO user_tipo
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN user_tipo;
END;
$function$;
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, nome_completo, telefone, tipo_usuario, ativo)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nome_completo', new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'telefone', new.raw_user_meta_data->>'phone', ''),
    'professor',
    true
  );
  RETURN new;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Erro ao criar perfil: %', SQLERRM;
    RETURN new;
END;
$function$;
CREATE OR REPLACE FUNCTION public.is_admin_or_coord()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND tipo_usuario IN ('admin', 'coordenacao')
  );
END;
$function$;
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND tipo_usuario = 'admin'
  );
END;
$function$;
CREATE OR REPLACE FUNCTION public.is_professor()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND tipo_usuario = 'professor'
  );
END;
$function$;
CREATE OR REPLACE FUNCTION public.is_token_revoked(p_token_hash text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.session_blocklist
    WHERE token_hash = p_token_hash
    AND expires_at > NOW()
  );
END;
$function$;
CREATE OR REPLACE FUNCTION public.rate_limit_check(p_key text, p_max_requests integer, p_window_sec integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count INT;
  v_reset_at TIMESTAMPTZ;
  v_now TIMESTAMPTZ := NOW();
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Limpeza oportunista de entradas expiradas
  DELETE FROM public.rate_limits WHERE reset_at < v_now;

  -- Buscar entrada existente
  SELECT count, reset_at INTO v_count, v_reset_at
  FROM public.rate_limits
  WHERE key = p_key;

  v_expires_at := v_now + (p_window_sec || ' seconds')::INTERVAL;

  IF NOT FOUND OR v_reset_at < v_now THEN
    -- Primeira requisição ou janela expirou
    INSERT INTO public.rate_limits (key, count, reset_at)
    VALUES (p_key, 1, v_expires_at)
    ON CONFLICT (key) DO UPDATE
    SET count = 1, reset_at = v_expires_at;

    RETURN jsonb_build_object('success', true, 'remaining', p_max_requests - 1);
  ELSIF v_count >= p_max_requests THEN
    RETURN jsonb_build_object('success', false, 'remaining', 0);
  ELSE
    UPDATE public.rate_limits
    SET count = count + 1
    WHERE key = p_key;

    RETURN jsonb_build_object('success', true, 'remaining', p_max_requests - v_count - 1);
  END IF;
END;
$function$;
CREATE OR REPLACE FUNCTION public.registrar_historico_matricula()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;
CREATE OR REPLACE FUNCTION public.revogar_sessoes_responsavel(p_aluno_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE alunos
  SET ultima_revogacao_sessao = NOW()
  WHERE id = p_aluno_id;
END;
$function$;
CREATE OR REPLACE FUNCTION public.revoke_token(p_token_hash text, p_aluno_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.session_blocklist (token_hash, aluno_id, expires_at)
  VALUES (p_token_hash, p_aluno_id, NOW() + INTERVAL '8 hours');
END;
$function$;
CREATE OR REPLACE FUNCTION public.set_aluno_matricula()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Se matrícula não foi fornecida, gerar automaticamente
  IF NEW.matricula IS NULL THEN
    NEW.matricula := generate_matricula();
  END IF;
  
  RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.transferir_matricula(p_matricula_id uuid, p_nova_turma_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.user_can_manage_turmas()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND tipo_usuario IN ('admin', 'coordenacao', 'secretaria', 'diretor')
  );
END;
$function$;
