-- =====================================================
-- SCRIPT DE CORREÇÃO E PADRONIZAÇÃO DO SCHEMA
-- =====================================================
-- Este script corrige inconsistências, adiciona constraints,
-- índices e melhora a integridade do banco de dados

-- =====================================================
-- 1. CORREÇÕES NA TABELA PROFILES
-- =====================================================

-- Adicionar coluna role se não existir (padronização)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT;

-- Migrar dados de tipo_usuario para role se necessário
UPDATE public.profiles 
SET role = CASE 
    WHEN tipo_usuario = 'diretor' THEN 'admin'
    WHEN tipo_usuario = 'secretaria' THEN 'secretaria'
    WHEN tipo_usuario = 'professor' THEN 'professor'
    WHEN tipo_usuario = 'coordenacao' THEN 'coordenacao'
    ELSE 'professor'
END
WHERE role IS NULL AND tipo_usuario IS NOT NULL;

-- Adicionar constraint para role
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('admin', 'secretaria', 'professor', 'coordenacao'));

-- Tornar role NOT NULL
UPDATE public.profiles SET role = 'professor' WHERE role IS NULL;
ALTER TABLE public.profiles ALTER COLUMN role SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'professor';

-- Adicionar constraint de email único
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_email_unique;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- =====================================================
-- 2. CORREÇÕES NA TABELA ALUNOS
-- =====================================================

-- Garantir que nome_completo e data_nascimento sejam NOT NULL
UPDATE public.alunos SET nome_completo = 'Nome não informado' WHERE nome_completo IS NULL OR nome_completo = '';
ALTER TABLE public.alunos ALTER COLUMN nome_completo SET NOT NULL;

UPDATE public.alunos SET data_nascimento = '2000-01-01' WHERE data_nascimento IS NULL;
ALTER TABLE public.alunos ALTER COLUMN data_nascimento SET NOT NULL;

-- Adicionar constraints de validação
ALTER TABLE public.alunos DROP CONSTRAINT IF EXISTS alunos_sexo_check;
ALTER TABLE public.alunos ADD CONSTRAINT alunos_sexo_check 
    CHECK (sexo IS NULL OR sexo IN ('Masculino', 'Feminino', 'Outro'));

-- Adicionar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_alunos_nome_completo ON public.alunos(nome_completo);
CREATE INDEX IF NOT EXISTS idx_alunos_cpf ON public.alunos(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_alunos_ativo ON public.alunos(ativo);
CREATE INDEX IF NOT EXISTS idx_alunos_data_nascimento ON public.alunos(data_nascimento);

-- =====================================================
-- 3. CORREÇÕES NA TABELA PROFESSORES
-- =====================================================

-- Garantir que campos obrigatórios sejam NOT NULL
UPDATE public.professores SET nome_completo = 'Nome não informado' WHERE nome_completo IS NULL OR nome_completo = '';
ALTER TABLE public.professores ALTER COLUMN nome_completo SET NOT NULL;

UPDATE public.professores SET email = 'email@exemplo.com' WHERE email IS NULL OR email = '';
ALTER TABLE public.professores ALTER COLUMN email SET NOT NULL;

-- Adicionar constraint de email único
ALTER TABLE public.professores DROP CONSTRAINT IF EXISTS professores_email_unique;
ALTER TABLE public.professores ADD CONSTRAINT professores_email_unique UNIQUE (email);

-- Adicionar índices
CREATE INDEX IF NOT EXISTS idx_professores_nome_completo ON public.professores(nome_completo);
CREATE INDEX IF NOT EXISTS idx_professores_cpf ON public.professores(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_professores_email ON public.professores(email);
CREATE INDEX IF NOT EXISTS idx_professores_ativo ON public.professores(ativo);
CREATE INDEX IF NOT EXISTS idx_professores_user_id ON public.professores(user_id) WHERE user_id IS NOT NULL;

-- =====================================================
-- 4. CORREÇÕES NA TABELA DISCIPLINAS
-- =====================================================

-- Garantir que campos obrigatórios sejam NOT NULL
UPDATE public.disciplinas SET nome = 'Disciplina sem nome' WHERE nome IS NULL OR nome = '';
ALTER TABLE public.disciplinas ALTER COLUMN nome SET NOT NULL;

UPDATE public.disciplinas SET codigo = 'COD' || id::text WHERE codigo IS NULL OR codigo = '';
ALTER TABLE public.disciplinas ALTER COLUMN codigo SET NOT NULL;

-- Adicionar constraint de código único
ALTER TABLE public.disciplinas DROP CONSTRAINT IF EXISTS disciplinas_codigo_unique;
ALTER TABLE public.disciplinas ADD CONSTRAINT disciplinas_codigo_unique UNIQUE (codigo);

-- Adicionar constraint para carga horária
ALTER TABLE public.disciplinas DROP CONSTRAINT IF EXISTS disciplinas_carga_horaria_check;
ALTER TABLE public.disciplinas ADD CONSTRAINT disciplinas_carga_horaria_check 
    CHECK (carga_horaria IS NULL OR carga_horaria > 0);

-- Adicionar índices
CREATE INDEX IF NOT EXISTS idx_disciplinas_nome ON public.disciplinas(nome);
CREATE INDEX IF NOT EXISTS idx_disciplinas_codigo ON public.disciplinas(codigo);
CREATE INDEX IF NOT EXISTS idx_disciplinas_ativo ON public.disciplinas(ativo);

-- =====================================================
-- 5. CORREÇÕES NA TABELA TURMAS
-- =====================================================

-- Garantir que campos obrigatórios sejam NOT NULL
UPDATE public.turmas SET nome = 'Turma sem nome' WHERE nome IS NULL OR nome = '';
ALTER TABLE public.turmas ALTER COLUMN nome SET NOT NULL;

UPDATE public.turmas SET serie = '1º Ano' WHERE serie IS NULL OR serie = '';
ALTER TABLE public.turmas ALTER COLUMN serie SET NOT NULL;

UPDATE public.turmas SET ano_letivo = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER WHERE ano_letivo IS NULL;
ALTER TABLE public.turmas ALTER COLUMN ano_letivo SET NOT NULL;

-- Adicionar constraint para turno
ALTER TABLE public.turmas DROP CONSTRAINT IF EXISTS turmas_turno_check;
ALTER TABLE public.turmas ADD CONSTRAINT turmas_turno_check 
    CHECK (turno IN ('matutino', 'vespertino', 'noturno', 'integral'));

-- Adicionar constraint para capacidade máxima
ALTER TABLE public.turmas DROP CONSTRAINT IF EXISTS turmas_capacidade_check;
ALTER TABLE public.turmas ADD CONSTRAINT turmas_capacidade_check 
    CHECK (capacidade_maxima IS NULL OR capacidade_maxima > 0);

-- Adicionar foreign key para professor_responsavel_id se não existir
ALTER TABLE public.turmas DROP CONSTRAINT IF EXISTS turmas_professor_responsavel_fkey;
ALTER TABLE public.turmas ADD CONSTRAINT turmas_professor_responsavel_fkey 
    FOREIGN KEY (professor_responsavel_id) REFERENCES public.professores(id) ON DELETE SET NULL;

-- Adicionar índices
CREATE INDEX IF NOT EXISTS idx_turmas_nome ON public.turmas(nome);
CREATE INDEX IF NOT EXISTS idx_turmas_ano_letivo ON public.turmas(ano_letivo);
CREATE INDEX IF NOT EXISTS idx_turmas_serie ON public.turmas(serie);
CREATE INDEX IF NOT EXISTS idx_turmas_turno ON public.turmas(turno);
CREATE INDEX IF NOT EXISTS idx_turmas_ativo ON public.turmas(ativo);
CREATE INDEX IF NOT EXISTS idx_turmas_professor_responsavel ON public.turmas(professor_responsavel_id) WHERE professor_responsavel_id IS NOT NULL;

-- =====================================================
-- 6. CORREÇÕES NA TABELA MATRICULAS
-- =====================================================

-- Garantir que campos obrigatórios sejam NOT NULL
UPDATE public.matriculas SET numero_matricula = 'MAT' || id::text WHERE numero_matricula IS NULL OR numero_matricula = '';
ALTER TABLE public.matriculas ALTER COLUMN numero_matricula SET NOT NULL;

UPDATE public.matriculas SET data_matricula = CURRENT_DATE WHERE data_matricula IS NULL;
ALTER TABLE public.matriculas ALTER COLUMN data_matricula SET NOT NULL;

-- Adicionar constraint de status
ALTER TABLE public.matriculas DROP CONSTRAINT IF EXISTS matriculas_status_check;
ALTER TABLE public.matriculas ADD CONSTRAINT matriculas_status_check 
    CHECK (status IN ('ativa', 'transferida', 'cancelada', 'concluida', 'trancada'));

-- Adicionar constraint de número de matrícula único
ALTER TABLE public.matriculas DROP CONSTRAINT IF EXISTS matriculas_numero_unique;
ALTER TABLE public.matriculas ADD CONSTRAINT matriculas_numero_unique UNIQUE (numero_matricula);

-- Adicionar foreign keys se não existirem
ALTER TABLE public.matriculas DROP CONSTRAINT IF EXISTS matriculas_aluno_fkey;
ALTER TABLE public.matriculas ADD CONSTRAINT matriculas_aluno_fkey 
    FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE CASCADE;

ALTER TABLE public.matriculas DROP CONSTRAINT IF EXISTS matriculas_turma_fkey;
ALTER TABLE public.matriculas ADD CONSTRAINT matriculas_turma_fkey 
    FOREIGN KEY (turma_id) REFERENCES public.turmas(id) ON DELETE CASCADE;

-- Adicionar índices
CREATE INDEX IF NOT EXISTS idx_matriculas_numero ON public.matriculas(numero_matricula);
CREATE INDEX IF NOT EXISTS idx_matriculas_aluno_id ON public.matriculas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_turma_id ON public.matriculas(turma_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_status ON public.matriculas(status);
CREATE INDEX IF NOT EXISTS idx_matriculas_ano_letivo ON public.matriculas(ano_letivo) WHERE ano_letivo IS NOT NULL;

-- =====================================================
-- 7. CORREÇÕES NA TABELA TURMA_DISCIPLINAS
-- =====================================================

-- Adicionar foreign keys se não existirem
ALTER TABLE public.turma_disciplinas DROP CONSTRAINT IF EXISTS turma_disciplinas_turma_fkey;
ALTER TABLE public.turma_disciplinas ADD CONSTRAINT turma_disciplinas_turma_fkey 
    FOREIGN KEY (turma_id) REFERENCES public.turmas(id) ON DELETE CASCADE;

ALTER TABLE public.turma_disciplinas DROP CONSTRAINT IF EXISTS turma_disciplinas_disciplina_fkey;
ALTER TABLE public.turma_disciplinas ADD CONSTRAINT turma_disciplinas_disciplina_fkey 
    FOREIGN KEY (disciplina_id) REFERENCES public.disciplinas(id) ON DELETE CASCADE;

ALTER TABLE public.turma_disciplinas DROP CONSTRAINT IF EXISTS turma_disciplinas_professor_fkey;
ALTER TABLE public.turma_disciplinas ADD CONSTRAINT turma_disciplinas_professor_fkey 
    FOREIGN KEY (professor_id) REFERENCES public.professores(id) ON DELETE SET NULL;

-- Adicionar constraint de unicidade
ALTER TABLE public.turma_disciplinas DROP CONSTRAINT IF EXISTS turma_disciplinas_unique;
ALTER TABLE public.turma_disciplinas ADD CONSTRAINT turma_disciplinas_unique 
    UNIQUE (turma_id, disciplina_id);

-- Adicionar constraint para carga horária semanal
ALTER TABLE public.turma_disciplinas DROP CONSTRAINT IF EXISTS turma_disciplinas_carga_check;
ALTER TABLE public.turma_disciplinas ADD CONSTRAINT turma_disciplinas_carga_check 
    CHECK (carga_horaria_semanal IS NULL OR carga_horaria_semanal > 0);

-- Adicionar índices
CREATE INDEX IF NOT EXISTS idx_turma_disciplinas_turma ON public.turma_disciplinas(turma_id);
CREATE INDEX IF NOT EXISTS idx_turma_disciplinas_disciplina ON public.turma_disciplinas(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_turma_disciplinas_professor ON public.turma_disciplinas(professor_id) WHERE professor_id IS NOT NULL;

-- =====================================================
-- 8. CORREÇÕES NA TABELA AULAS
-- =====================================================

-- Adicionar foreign key para turma_disciplina_id se não existir
ALTER TABLE public.aulas DROP CONSTRAINT IF EXISTS aulas_turma_disciplina_fkey;
ALTER TABLE public.aulas ADD CONSTRAINT aulas_turma_disciplina_fkey 
    FOREIGN KEY (turma_disciplina_id) REFERENCES public.turma_disciplinas(id) ON DELETE CASCADE;

-- Garantir que campos obrigatórios sejam NOT NULL
UPDATE public.aulas SET data_aula = CURRENT_DATE WHERE data_aula IS NULL;
ALTER TABLE public.aulas ALTER COLUMN data_aula SET NOT NULL;

-- Adicionar constraint para validar horários
ALTER TABLE public.aulas DROP CONSTRAINT IF EXISTS aulas_horario_check;
ALTER TABLE public.aulas ADD CONSTRAINT aulas_horario_check 
    CHECK (hora_fim > hora_inicio);

-- Adicionar índices
CREATE INDEX IF NOT EXISTS idx_aulas_turma_disciplina ON public.aulas(turma_disciplina_id);
CREATE INDEX IF NOT EXISTS idx_aulas_data ON public.aulas(data_aula);
CREATE INDEX IF NOT EXISTS idx_aulas_data_hora ON public.aulas(data_aula, hora_inicio);

-- =====================================================
-- 9. CORREÇÕES NA TABELA PRESENCAS
-- =====================================================

-- Adicionar foreign keys se não existirem
ALTER TABLE public.presencas DROP CONSTRAINT IF EXISTS presencas_aula_fkey;
ALTER TABLE public.presencas ADD CONSTRAINT presencas_aula_fkey 
    FOREIGN KEY (aula_id) REFERENCES public.aulas(id) ON DELETE CASCADE;

ALTER TABLE public.presencas DROP CONSTRAINT IF EXISTS presencas_aluno_fkey;
ALTER TABLE public.presencas ADD CONSTRAINT presencas_aluno_fkey 
    FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE CASCADE;

-- Adicionar constraint de unicidade
ALTER TABLE public.presencas DROP CONSTRAINT IF EXISTS presencas_unique;
ALTER TABLE public.presencas ADD CONSTRAINT presencas_unique 
    UNIQUE (aula_id, aluno_id);

-- Adicionar índices
CREATE INDEX IF NOT EXISTS idx_presencas_aula ON public.presencas(aula_id);
CREATE INDEX IF NOT EXISTS idx_presencas_aluno ON public.presencas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_presencas_presente ON public.presencas(presente);

-- =====================================================
-- 10. CORREÇÕES NA TABELA NOTAS
-- =====================================================

-- Adicionar foreign keys se não existirem
ALTER TABLE public.notas DROP CONSTRAINT IF EXISTS notas_matricula_fkey;
ALTER TABLE public.notas ADD CONSTRAINT notas_matricula_fkey 
    FOREIGN KEY (matricula_id) REFERENCES public.matriculas(id) ON DELETE CASCADE;

ALTER TABLE public.notas DROP CONSTRAINT IF EXISTS notas_disciplina_fkey;
ALTER TABLE public.notas ADD CONSTRAINT notas_disciplina_fkey 
    FOREIGN KEY (disciplina_id) REFERENCES public.disciplinas(id) ON DELETE CASCADE;

-- Adicionar constraint para validar nota
ALTER TABLE public.notas DROP CONSTRAINT IF EXISTS notas_nota_check;
ALTER TABLE public.notas ADD CONSTRAINT notas_nota_check 
    CHECK (nota IS NULL OR (nota >= 0 AND nota <= 10));

-- Adicionar constraint para validar bimestre
ALTER TABLE public.notas DROP CONSTRAINT IF EXISTS notas_bimestre_check;
ALTER TABLE public.notas ADD CONSTRAINT notas_bimestre_check 
    CHECK (bimestre IS NULL OR bimestre IN (1, 2, 3, 4));

-- Adicionar índices
CREATE INDEX IF NOT EXISTS idx_notas_matricula ON public.notas(matricula_id);
CREATE INDEX IF NOT EXISTS idx_notas_disciplina ON public.notas(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_notas_bimestre ON public.notas(bimestre) WHERE bimestre IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notas_data_avaliacao ON public.notas(data_avaliacao) WHERE data_avaliacao IS NOT NULL;

-- =====================================================
-- 11. CORREÇÕES NA TABELA EVENTOS
-- =====================================================

-- Adicionar foreign keys se não existirem
ALTER TABLE public.eventos DROP CONSTRAINT IF EXISTS eventos_turma_fkey;
ALTER TABLE public.eventos ADD CONSTRAINT eventos_turma_fkey 
    FOREIGN KEY (turma_id) REFERENCES public.turmas(id) ON DELETE CASCADE;

ALTER TABLE public.eventos DROP CONSTRAINT IF EXISTS eventos_professor_fkey;
ALTER TABLE public.eventos ADD CONSTRAINT eventos_professor_fkey 
    FOREIGN KEY (professor_id) REFERENCES public.professores(id) ON DELETE SET NULL;

ALTER TABLE public.eventos DROP CONSTRAINT IF EXISTS eventos_created_by_fkey;
ALTER TABLE public.eventos ADD CONSTRAINT eventos_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Garantir que campos obrigatórios sejam NOT NULL
UPDATE public.eventos SET titulo = 'Evento sem título' WHERE titulo IS NULL OR titulo = '';
ALTER TABLE public.eventos ALTER COLUMN titulo SET NOT NULL;

UPDATE public.eventos SET data_inicio = CURRENT_DATE WHERE data_inicio IS NULL;
ALTER TABLE public.eventos ALTER COLUMN data_inicio SET NOT NULL;

-- Adicionar constraint para validar datas
ALTER TABLE public.eventos DROP CONSTRAINT IF EXISTS eventos_data_check;
ALTER TABLE public.eventos ADD CONSTRAINT eventos_data_check 
    CHECK (data_fim IS NULL OR data_fim >= data_inicio);

-- Adicionar constraint para tipo de evento
ALTER TABLE public.eventos DROP CONSTRAINT IF EXISTS eventos_tipo_check;
ALTER TABLE public.eventos ADD CONSTRAINT eventos_tipo_check 
    CHECK (tipo_evento IS NULL OR tipo_evento IN ('aula', 'prova', 'reuniao', 'evento', 'feriado', 'outros'));

-- Adicionar índices
CREATE INDEX IF NOT EXISTS idx_eventos_data_inicio ON public.eventos(data_inicio);
CREATE INDEX IF NOT EXISTS idx_eventos_data_fim ON public.eventos(data_fim) WHERE data_fim IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_eventos_tipo ON public.eventos(tipo_evento) WHERE tipo_evento IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_eventos_turma ON public.eventos(turma_id) WHERE turma_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_eventos_professor ON public.eventos(professor_id) WHERE professor_id IS NOT NULL;

-- =====================================================
-- 12. CORREÇÕES NA TABELA DOCUMENTOS
-- =====================================================

-- Adicionar foreign keys se não existirem
ALTER TABLE public.documentos DROP CONSTRAINT IF EXISTS documentos_aluno_fkey;
ALTER TABLE public.documentos ADD CONSTRAINT documentos_aluno_fkey 
    FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE CASCADE;

ALTER TABLE public.documentos DROP CONSTRAINT IF EXISTS documentos_professor_fkey;
ALTER TABLE public.documentos ADD CONSTRAINT documentos_professor_fkey 
    FOREIGN KEY (professor_id) REFERENCES public.professores(id) ON DELETE CASCADE;

ALTER TABLE public.documentos DROP CONSTRAINT IF EXISTS documentos_uploaded_by_fkey;
ALTER TABLE public.documentos ADD CONSTRAINT documentos_uploaded_by_fkey 
    FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Garantir que campos obrigatórios sejam NOT NULL
UPDATE public.documentos SET nome = 'Documento sem nome' WHERE nome IS NULL OR nome = '';
ALTER TABLE public.documentos ALTER COLUMN nome SET NOT NULL;

UPDATE public.documentos SET tipo = 'outros' WHERE tipo IS NULL OR tipo = '';
ALTER TABLE public.documentos ALTER COLUMN tipo SET NOT NULL;

-- Adicionar índices
CREATE INDEX IF NOT EXISTS idx_documentos_aluno ON public.documentos(aluno_id) WHERE aluno_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documentos_professor ON public.documentos(professor_id) WHERE professor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON public.documentos(tipo);

-- =====================================================
-- 13. ATUALIZAR FUNÇÃO GET_USER_ROLE
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM public.profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- 14. ADICIONAR COMENTÁRIOS NAS TABELAS
-- =====================================================

COMMENT ON TABLE public.profiles IS 'Perfis de usuários do sistema (admin, secretaria, professor, coordenacao)';
COMMENT ON TABLE public.alunos IS 'Cadastro completo de alunos';
COMMENT ON TABLE public.professores IS 'Cadastro de professores';
COMMENT ON TABLE public.disciplinas IS 'Disciplinas oferecidas pela escola';
COMMENT ON TABLE public.turmas IS 'Turmas organizadas por série, ano letivo e turno';
COMMENT ON TABLE public.matriculas IS 'Matrículas de alunos em turmas';
COMMENT ON TABLE public.turma_disciplinas IS 'Associação entre turmas e disciplinas com professor responsável';
COMMENT ON TABLE public.aulas IS 'Registro de aulas ministradas';
COMMENT ON TABLE public.presencas IS 'Registro de presença dos alunos nas aulas';
COMMENT ON TABLE public.notas IS 'Notas dos alunos por disciplina e bimestre';
COMMENT ON TABLE public.eventos IS 'Agenda de eventos escolares';
COMMENT ON TABLE public.documentos IS 'Documentos anexados a alunos ou professores';

-- =====================================================
-- SCRIPT CONCLUÍDO
-- =====================================================
-- Este script corrige todas as inconsistências encontradas no schema
-- Adiciona constraints, índices e melhora a integridade referencial
