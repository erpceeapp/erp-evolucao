SET check_function_bodies = false;
DROP EXTENSION pg_net;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;
CREATE SEQUENCE public.alunos_matricula_seq;
GRANT ALL ON SEQUENCE public.alunos_matricula_seq TO anon;
GRANT ALL ON SEQUENCE public.alunos_matricula_seq TO authenticated;
GRANT ALL ON SEQUENCE public.alunos_matricula_seq TO service_role;
CREATE FUNCTION public.create_professor_user()
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
COMMENT ON FUNCTION public.create_professor_user() IS 'Cria usuário auth e perfil automaticamente quando professor é cadastrado';
GRANT ALL ON FUNCTION public.create_professor_user() TO anon;
GRANT ALL ON FUNCTION public.create_professor_user() TO authenticated;
GRANT ALL ON FUNCTION public.create_professor_user() TO service_role;
CREATE FUNCTION public.generate_matricula()
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
GRANT ALL ON FUNCTION public.generate_matricula() TO anon;
GRANT ALL ON FUNCTION public.generate_matricula() TO authenticated;
GRANT ALL ON FUNCTION public.generate_matricula() TO service_role;
CREATE FUNCTION public.get_user_tipo_usuario()
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
COMMENT ON FUNCTION public.get_user_tipo_usuario() IS 'Retorna o tipo_usuario do usuário atual';
GRANT ALL ON FUNCTION public.get_user_tipo_usuario() TO anon;
GRANT ALL ON FUNCTION public.get_user_tipo_usuario() TO authenticated;
GRANT ALL ON FUNCTION public.get_user_tipo_usuario() TO service_role;
CREATE FUNCTION public.handle_new_user()
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
    COALESCE(new.raw_user_meta_data->>'tipo_usuario', 'professor'),
    true
  );
  RETURN new;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Erro ao criar perfil: %', SQLERRM;
    RETURN new;
END;
$function$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
COMMENT ON FUNCTION public.handle_new_user() IS 'Cria automaticamente um perfil quando um novo usuário é registrado no auth.users';
GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;
CREATE FUNCTION public.is_admin_or_coord()
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
COMMENT ON FUNCTION public.is_admin_or_coord() IS 'Verifica se o usuário atual é admin ou coordenação usando tipo_usuario';
GRANT ALL ON FUNCTION public.is_admin_or_coord() TO anon;
GRANT ALL ON FUNCTION public.is_admin_or_coord() TO authenticated;
GRANT ALL ON FUNCTION public.is_admin_or_coord() TO service_role;
CREATE FUNCTION public.is_admin()
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
COMMENT ON FUNCTION public.is_admin() IS 'Verifica se o usuário é admin';
GRANT ALL ON FUNCTION public.is_admin() TO anon;
GRANT ALL ON FUNCTION public.is_admin() TO authenticated;
GRANT ALL ON FUNCTION public.is_admin() TO service_role;
CREATE FUNCTION public.is_professor()
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
COMMENT ON FUNCTION public.is_professor() IS 'Verifica se o usuário é professor';
GRANT ALL ON FUNCTION public.is_professor() TO anon;
GRANT ALL ON FUNCTION public.is_professor() TO authenticated;
GRANT ALL ON FUNCTION public.is_professor() TO service_role;
CREATE FUNCTION public.set_aluno_matricula()
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
GRANT ALL ON FUNCTION public.set_aluno_matricula() TO anon;
GRANT ALL ON FUNCTION public.set_aluno_matricula() TO authenticated;
GRANT ALL ON FUNCTION public.set_aluno_matricula() TO service_role;
CREATE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Função trigger que atualiza automaticamente a coluna updated_at com o timestamp atual';
GRANT ALL ON FUNCTION public.update_updated_at_column() TO anon;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;
CREATE FUNCTION public.user_can_manage_turmas()
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
COMMENT ON FUNCTION public.user_can_manage_turmas() IS 'Verifica se o usuário pode gerenciar turmas (admin, coordenacao, secretaria, diretor)';
GRANT ALL ON FUNCTION public.user_can_manage_turmas() TO anon;
GRANT ALL ON FUNCTION public.user_can_manage_turmas() TO authenticated;
GRANT ALL ON FUNCTION public.user_can_manage_turmas() TO service_role;
CREATE TABLE public.alunos (id uuid DEFAULT gen_random_uuid() NOT NULL, nome_completo text NOT NULL, data_nascimento date NOT NULL, cpf text, rg text, endereco text, telefone text, email text, nome_responsavel text, telefone_responsavel text, email_responsavel text, observacoes text, ativo boolean DEFAULT true, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now(), sexo text, naturalidade text, certidao_nascimento_numero text, certidao_livro text, certidao_folha text, certidao_data_emissao date, certidao_cartorio text, certidao_uf text, endereco_numero text, bairro text, cidade text, uf text, cep text, telefone_residencial text, telefone_comercial text, celular_pai text, celular_mae text, nome_mae text, profissao_mae text, nome_pai text, profissao_pai text, resp_fin_nome text, resp_fin_data_nascimento date, resp_fin_estado_civil text, resp_fin_cpf text, resp_fin_identidade text, resp_fin_orgao_emissor text, resp_fin_uf text, resp_fin_grau_parentesco text, resp_fin_endereco text, resp_fin_bairro text, resp_fin_telefone text, resp_fin_cidade text, resp_fin_uf_endereco text, resp_fin_cep text, uso_medicamento_continuo boolean DEFAULT false, medicamento_continuo_qual text, alergia_medicamento boolean DEFAULT false, alergia_medicamento_qual text, alergia_alimento boolean DEFAULT false, alergia_alimento_qual text, periodo_letivo text, nivel text, turno_preferencial text, responsavel_matricula text, matricula text);
COMMENT ON TABLE public.alunos IS 'Cadastro completo de alunos';
COMMENT ON COLUMN public.alunos.sexo IS 'Sexo do aluno (Masculino/Feminino/Outro)';
COMMENT ON COLUMN public.alunos.naturalidade IS 'Cidade e UF de nascimento';
COMMENT ON COLUMN public.alunos.resp_fin_grau_parentesco IS 'Grau de parentesco do responsável financeiro com o aluno';
COMMENT ON COLUMN public.alunos.matricula IS 'Matrícula sequencial do aluno no formato 00001, 00002, etc.';
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ADD CONSTRAINT alunos_cpf_key UNIQUE (cpf);
ALTER TABLE public.alunos ADD CONSTRAINT alunos_matricula_key UNIQUE (matricula);
ALTER TABLE public.alunos ADD CONSTRAINT alunos_pkey PRIMARY KEY (id);
ALTER TABLE public.alunos ADD CONSTRAINT alunos_sexo_check CHECK (sexo IS NULL OR (sexo = ANY (ARRAY['Masculino'::text, 'Feminino'::text, 'Outro'::text])));
GRANT ALL ON public.alunos TO anon;
GRANT ALL ON public.alunos TO authenticated;
GRANT ALL ON public.alunos TO service_role;
CREATE INDEX idx_alunos_email ON public.alunos (email);
CREATE INDEX idx_alunos_matricula ON public.alunos (matricula);
CREATE INDEX idx_alunos_nome_completo ON public.alunos (nome_completo);
CREATE INDEX idx_alunos_cpf ON public.alunos (cpf) WHERE cpf IS NOT NULL;
CREATE INDEX idx_alunos_ativo ON public.alunos (ativo);
CREATE INDEX idx_alunos_data_nascimento ON public.alunos (data_nascimento);
CREATE INDEX idx_alunos_nome ON public.alunos (nome_completo);
CREATE INDEX idx_alunos_email_responsavel ON public.alunos (email_responsavel);
CREATE TRIGGER trigger_set_aluno_matricula BEFORE INSERT ON public.alunos FOR EACH ROW EXECUTE FUNCTION public.set_aluno_matricula();
CREATE TRIGGER update_alunos_updated_at BEFORE UPDATE ON public.alunos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY alunos_delete_authenticated ON public.alunos FOR DELETE USING ((auth.role() = 'authenticated'::text));
CREATE POLICY alunos_insert_authenticated ON public.alunos FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY alunos_select_authenticated ON public.alunos FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY alunos_update_authenticated ON public.alunos FOR UPDATE USING ((auth.role() = 'authenticated'::text));
CREATE TABLE public.aulas (id uuid DEFAULT gen_random_uuid() NOT NULL, turma_disciplina_id uuid, data_aula date NOT NULL, hora_inicio time without time zone NOT NULL, hora_fim time without time zone NOT NULL, conteudo text, observacoes text, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());
COMMENT ON TABLE public.aulas IS 'Registro de aulas ministradas';
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas ADD CONSTRAINT aulas_horario_check CHECK (hora_fim > hora_inicio);
ALTER TABLE public.aulas ADD CONSTRAINT aulas_pkey PRIMARY KEY (id);
GRANT ALL ON public.aulas TO anon;
GRANT ALL ON public.aulas TO authenticated;
GRANT ALL ON public.aulas TO service_role;
CREATE INDEX idx_aulas_data ON public.aulas (data_aula);
CREATE INDEX idx_aulas_turma_disciplina ON public.aulas (turma_disciplina_id);
CREATE INDEX idx_aulas_data_hora ON public.aulas (data_aula, hora_inicio);
CREATE TRIGGER update_aulas_updated_at BEFORE UPDATE ON public.aulas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY aulas_delete_authenticated ON public.aulas FOR DELETE USING ((auth.role() = 'authenticated'::text));
CREATE POLICY aulas_insert_authenticated ON public.aulas FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY aulas_select_authenticated ON public.aulas FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY aulas_update_authenticated ON public.aulas FOR UPDATE USING ((auth.role() = 'authenticated'::text));
CREATE TABLE public.avisos_aluno (id uuid DEFAULT gen_random_uuid() NOT NULL, aluno_id uuid NOT NULL, titulo text NOT NULL, descricao text, tipo_aviso text DEFAULT 'geral'::text NOT NULL, data_aviso date DEFAULT CURRENT_DATE NOT NULL, hora_aviso time without time zone, created_by uuid, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());
ALTER TABLE public.avisos_aluno ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avisos_aluno ADD CONSTRAINT avisos_aluno_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE CASCADE;
ALTER TABLE public.avisos_aluno ADD CONSTRAINT avisos_aluno_pkey PRIMARY KEY (id);
GRANT ALL ON public.avisos_aluno TO anon;
GRANT ALL ON public.avisos_aluno TO authenticated;
GRANT ALL ON public.avisos_aluno TO service_role;
CREATE POLICY avisos_aluno_delete_authenticated ON public.avisos_aluno FOR DELETE TO authenticated USING (true);
CREATE POLICY avisos_aluno_insert_authenticated ON public.avisos_aluno FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY avisos_aluno_select_authenticated ON public.avisos_aluno FOR SELECT TO authenticated USING (true);
CREATE POLICY avisos_aluno_update_authenticated ON public.avisos_aluno FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE TABLE public.config_campos_obrigatorios (id uuid DEFAULT gen_random_uuid() NOT NULL, campo text NOT NULL, obrigatorio boolean DEFAULT false NOT NULL, categoria text DEFAULT 'geral'::text NOT NULL, ordem integer DEFAULT 0 NOT NULL, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());
ALTER TABLE public.config_campos_obrigatorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_campos_obrigatorios ADD CONSTRAINT config_campos_obrigatorios_campo_key UNIQUE (campo);
ALTER TABLE public.config_campos_obrigatorios ADD CONSTRAINT config_campos_obrigatorios_pkey PRIMARY KEY (id);
GRANT ALL ON public.config_campos_obrigatorios TO anon;
GRANT ALL ON public.config_campos_obrigatorios TO authenticated;
GRANT ALL ON public.config_campos_obrigatorios TO service_role;
CREATE TRIGGER update_config_campos_obrigatorios_updated_at BEFORE UPDATE ON public.config_campos_obrigatorios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY config_campos_select_all ON public.config_campos_obrigatorios FOR SELECT TO authenticated USING (true);
CREATE TABLE public.disciplinas (id uuid DEFAULT gen_random_uuid() NOT NULL, nome text NOT NULL, codigo text NOT NULL, descricao text, carga_horaria integer, ativo boolean DEFAULT true, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now(), professor_id uuid);
COMMENT ON TABLE public.disciplinas IS 'Disciplinas oferecidas pela escola';
COMMENT ON COLUMN public.disciplinas.professor_id IS 'Professor responsável pela disciplina';
ALTER TABLE public.disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplinas ADD CONSTRAINT disciplinas_carga_horaria_check CHECK (carga_horaria IS NULL OR carga_horaria > 0);
ALTER TABLE public.disciplinas ADD CONSTRAINT disciplinas_codigo_key UNIQUE (codigo);
ALTER TABLE public.disciplinas ADD CONSTRAINT disciplinas_codigo_unique UNIQUE (codigo);
ALTER TABLE public.disciplinas ADD CONSTRAINT disciplinas_pkey PRIMARY KEY (id);
GRANT ALL ON public.disciplinas TO anon;
GRANT ALL ON public.disciplinas TO authenticated;
GRANT ALL ON public.disciplinas TO service_role;
CREATE INDEX idx_disciplinas_codigo ON public.disciplinas (codigo);
CREATE INDEX idx_disciplinas_ativo ON public.disciplinas (ativo);
CREATE INDEX idx_disciplinas_professor_id ON public.disciplinas (professor_id);
CREATE INDEX idx_disciplinas_nome ON public.disciplinas (nome);
CREATE TRIGGER update_disciplinas_updated_at BEFORE UPDATE ON public.disciplinas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY disciplinas_delete_authenticated ON public.disciplinas FOR DELETE USING ((auth.role() = 'authenticated'::text));
CREATE POLICY disciplinas_insert_authenticated ON public.disciplinas FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY disciplinas_select_authenticated ON public.disciplinas FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY disciplinas_update_authenticated ON public.disciplinas FOR UPDATE USING ((auth.role() = 'authenticated'::text));
CREATE TABLE public.documentos (id uuid DEFAULT gen_random_uuid() NOT NULL, nome text NOT NULL, tipo text NOT NULL, url text, aluno_id uuid, professor_id uuid, uploaded_by uuid, created_at timestamp with time zone DEFAULT now());
COMMENT ON TABLE public.documentos IS 'Documentos anexados a alunos ou professores';
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos ADD CONSTRAINT documentos_aluno_fkey FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE CASCADE;
ALTER TABLE public.documentos ADD CONSTRAINT documentos_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES public.alunos(id);
ALTER TABLE public.documentos ADD CONSTRAINT documentos_pkey PRIMARY KEY (id);
GRANT ALL ON public.documentos TO anon;
GRANT ALL ON public.documentos TO authenticated;
GRANT ALL ON public.documentos TO service_role;
CREATE INDEX idx_documentos_aluno ON public.documentos (aluno_id) WHERE aluno_id IS NOT NULL;
CREATE INDEX idx_documentos_professor ON public.documentos (professor_id) WHERE professor_id IS NOT NULL;
CREATE INDEX idx_documentos_tipo ON public.documentos (tipo);
CREATE POLICY documentos_delete_authenticated ON public.documentos FOR DELETE USING ((auth.role() = 'authenticated'::text));
CREATE POLICY documentos_insert_authenticated ON public.documentos FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY documentos_select_authenticated ON public.documentos FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY documentos_update_authenticated ON public.documentos FOR UPDATE USING ((auth.role() = 'authenticated'::text));
CREATE TABLE public.escola (id uuid DEFAULT gen_random_uuid() NOT NULL, nome text NOT NULL, cnpj text, endereco text, telefone text, email text, diretor_id uuid, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());
ALTER TABLE public.escola ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escola ADD CONSTRAINT escola_pkey PRIMARY KEY (id);
GRANT ALL ON public.escola TO anon;
GRANT ALL ON public.escola TO authenticated;
GRANT ALL ON public.escola TO service_role;
CREATE INDEX idx_escola_cnpj ON public.escola (cnpj);
CREATE TRIGGER update_escola_updated_at BEFORE UPDATE ON public.escola FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "All users can view escola" ON public.escola FOR SELECT USING ((auth.uid() IS NOT NULL));
CREATE POLICY escola_select_all ON public.escola FOR SELECT USING (true);
CREATE TABLE public.eventos (id uuid DEFAULT gen_random_uuid() NOT NULL, titulo text NOT NULL, descricao text, data_inicio date NOT NULL, data_fim date, hora_inicio time without time zone, hora_fim time without time zone, tipo_evento text, turma_id uuid, professor_id uuid, created_by uuid, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());
COMMENT ON TABLE public.eventos IS 'Agenda de eventos escolares';
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ADD CONSTRAINT eventos_data_check CHECK (data_fim IS NULL OR data_fim >= data_inicio);
ALTER TABLE public.eventos ADD CONSTRAINT eventos_pkey PRIMARY KEY (id);
ALTER TABLE public.eventos ADD CONSTRAINT eventos_tipo_check CHECK (tipo_evento IS NULL OR (tipo_evento = ANY (ARRAY['aula'::text, 'prova'::text, 'reuniao'::text, 'evento'::text, 'feriado'::text, 'outros'::text])));
ALTER TABLE public.eventos ADD CONSTRAINT eventos_tipo_evento_check CHECK (tipo_evento = ANY (ARRAY['aula'::text, 'prova'::text, 'reuniao'::text, 'evento'::text, 'feriado'::text]));
GRANT ALL ON public.eventos TO anon;
GRANT ALL ON public.eventos TO authenticated;
GRANT ALL ON public.eventos TO service_role;
CREATE INDEX idx_eventos_professor ON public.eventos (professor_id) WHERE professor_id IS NOT NULL;
CREATE INDEX idx_eventos_turma ON public.eventos (turma_id) WHERE turma_id IS NOT NULL;
CREATE INDEX idx_eventos_data_inicio ON public.eventos (data_inicio);
CREATE INDEX idx_eventos_tipo ON public.eventos (tipo_evento) WHERE tipo_evento IS NOT NULL;
CREATE INDEX idx_eventos_data_fim ON public.eventos (data_fim) WHERE data_fim IS NOT NULL;
CREATE TRIGGER update_eventos_updated_at BEFORE UPDATE ON public.eventos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY eventos_delete_authenticated ON public.eventos FOR DELETE USING ((auth.role() = 'authenticated'::text));
CREATE POLICY eventos_insert_authenticated ON public.eventos FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY eventos_select_authenticated ON public.eventos FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY eventos_update_authenticated ON public.eventos FOR UPDATE USING ((auth.role() = 'authenticated'::text));
CREATE TABLE public.links_documentos (id uuid DEFAULT gen_random_uuid() NOT NULL, titulo text NOT NULL, url text NOT NULL, descricao text, icone text DEFAULT 'file-text'::text, cor text DEFAULT 'blue'::text, ordem integer DEFAULT 0, ativo boolean DEFAULT true, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now(), created_by uuid);
ALTER TABLE public.links_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links_documentos ADD CONSTRAINT links_documentos_pkey PRIMARY KEY (id);
GRANT ALL ON public.links_documentos TO anon;
GRANT ALL ON public.links_documentos TO authenticated;
GRANT ALL ON public.links_documentos TO service_role;
CREATE TRIGGER update_links_documentos_updated_at BEFORE UPDATE ON public.links_documentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY links_documentos_select_authenticated ON public.links_documentos FOR SELECT TO authenticated USING (true);
CREATE TABLE public.matriculas (id uuid DEFAULT gen_random_uuid() NOT NULL, numero_matricula text NOT NULL, aluno_id uuid, turma_id uuid, ano_letivo integer NOT NULL, data_matricula date DEFAULT CURRENT_DATE NOT NULL, status text DEFAULT 'ativa'::text, observacoes text, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());
COMMENT ON TABLE public.matriculas IS 'Matrículas de alunos em turmas';
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matriculas ADD CONSTRAINT matriculas_aluno_fkey FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE CASCADE;
ALTER TABLE public.matriculas ADD CONSTRAINT matriculas_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE CASCADE;
ALTER TABLE public.matriculas ADD CONSTRAINT matriculas_numero_matricula_key UNIQUE (numero_matricula);
ALTER TABLE public.matriculas ADD CONSTRAINT matriculas_numero_unique UNIQUE (numero_matricula);
ALTER TABLE public.matriculas ADD CONSTRAINT matriculas_pkey PRIMARY KEY (id);
ALTER TABLE public.matriculas ADD CONSTRAINT matriculas_status_check CHECK (status = ANY (ARRAY['ativa'::text, 'transferida'::text, 'cancelada'::text, 'concluida'::text, 'trancada'::text]));
GRANT ALL ON public.matriculas TO anon;
GRANT ALL ON public.matriculas TO authenticated;
GRANT ALL ON public.matriculas TO service_role;
CREATE INDEX idx_matriculas_turma_id ON public.matriculas (turma_id);
CREATE INDEX idx_matriculas_ano_letivo ON public.matriculas (ano_letivo) WHERE ano_letivo IS NOT NULL;
CREATE INDEX idx_matriculas_aluno ON public.matriculas (aluno_id);
CREATE INDEX idx_matriculas_turma ON public.matriculas (turma_id);
CREATE INDEX idx_matriculas_ano ON public.matriculas (ano_letivo);
CREATE INDEX idx_matriculas_status_ativa ON public.matriculas (status) WHERE status = 'ativa'::text;
CREATE INDEX idx_matriculas_numero ON public.matriculas (numero_matricula);
CREATE INDEX idx_matriculas_aluno_id ON public.matriculas (aluno_id);
CREATE INDEX idx_matriculas_status ON public.matriculas (status);
CREATE TRIGGER update_matriculas_updated_at BEFORE UPDATE ON public.matriculas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY matriculas_delete_authenticated ON public.matriculas FOR DELETE USING ((auth.role() = 'authenticated'::text));
CREATE POLICY matriculas_insert_authenticated ON public.matriculas FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY matriculas_select_authenticated ON public.matriculas FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY matriculas_update_authenticated ON public.matriculas FOR UPDATE USING ((auth.role() = 'authenticated'::text));
CREATE TABLE public.notas (id uuid DEFAULT gen_random_uuid() NOT NULL, matricula_id uuid, disciplina_id uuid, bimestre integer, nota numeric(4,2), tipo_avaliacao text, data_avaliacao date, observacoes text, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());
COMMENT ON TABLE public.notas IS 'Notas dos alunos por disciplina e bimestre';
ALTER TABLE public.notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas ADD CONSTRAINT notas_bimestre_check CHECK (bimestre IS NULL OR (bimestre = ANY (ARRAY[1, 2, 3, 4])));
ALTER TABLE public.notas ADD CONSTRAINT notas_disciplina_fkey FOREIGN KEY (disciplina_id) REFERENCES public.disciplinas(id) ON DELETE CASCADE;
ALTER TABLE public.notas ADD CONSTRAINT notas_disciplina_id_fkey FOREIGN KEY (disciplina_id) REFERENCES public.disciplinas(id) ON DELETE CASCADE;
ALTER TABLE public.notas ADD CONSTRAINT notas_matricula_fkey FOREIGN KEY (matricula_id) REFERENCES public.matriculas(id) ON DELETE CASCADE;
ALTER TABLE public.notas ADD CONSTRAINT notas_matricula_id_fkey FOREIGN KEY (matricula_id) REFERENCES public.matriculas(id) ON DELETE CASCADE;
ALTER TABLE public.notas ADD CONSTRAINT notas_nota_check CHECK (nota IS NULL OR nota >= 0::numeric AND nota <= 10::numeric);
ALTER TABLE public.notas ADD CONSTRAINT notas_nota_range_check CHECK (nota >= 0::numeric AND nota <= 10::numeric);
ALTER TABLE public.notas ADD CONSTRAINT notas_pkey PRIMARY KEY (id);
ALTER TABLE public.notas ADD CONSTRAINT notas_unique_matricula_disciplina_bimestre UNIQUE (matricula_id, disciplina_id, bimestre);
GRANT ALL ON public.notas TO anon;
GRANT ALL ON public.notas TO authenticated;
GRANT ALL ON public.notas TO service_role;
CREATE INDEX idx_notas_disciplina ON public.notas (disciplina_id);
CREATE INDEX idx_notas_aluno_periodo ON public.notas (matricula_id, bimestre);
CREATE INDEX idx_notas_matricula_disciplina ON public.notas (matricula_id, disciplina_id);
CREATE INDEX idx_notas_matricula ON public.notas (matricula_id);
CREATE INDEX idx_notas_bimestre ON public.notas (bimestre) WHERE bimestre IS NOT NULL;
CREATE INDEX idx_notas_data_avaliacao ON public.notas (data_avaliacao) WHERE data_avaliacao IS NOT NULL;
CREATE TRIGGER update_notas_updated_at BEFORE UPDATE ON public.notas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "Authenticated users can insert notas" ON public.notas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can read notas" ON public.notas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can update notas" ON public.notas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY notas_delete_authenticated ON public.notas FOR DELETE USING ((auth.role() = 'authenticated'::text));
CREATE POLICY notas_insert_authenticated ON public.notas FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY notas_select_authenticated ON public.notas FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY notas_update_authenticated ON public.notas FOR UPDATE USING ((auth.role() = 'authenticated'::text));
CREATE TABLE public.periodos_letivos (id uuid DEFAULT gen_random_uuid() NOT NULL, ano_letivo integer NOT NULL, numero_periodo integer NOT NULL, nome text NOT NULL, data_inicio date NOT NULL, data_fim date NOT NULL, ativo boolean DEFAULT true, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());
ALTER TABLE public.periodos_letivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periodos_letivos ADD CONSTRAINT periodos_letivos_ano_letivo_numero_periodo_key UNIQUE (ano_letivo, numero_periodo);
ALTER TABLE public.periodos_letivos ADD CONSTRAINT periodos_letivos_numero_periodo_check CHECK (numero_periodo = ANY (ARRAY[1, 2, 3, 4]));
ALTER TABLE public.periodos_letivos ADD CONSTRAINT periodos_letivos_pkey PRIMARY KEY (id);
GRANT ALL ON public.periodos_letivos TO anon;
GRANT ALL ON public.periodos_letivos TO authenticated;
GRANT ALL ON public.periodos_letivos TO service_role;
CREATE TRIGGER update_periodos_letivos_updated_at BEFORE UPDATE ON public.periodos_letivos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY periodos_letivos_select_authenticated ON public.periodos_letivos FOR SELECT TO authenticated USING (true);
CREATE TABLE public.presencas (id uuid DEFAULT gen_random_uuid() NOT NULL, aula_id uuid, aluno_id uuid, presente boolean DEFAULT false, justificativa text, created_at timestamp with time zone DEFAULT now());
COMMENT ON TABLE public.presencas IS 'Registro de presença dos alunos nas aulas';
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presencas ADD CONSTRAINT presencas_aluno_fkey FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE CASCADE;
ALTER TABLE public.presencas ADD CONSTRAINT presencas_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE CASCADE;
ALTER TABLE public.presencas ADD CONSTRAINT presencas_aula_fkey FOREIGN KEY (aula_id) REFERENCES public.aulas(id) ON DELETE CASCADE;
ALTER TABLE public.presencas ADD CONSTRAINT presencas_aula_id_aluno_id_key UNIQUE (aula_id, aluno_id);
ALTER TABLE public.presencas ADD CONSTRAINT presencas_aula_id_fkey FOREIGN KEY (aula_id) REFERENCES public.aulas(id) ON DELETE CASCADE;
ALTER TABLE public.presencas ADD CONSTRAINT presencas_pkey PRIMARY KEY (id);
ALTER TABLE public.presencas ADD CONSTRAINT presencas_unique UNIQUE (aula_id, aluno_id);
GRANT ALL ON public.presencas TO anon;
GRANT ALL ON public.presencas TO authenticated;
GRANT ALL ON public.presencas TO service_role;
CREATE INDEX idx_presencas_presente ON public.presencas (presente);
CREATE INDEX idx_presencas_aluno ON public.presencas (aluno_id);
CREATE INDEX idx_presencas_aula ON public.presencas (aula_id);
CREATE POLICY presencas_delete_authenticated ON public.presencas FOR DELETE USING ((auth.role() = 'authenticated'::text));
CREATE POLICY presencas_insert_authenticated ON public.presencas FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY presencas_select_authenticated ON public.presencas FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY presencas_update_authenticated ON public.presencas FOR UPDATE USING ((auth.role() = 'authenticated'::text));
CREATE TABLE public.professor_disciplinas (id uuid DEFAULT gen_random_uuid() NOT NULL, professor_id uuid NOT NULL, disciplina_id uuid NOT NULL, created_at timestamp with time zone DEFAULT now());
COMMENT ON TABLE public.professor_disciplinas IS 'Relacionamento entre professores e disciplinas que eles podem lecionar';
COMMENT ON COLUMN public.professor_disciplinas.professor_id IS 'ID do professor';
COMMENT ON COLUMN public.professor_disciplinas.disciplina_id IS 'ID da disciplina que o professor pode lecionar';
ALTER TABLE public.professor_disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professor_disciplinas ADD CONSTRAINT professor_disciplinas_disciplina_id_fkey FOREIGN KEY (disciplina_id) REFERENCES public.disciplinas(id) ON DELETE CASCADE;
ALTER TABLE public.professor_disciplinas ADD CONSTRAINT professor_disciplinas_pkey PRIMARY KEY (id);
ALTER TABLE public.professor_disciplinas ADD CONSTRAINT professor_disciplinas_professor_id_disciplina_id_key UNIQUE (professor_id, disciplina_id);
GRANT ALL ON public.professor_disciplinas TO anon;
GRANT ALL ON public.professor_disciplinas TO authenticated;
GRANT ALL ON public.professor_disciplinas TO service_role;
CREATE INDEX idx_professor_disciplinas_disciplina_id ON public.professor_disciplinas (disciplina_id);
CREATE INDEX idx_professor_disciplinas_professor_id ON public.professor_disciplinas (professor_id);
CREATE POLICY "Permitir atualização de professor_disciplinas para usuários " ON public.professor_disciplinas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Permitir exclusão de professor_disciplinas para usuários aute" ON public.professor_disciplinas FOR DELETE TO authenticated USING (true);
CREATE POLICY "Permitir inserção de professor_disciplinas para usuários aut" ON public.professor_disciplinas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Permitir leitura de professor_disciplinas para usuários autent" ON public.professor_disciplinas FOR SELECT TO authenticated USING (true);
CREATE TABLE public.professores (id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid, nome_completo text NOT NULL, cpf text, rg text, data_nascimento date, endereco text, telefone text, email text NOT NULL, formacao text, especializacao text, registro_profissional text, data_admissao date, salario numeric(10,2), ativo boolean DEFAULT true, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());
COMMENT ON TABLE public.professores IS 'Cadastro de professores';
ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professores ADD CONSTRAINT professores_cpf_key UNIQUE (cpf);
ALTER TABLE public.professores ADD CONSTRAINT professores_email_unique UNIQUE (email);
ALTER TABLE public.professores ADD CONSTRAINT professores_pkey PRIMARY KEY (id);
ALTER TABLE public.disciplinas ADD CONSTRAINT disciplinas_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.professores(id) ON DELETE SET NULL;
ALTER TABLE public.documentos ADD CONSTRAINT documentos_professor_fkey FOREIGN KEY (professor_id) REFERENCES public.professores(id) ON DELETE CASCADE;
ALTER TABLE public.documentos ADD CONSTRAINT documentos_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.professores(id);
ALTER TABLE public.eventos ADD CONSTRAINT eventos_professor_fkey FOREIGN KEY (professor_id) REFERENCES public.professores(id) ON DELETE SET NULL;
ALTER TABLE public.eventos ADD CONSTRAINT eventos_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.professores(id);
ALTER TABLE public.professor_disciplinas ADD CONSTRAINT professor_disciplinas_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.professores(id) ON DELETE CASCADE;
GRANT ALL ON public.professores TO anon;
GRANT ALL ON public.professores TO authenticated;
GRANT ALL ON public.professores TO service_role;
CREATE INDEX idx_professores_nome ON public.professores (nome_completo);
CREATE INDEX idx_professores_ativo ON public.professores (ativo);
CREATE INDEX idx_professores_user_id ON public.professores (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_professores_cpf ON public.professores (cpf) WHERE cpf IS NOT NULL;
CREATE INDEX idx_professores_nome_completo ON public.professores (nome_completo);
CREATE INDEX idx_professores_email ON public.professores (email);
CREATE TRIGGER on_professor_created AFTER INSERT ON public.professores FOR EACH ROW EXECUTE FUNCTION public.create_professor_user();
CREATE TRIGGER update_professores_updated_at BEFORE UPDATE ON public.professores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY professores_delete_authenticated ON public.professores FOR DELETE USING ((auth.role() = 'authenticated'::text));
CREATE POLICY professores_insert_authenticated ON public.professores FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY professores_select_authenticated ON public.professores FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY professores_update_authenticated ON public.professores FOR UPDATE USING ((auth.role() = 'authenticated'::text));
CREATE TABLE public.profiles (id uuid NOT NULL, nome_completo text NOT NULL, email text NOT NULL, telefone text, tipo_usuario text NOT NULL, ativo boolean DEFAULT true, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now(), primeira_senha boolean DEFAULT true);
CREATE POLICY config_campos_delete_allowed ON public.config_campos_obrigatorios FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (lower(profiles.tipo_usuario) = ANY (ARRAY['admin'::text, 'coordenacao'::text, 'secretaria'::text, 'diretor'::text]))))));
CREATE POLICY config_campos_insert_allowed ON public.config_campos_obrigatorios FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (lower(profiles.tipo_usuario) = ANY (ARRAY['admin'::text, 'coordenacao'::text, 'secretaria'::text, 'diretor'::text]))))));
CREATE POLICY config_campos_update_allowed ON public.config_campos_obrigatorios FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (lower(profiles.tipo_usuario) = ANY (ARRAY['admin'::text, 'coordenacao'::text, 'secretaria'::text, 'diretor'::text]))))));
CREATE POLICY links_documentos_delete_allowed ON public.links_documentos FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (lower(profiles.tipo_usuario) = ANY (ARRAY['admin'::text, 'coordenacao'::text, 'secretaria'::text, 'diretor'::text]))))));
CREATE POLICY links_documentos_insert_allowed ON public.links_documentos FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (lower(profiles.tipo_usuario) = ANY (ARRAY['admin'::text, 'coordenacao'::text, 'secretaria'::text, 'diretor'::text]))))));
CREATE POLICY links_documentos_update_allowed ON public.links_documentos FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (lower(profiles.tipo_usuario) = ANY (ARRAY['admin'::text, 'coordenacao'::text, 'secretaria'::text, 'diretor'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (lower(profiles.tipo_usuario) = ANY (ARRAY['admin'::text, 'coordenacao'::text, 'secretaria'::text, 'diretor'::text]))))));
CREATE POLICY periodos_letivos_delete_allowed ON public.periodos_letivos FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.tipo_usuario = ANY (ARRAY['admin'::text, 'coordenacao'::text, 'secretaria'::text, 'diretor'::text]))))));
CREATE POLICY periodos_letivos_insert_allowed ON public.periodos_letivos FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.tipo_usuario = ANY (ARRAY['admin'::text, 'coordenacao'::text, 'secretaria'::text, 'diretor'::text]))))));
CREATE POLICY periodos_letivos_update_allowed ON public.periodos_letivos FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.tipo_usuario = ANY (ARRAY['admin'::text, 'coordenacao'::text, 'secretaria'::text, 'diretor'::text]))))));
COMMENT ON TABLE public.profiles IS 'Perfis de usuários do sistema (admin, secretaria, professor, coordenacao)';
COMMENT ON COLUMN public.profiles.primeira_senha IS 'Indica se o usuário ainda não trocou a senha padrão';
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.avisos_aluno ADD CONSTRAINT avisos_aluno_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);
ALTER TABLE public.documentos ADD CONSTRAINT documentos_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.escola ADD CONSTRAINT escola_diretor_id_fkey FOREIGN KEY (diretor_id) REFERENCES public.profiles(id);
ALTER TABLE public.eventos ADD CONSTRAINT eventos_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.links_documentos ADD CONSTRAINT links_documentos_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);
ALTER TABLE public.professores ADD CONSTRAINT professores_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_tipo_usuario_check CHECK (tipo_usuario = ANY (ARRAY['admin'::text, 'secretaria'::text, 'professor'::text, 'coordenacao'::text, 'diretor'::text]));
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
CREATE INDEX idx_profiles_tipo_usuario ON public.profiles (tipo_usuario);
CREATE INDEX idx_profiles_email ON public.profiles (email);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (((((auth.jwt() -> 'user_metadata'::text) ->> 'tipo_usuario'::text) = 'admin'::text) OR (((auth.jwt() -> 'app_metadata'::text) ->> 'tipo_usuario'::text) = 'admin'::text)));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING ((id = auth.uid()));
CREATE POLICY profiles_delete_own ON public.profiles FOR DELETE TO authenticated USING ((id = auth.uid()));
CREATE POLICY profiles_insert_system ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT TO authenticated USING ((id = auth.uid()));
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));
CREATE TABLE public.turma_disciplinas (id uuid DEFAULT gen_random_uuid() NOT NULL, turma_id uuid, disciplina_id uuid, professor_id uuid, carga_horaria_semanal integer, created_at timestamp with time zone DEFAULT now());
COMMENT ON TABLE public.turma_disciplinas IS 'Associação entre turmas e disciplinas com professor responsável';
ALTER TABLE public.turma_disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turma_disciplinas ADD CONSTRAINT turma_disciplinas_carga_check CHECK (carga_horaria_semanal IS NULL OR carga_horaria_semanal > 0);
ALTER TABLE public.turma_disciplinas ADD CONSTRAINT turma_disciplinas_disciplina_fkey FOREIGN KEY (disciplina_id) REFERENCES public.disciplinas(id) ON DELETE CASCADE;
ALTER TABLE public.turma_disciplinas ADD CONSTRAINT turma_disciplinas_disciplina_id_fkey FOREIGN KEY (disciplina_id) REFERENCES public.disciplinas(id) ON DELETE CASCADE;
ALTER TABLE public.turma_disciplinas ADD CONSTRAINT turma_disciplinas_pkey PRIMARY KEY (id);
ALTER TABLE public.aulas ADD CONSTRAINT aulas_turma_disciplina_fkey FOREIGN KEY (turma_disciplina_id) REFERENCES public.turma_disciplinas(id) ON DELETE CASCADE;
ALTER TABLE public.aulas ADD CONSTRAINT aulas_turma_disciplina_id_fkey FOREIGN KEY (turma_disciplina_id) REFERENCES public.turma_disciplinas(id) ON DELETE CASCADE;
ALTER TABLE public.turma_disciplinas ADD CONSTRAINT turma_disciplinas_professor_fkey FOREIGN KEY (professor_id) REFERENCES public.professores(id) ON DELETE SET NULL;
ALTER TABLE public.turma_disciplinas ADD CONSTRAINT turma_disciplinas_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.professores(id);
ALTER TABLE public.turma_disciplinas ADD CONSTRAINT turma_disciplinas_turma_id_disciplina_id_key UNIQUE (turma_id, disciplina_id);
ALTER TABLE public.turma_disciplinas ADD CONSTRAINT turma_disciplinas_unique UNIQUE (turma_id, disciplina_id);
GRANT ALL ON public.turma_disciplinas TO anon;
GRANT ALL ON public.turma_disciplinas TO authenticated;
GRANT ALL ON public.turma_disciplinas TO service_role;
CREATE INDEX idx_turma_disciplinas_professor ON public.turma_disciplinas (professor_id) WHERE professor_id IS NOT NULL;
CREATE INDEX idx_turma_disciplinas_turma ON public.turma_disciplinas (turma_id);
CREATE INDEX idx_turma_disciplinas_disciplina ON public.turma_disciplinas (disciplina_id);
CREATE POLICY turma_disciplinas_delete_authenticated ON public.turma_disciplinas FOR DELETE USING ((auth.role() = 'authenticated'::text));
CREATE POLICY turma_disciplinas_insert_authenticated ON public.turma_disciplinas FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY turma_disciplinas_select_authenticated ON public.turma_disciplinas FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY turma_disciplinas_update_authenticated ON public.turma_disciplinas FOR UPDATE USING ((auth.role() = 'authenticated'::text));
CREATE TABLE public.turmas (id uuid DEFAULT gen_random_uuid() NOT NULL, nome text NOT NULL, ano_letivo integer NOT NULL, serie text NOT NULL, turno text, capacidade_maxima integer, professor_responsavel_id uuid, ativo boolean DEFAULT true, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());
COMMENT ON TABLE public.turmas IS 'Turmas organizadas por série, ano letivo e turno';
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas ADD CONSTRAINT turmas_capacidade_check CHECK (capacidade_maxima IS NULL OR capacidade_maxima > 0);
ALTER TABLE public.turmas ADD CONSTRAINT turmas_pkey PRIMARY KEY (id);
ALTER TABLE public.eventos ADD CONSTRAINT eventos_turma_fkey FOREIGN KEY (turma_id) REFERENCES public.turmas(id) ON DELETE CASCADE;
ALTER TABLE public.eventos ADD CONSTRAINT eventos_turma_id_fkey FOREIGN KEY (turma_id) REFERENCES public.turmas(id);
ALTER TABLE public.matriculas ADD CONSTRAINT matriculas_turma_fkey FOREIGN KEY (turma_id) REFERENCES public.turmas(id) ON DELETE CASCADE;
ALTER TABLE public.matriculas ADD CONSTRAINT matriculas_turma_id_fkey FOREIGN KEY (turma_id) REFERENCES public.turmas(id) ON DELETE CASCADE;
ALTER TABLE public.turma_disciplinas ADD CONSTRAINT turma_disciplinas_turma_fkey FOREIGN KEY (turma_id) REFERENCES public.turmas(id) ON DELETE CASCADE;
ALTER TABLE public.turma_disciplinas ADD CONSTRAINT turma_disciplinas_turma_id_fkey FOREIGN KEY (turma_id) REFERENCES public.turmas(id) ON DELETE CASCADE;
ALTER TABLE public.turmas ADD CONSTRAINT turmas_professor_responsavel_fkey FOREIGN KEY (professor_responsavel_id) REFERENCES public.professores(id) ON DELETE SET NULL;
ALTER TABLE public.turmas ADD CONSTRAINT turmas_professor_responsavel_id_fkey FOREIGN KEY (professor_responsavel_id) REFERENCES public.professores(id);
ALTER TABLE public.turmas ADD CONSTRAINT turmas_turno_check CHECK (turno = ANY (ARRAY['matutino'::text, 'vespertino'::text, 'noturno'::text, 'integral'::text]));
GRANT ALL ON public.turmas TO anon;
GRANT ALL ON public.turmas TO authenticated;
GRANT ALL ON public.turmas TO service_role;
CREATE INDEX idx_turmas_ano ON public.turmas (ano_letivo);
CREATE INDEX idx_turmas_nome ON public.turmas (nome);
CREATE INDEX idx_turmas_ano_letivo ON public.turmas (ano_letivo);
CREATE INDEX idx_turmas_serie ON public.turmas (serie);
CREATE INDEX idx_turmas_turno ON public.turmas (turno);
CREATE INDEX idx_turmas_ativo ON public.turmas (ativo);
CREATE INDEX idx_turmas_professor_responsavel ON public.turmas (professor_responsavel_id) WHERE professor_responsavel_id IS NOT NULL;
CREATE INDEX idx_turmas_professor ON public.turmas (professor_responsavel_id);
CREATE TRIGGER update_turmas_updated_at BEFORE UPDATE ON public.turmas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY turmas_delete_allowed_users ON public.turmas FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.tipo_usuario = ANY (ARRAY['diretor'::text, 'secretaria'::text, 'coordenacao'::text]))))));
CREATE POLICY turmas_insert_allowed_users ON public.turmas FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.tipo_usuario = ANY (ARRAY['diretor'::text, 'secretaria'::text, 'coordenacao'::text]))))));
CREATE POLICY turmas_select_all_authenticated ON public.turmas FOR SELECT TO authenticated USING (true);
CREATE POLICY turmas_update_allowed_users ON public.turmas FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.tipo_usuario = ANY (ARRAY['diretor'::text, 'secretaria'::text, 'coordenacao'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.tipo_usuario = ANY (ARRAY['diretor'::text, 'secretaria'::text, 'coordenacao'::text]))))));
CREATE TABLE public.user_invites (id uuid DEFAULT gen_random_uuid() NOT NULL, email text NOT NULL, tipo_usuario text NOT NULL, invited_by uuid, token text NOT NULL, expires_at timestamp with time zone NOT NULL, accepted_at timestamp with time zone, created_at timestamp with time zone DEFAULT now());
ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invites ADD CONSTRAINT user_invites_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.profiles(id);
ALTER TABLE public.user_invites ADD CONSTRAINT user_invites_pkey PRIMARY KEY (id);
ALTER TABLE public.user_invites ADD CONSTRAINT user_invites_role_check CHECK (tipo_usuario = ANY (ARRAY['admin'::text, 'secretaria'::text, 'professor'::text, 'coordenacao'::text]));
ALTER TABLE public.user_invites ADD CONSTRAINT user_invites_token_key UNIQUE (token);
GRANT ALL ON public.user_invites TO anon;
GRANT ALL ON public.user_invites TO authenticated;
GRANT ALL ON public.user_invites TO service_role;
CREATE INDEX idx_user_invites_email ON public.user_invites (email);
CREATE INDEX idx_user_invites_token ON public.user_invites (token);
CREATE VIEW public.vw_alunos_matriculados AS SELECT a.id AS aluno_id,
    a.nome_completo,
    a.cpf,
    a.email,
    a.telefone,
    m.id AS matricula_id,
    m.numero_matricula,
    m.status AS status_matricula,
    m.ano_letivo,
    t.id AS turma_id,
    t.nome AS turma_nome,
    t.serie,
    t.turno
   FROM ((public.alunos a
     LEFT JOIN public.matriculas m ON ((a.id = m.aluno_id)))
     LEFT JOIN public.turmas t ON ((m.turma_id = t.id)))
  WHERE (a.ativo = true);
GRANT ALL ON public.vw_alunos_matriculados TO anon;
GRANT ALL ON public.vw_alunos_matriculados TO authenticated;
GRANT ALL ON public.vw_alunos_matriculados TO service_role;
CREATE VIEW public.vw_frequencia_alunos AS SELECT a.id AS aluno_id,
    a.nome_completo AS aluno_nome,
    t.nome AS turma_nome,
    d.nome AS disciplina_nome,
    count(p.id) AS total_aulas,
    sum(
        CASE
            WHEN (p.presente = true) THEN 1
            ELSE 0
        END) AS presencas,
    sum(
        CASE
            WHEN (p.presente = false) THEN 1
            ELSE 0
        END) AS faltas,
    round((((sum(
        CASE
            WHEN (p.presente = true) THEN 1
            ELSE 0
        END))::numeric / (NULLIF(count(p.id), 0))::numeric) * (100)::numeric), 2) AS percentual_presenca
   FROM (((((public.alunos a
     JOIN public.presencas p ON ((a.id = p.aluno_id)))
     JOIN public.aulas au ON ((p.aula_id = au.id)))
     JOIN public.turma_disciplinas td ON ((au.turma_disciplina_id = td.id)))
     JOIN public.turmas t ON ((td.turma_id = t.id)))
     JOIN public.disciplinas d ON ((td.disciplina_id = d.id)))
  WHERE (a.ativo = true)
  GROUP BY a.id, a.nome_completo, t.nome, d.nome;
GRANT ALL ON public.vw_frequencia_alunos TO anon;
GRANT ALL ON public.vw_frequencia_alunos TO authenticated;
GRANT ALL ON public.vw_frequencia_alunos TO service_role;
CREATE VIEW public.vw_notas_alunos AS SELECT a.id AS aluno_id,
    a.nome_completo AS aluno_nome,
    t.nome AS turma_nome,
    d.nome AS disciplina_nome,
    d.codigo AS disciplina_codigo,
    n.bimestre,
    n.nota,
    n.tipo_avaliacao,
    n.data_avaliacao,
    m.ano_letivo
   FROM ((((public.alunos a
     JOIN public.matriculas m ON ((a.id = m.aluno_id)))
     JOIN public.turmas t ON ((m.turma_id = t.id)))
     JOIN public.notas n ON ((m.id = n.matricula_id)))
     JOIN public.disciplinas d ON ((n.disciplina_id = d.id)))
  WHERE ((a.ativo = true) AND (m.status = 'ativa'::text));
GRANT ALL ON public.vw_notas_alunos TO anon;
GRANT ALL ON public.vw_notas_alunos TO authenticated;
GRANT ALL ON public.vw_notas_alunos TO service_role;
CREATE VIEW public.vw_professores_disciplinas AS SELECT p.id AS professor_id,
    p.nome_completo,
    p.email,
    p.telefone,
    p.formacao,
    p.especializacao,
    d.id AS disciplina_id,
    d.nome AS disciplina_nome,
    d.codigo AS disciplina_codigo
   FROM ((public.professores p
     LEFT JOIN public.professor_disciplinas pd ON ((p.id = pd.professor_id)))
     LEFT JOIN public.disciplinas d ON ((pd.disciplina_id = d.id)))
  WHERE (p.ativo = true);
GRANT ALL ON public.vw_professores_disciplinas TO anon;
GRANT ALL ON public.vw_professores_disciplinas TO authenticated;
GRANT ALL ON public.vw_professores_disciplinas TO service_role;
COMMENT ON POLICY profiles_delete_own ON public.profiles IS 'Permite que usuários deletem seu próprio perfil';
COMMENT ON POLICY profiles_insert_system ON public.profiles IS 'Permite inserção de novos perfis pelo sistema durante o cadastro';
COMMENT ON POLICY profiles_select_own ON public.profiles IS 'Permite que usuários vejam seu próprio perfil';
COMMENT ON POLICY profiles_update_own ON public.profiles IS 'Permite que usuários atualizem seu próprio perfil';
