-- =====================================================
-- SCRIPT COMPLETO PARA IMPLEMENTAÇÃO DO ERP EDUCACIONAL
-- =====================================================
-- Este script deve ser executado em um banco Supabase limpo
-- Inclui: Schema completo, RLS, triggers, políticas e dados iniciais

-- =====================================================
-- 1. EXTENSÕES NECESSÁRIAS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 2. CRIAÇÃO DAS TABELAS PRINCIPAIS
-- =====================================================

-- Tabela de perfis de usuário (estende auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nome_completo TEXT NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT,
    role TEXT NOT NULL DEFAULT 'professor' CHECK (role IN ('admin', 'secretaria', 'professor', 'coordenacao')),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de dados da escola
CREATE TABLE IF NOT EXISTS public.escola (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome TEXT NOT NULL,
    cnpj TEXT,
    endereco TEXT,
    telefone TEXT,
    email TEXT,
    diretor_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de convites para novos usuários
CREATE TABLE IF NOT EXISTS public.convites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'secretaria', 'professor', 'coordenacao')),
    token TEXT NOT NULL UNIQUE,
    usado BOOLEAN DEFAULT false,
    convidado_por UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Tabela de alunos
CREATE TABLE IF NOT EXISTS public.alunos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome_completo TEXT NOT NULL,
    data_nascimento DATE NOT NULL,
    cpf TEXT UNIQUE,
    rg TEXT,
    endereco TEXT,
    telefone TEXT,
    email TEXT,
    nome_responsavel TEXT,
    telefone_responsavel TEXT,
    email_responsavel TEXT,
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de professores
CREATE TABLE IF NOT EXISTS public.professores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome_completo TEXT NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    rg TEXT,
    data_nascimento DATE,
    endereco TEXT,
    telefone TEXT,
    email TEXT UNIQUE NOT NULL,
    formacao TEXT,
    especializacao TEXT,
    registro_profissional TEXT,
    salario DECIMAL(10,2),
    data_admissao DATE DEFAULT CURRENT_DATE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de disciplinas
CREATE TABLE IF NOT EXISTS public.disciplinas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome TEXT NOT NULL,
    codigo TEXT UNIQUE NOT NULL,
    carga_horaria INTEGER NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de turmas
CREATE TABLE IF NOT EXISTS public.turmas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome TEXT NOT NULL,
    serie TEXT NOT NULL,
    ano_letivo INTEGER NOT NULL,
    turno TEXT NOT NULL CHECK (turno IN ('matutino', 'vespertino', 'noturno')),
    professor_responsavel_id UUID REFERENCES public.professores(id),
    capacidade_maxima INTEGER DEFAULT 30,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de associação turma-disciplina
CREATE TABLE IF NOT EXISTS public.turma_disciplinas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE,
    disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE CASCADE,
    professor_id UUID REFERENCES public.professores(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(turma_id, disciplina_id)
);

-- Tabela de matrículas
CREATE TABLE IF NOT EXISTS public.matriculas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    numero_matricula TEXT UNIQUE NOT NULL,
    aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
    turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE,
    data_matricula DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'ativa' CHECK (status IN ('ativa', 'transferida', 'cancelada', 'concluida')),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de aulas
CREATE TABLE IF NOT EXISTS public.aulas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE,
    disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE CASCADE,
    professor_id UUID REFERENCES public.professores(id),
    data_aula DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    conteudo TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de presença
CREATE TABLE IF NOT EXISTS public.presenca (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    aula_id UUID REFERENCES public.aulas(id) ON DELETE CASCADE,
    aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
    presente BOOLEAN DEFAULT false,
    justificativa TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(aula_id, aluno_id)
);

-- Tabela de notas
CREATE TABLE IF NOT EXISTS public.notas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
    disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE CASCADE,
    turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE,
    professor_id UUID REFERENCES public.professores(id),
    tipo_avaliacao TEXT NOT NULL,
    nota DECIMAL(4,2) NOT NULL CHECK (nota >= 0 AND nota <= 10),
    data_avaliacao DATE NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de eventos
CREATE TABLE IF NOT EXISTS public.eventos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT,
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE,
    tipo_evento TEXT NOT NULL CHECK (tipo_evento IN ('reuniao', 'feriado', 'evento_escolar', 'prova', 'outros')),
    criado_por UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_alunos_nome ON public.alunos(nome_completo);
CREATE INDEX IF NOT EXISTS idx_professores_nome ON public.professores(nome_completo);
CREATE INDEX IF NOT EXISTS idx_matriculas_numero ON public.matriculas(numero_matricula);
CREATE INDEX IF NOT EXISTS idx_matriculas_status ON public.matriculas(status);
CREATE INDEX IF NOT EXISTS idx_aulas_data ON public.aulas(data_aula);
CREATE INDEX IF NOT EXISTS idx_eventos_data ON public.eventos(data_inicio);

-- =====================================================
-- 4. TRIGGERS PARA UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas relevantes
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_escola_updated_at BEFORE UPDATE ON public.escola FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alunos_updated_at BEFORE UPDATE ON public.alunos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_professores_updated_at BEFORE UPDATE ON public.professores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_disciplinas_updated_at BEFORE UPDATE ON public.disciplinas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_turmas_updated_at BEFORE UPDATE ON public.turmas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matriculas_updated_at BEFORE UPDATE ON public.matriculas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_aulas_updated_at BEFORE UPDATE ON public.aulas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notas_updated_at BEFORE UPDATE ON public.notas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_eventos_updated_at BEFORE UPDATE ON public.eventos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. TRIGGER PARA CRIAÇÃO AUTOMÁTICA DE PERFIL
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_count INTEGER;
    user_role TEXT;
    user_name TEXT;
    user_phone TEXT;
BEGIN
    -- Contar usuários existentes
    SELECT COUNT(*) INTO user_count FROM public.profiles;
    
    -- Extrair dados dos metadados
    user_name := COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.raw_user_meta_data->>'full_name', 'Usuário');
    user_phone := NEW.raw_user_meta_data->>'telefone';
    
    -- Mapear tipo_usuario para role
    CASE NEW.raw_user_meta_data->>'tipo_usuario'
        WHEN 'diretor' THEN user_role := 'admin';
        WHEN 'secretaria' THEN user_role := 'secretaria';
        WHEN 'professor' THEN user_role := 'professor';
        WHEN 'coordenacao' THEN user_role := 'coordenacao';
        ELSE user_role := 'professor';
    END CASE;
    
    -- Primeiro usuário sempre é admin
    IF user_count = 0 THEN
        user_role := 'admin';
    END IF;
    
    -- Inserir perfil
    INSERT INTO public.profiles (
        id,
        nome_completo,
        email,
        telefone,
        role
    ) VALUES (
        NEW.id,
        user_name,
        NEW.email,
        user_phone,
        user_role
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 6. FUNÇÃO PARA GERAR NÚMERO DE MATRÍCULA
-- =====================================================
CREATE OR REPLACE FUNCTION generate_matricula_number()
RETURNS TRIGGER AS $$
DECLARE
    year_suffix TEXT;
    sequence_num INTEGER;
    new_matricula TEXT;
BEGIN
    -- Obter ano atual
    year_suffix := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- Obter próximo número sequencial para o ano
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_matricula FROM 5) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.matriculas
    WHERE numero_matricula LIKE year_suffix || '%';
    
    -- Gerar número de matrícula: AAAA + sequencial com 4 dígitos
    new_matricula := year_suffix || LPAD(sequence_num::TEXT, 4, '0');
    
    NEW.numero_matricula := new_matricula;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_matricula_trigger
    BEFORE INSERT ON public.matriculas
    FOR EACH ROW
    WHEN (NEW.numero_matricula IS NULL OR NEW.numero_matricula = '')
    EXECUTE FUNCTION generate_matricula_number();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escola ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turma_disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presenca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. POLÍTICAS RLS
-- =====================================================

-- Função auxiliar para verificar role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM public.profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas para profiles
CREATE POLICY "Usuários podem ver próprio perfil" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuários podem atualizar próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins podem ver todos os perfis" ON public.profiles FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "Admins podem atualizar perfis" ON public.profiles FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY "Sistema pode inserir perfis" ON public.profiles FOR INSERT WITH CHECK (true);

-- Políticas para escola
CREATE POLICY "Admins podem gerenciar dados da escola" ON public.escola FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Todos podem ver dados da escola" ON public.escola FOR SELECT USING (true);

-- Políticas para convites
CREATE POLICY "Admins podem gerenciar convites" ON public.convites FOR ALL USING (get_user_role() = 'admin');

-- Políticas para alunos
CREATE POLICY "Staff pode gerenciar alunos" ON public.alunos FOR ALL USING (get_user_role() IN ('admin', 'secretaria', 'coordenacao'));
CREATE POLICY "Professores podem ver alunos" ON public.alunos FOR SELECT USING (get_user_role() = 'professor');

-- Políticas para professores
CREATE POLICY "Staff pode gerenciar professores" ON public.professores FOR ALL USING (get_user_role() IN ('admin', 'secretaria', 'coordenacao'));
CREATE POLICY "Professores podem ver outros professores" ON public.professores FOR SELECT USING (get_user_role() = 'professor');

-- Políticas para disciplinas
CREATE POLICY "Staff pode gerenciar disciplinas" ON public.disciplinas FOR ALL USING (get_user_role() IN ('admin', 'secretaria', 'coordenacao'));
CREATE POLICY "Professores podem ver disciplinas" ON public.disciplinas FOR SELECT USING (get_user_role() = 'professor');

-- Políticas para turmas
CREATE POLICY "Staff pode gerenciar turmas" ON public.turmas FOR ALL USING (get_user_role() IN ('admin', 'secretaria', 'coordenacao'));
CREATE POLICY "Professores podem ver turmas" ON public.turmas FOR SELECT USING (get_user_role() = 'professor');

-- Políticas para turma_disciplinas
CREATE POLICY "Staff pode gerenciar turma_disciplinas" ON public.turma_disciplinas FOR ALL USING (get_user_role() IN ('admin', 'secretaria', 'coordenacao'));
CREATE POLICY "Professores podem ver turma_disciplinas" ON public.turma_disciplinas FOR SELECT USING (get_user_role() = 'professor');

-- Políticas para matrículas
CREATE POLICY "Staff pode gerenciar matrículas" ON public.matriculas FOR ALL USING (get_user_role() IN ('admin', 'secretaria', 'coordenacao'));
CREATE POLICY "Professores podem ver matrículas" ON public.matriculas FOR SELECT USING (get_user_role() = 'professor');

-- Políticas para aulas
CREATE POLICY "Staff pode gerenciar aulas" ON public.aulas FOR ALL USING (get_user_role() IN ('admin', 'secretaria', 'coordenacao'));
CREATE POLICY "Professores podem gerenciar próprias aulas" ON public.aulas FOR ALL USING (
    get_user_role() = 'professor' AND 
    professor_id IN (SELECT id FROM public.professores WHERE email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
);

-- Políticas para presença
CREATE POLICY "Staff pode gerenciar presença" ON public.presenca FOR ALL USING (get_user_role() IN ('admin', 'secretaria', 'coordenacao'));
CREATE POLICY "Professores podem gerenciar presença de suas aulas" ON public.presenca FOR ALL USING (
    get_user_role() = 'professor' AND 
    aula_id IN (
        SELECT id FROM public.aulas 
        WHERE professor_id IN (SELECT id FROM public.professores WHERE email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
    )
);

-- Políticas para notas
CREATE POLICY "Staff pode gerenciar notas" ON public.notas FOR ALL USING (get_user_role() IN ('admin', 'secretaria', 'coordenacao'));
CREATE POLICY "Professores podem gerenciar notas de suas disciplinas" ON public.notas FOR ALL USING (
    get_user_role() = 'professor' AND 
    professor_id IN (SELECT id FROM public.professores WHERE email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
);

-- Políticas para eventos
CREATE POLICY "Todos podem ver eventos" ON public.eventos FOR SELECT USING (true);
CREATE POLICY "Staff pode gerenciar eventos" ON public.eventos FOR ALL USING (get_user_role() IN ('admin', 'secretaria', 'coordenacao'));
CREATE POLICY "Professores podem criar eventos" ON public.eventos FOR INSERT WITH CHECK (get_user_role() = 'professor');

-- =====================================================
-- 9. DADOS INICIAIS (OPCIONAL)
-- =====================================================

-- Inserir disciplinas básicas
INSERT INTO public.disciplinas (nome, codigo, carga_horaria, descricao) VALUES
('Matemática', 'MAT001', 80, 'Disciplina de Matemática básica'),
('Português', 'POR001', 80, 'Disciplina de Língua Portuguesa'),
('História', 'HIS001', 60, 'Disciplina de História'),
('Geografia', 'GEO001', 60, 'Disciplina de Geografia'),
('Ciências', 'CIE001', 60, 'Disciplina de Ciências'),
('Educação Física', 'EDF001', 40, 'Disciplina de Educação Física'),
('Artes', 'ART001', 40, 'Disciplina de Artes'),
('Inglês', 'ING001', 40, 'Disciplina de Língua Inglesa')
ON CONFLICT (codigo) DO NOTHING;

-- =====================================================
-- 10. CORREÇÃO DE DADOS EXISTENTES (SE NECESSÁRIO)
-- =====================================================

-- Atualizar perfis existentes que podem ter dados incorretos
UPDATE public.profiles 
SET role = 'admin' 
WHERE id IN (
    SELECT id FROM public.profiles 
    ORDER BY created_at 
    LIMIT 1
) AND role != 'admin';

-- Garantir que todos os perfis tenham nome_completo
UPDATE public.profiles 
SET nome_completo = COALESCE(nome_completo, 'Usuário') 
WHERE nome_completo IS NULL OR nome_completo = '';

-- =====================================================
-- SCRIPT CONCLUÍDO
-- =====================================================
-- Este script configura completamente o banco de dados do ERP Educacional
-- Inclui: tabelas, índices, triggers, RLS, políticas e dados iniciais
-- Execute este script em um banco Supabase limpo para implementação completa
