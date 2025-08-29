-- Criação do schema completo do ERP Educacional

-- Tabela de perfis de usuário (referencia auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  tipo_usuario TEXT NOT NULL CHECK (tipo_usuario IN ('secretaria', 'professor', 'coordenacao', 'diretor')),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de alunos
CREATE TABLE IF NOT EXISTS public.alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  nome_completo TEXT NOT NULL,
  cpf TEXT UNIQUE,
  rg TEXT,
  data_nascimento DATE,
  endereco TEXT,
  telefone TEXT,
  email TEXT NOT NULL,
  formacao TEXT,
  especializacao TEXT,
  registro_profissional TEXT,
  data_admissao DATE,
  salario DECIMAL(10,2),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de disciplinas
CREATE TABLE IF NOT EXISTS public.disciplinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  codigo TEXT UNIQUE NOT NULL,
  descricao TEXT,
  carga_horaria INTEGER,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de turmas
CREATE TABLE IF NOT EXISTS public.turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ano_letivo INTEGER NOT NULL,
  serie TEXT NOT NULL,
  turno TEXT CHECK (turno IN ('matutino', 'vespertino', 'noturno')),
  capacidade_maxima INTEGER,
  professor_responsavel_id UUID REFERENCES public.professores(id),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de matrículas
CREATE TABLE IF NOT EXISTS public.matriculas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_matricula TEXT UNIQUE NOT NULL,
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
  turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE,
  ano_letivo INTEGER NOT NULL,
  data_matricula DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'ativa' CHECK (status IN ('ativa', 'transferida', 'cancelada', 'concluida')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de disciplinas por turma
CREATE TABLE IF NOT EXISTS public.turma_disciplinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE,
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE CASCADE,
  professor_id UUID REFERENCES public.professores(id),
  carga_horaria_semanal INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(turma_id, disciplina_id)
);

-- Tabela de aulas
CREATE TABLE IF NOT EXISTS public.aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_disciplina_id UUID REFERENCES public.turma_disciplinas(id) ON DELETE CASCADE,
  data_aula DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  conteudo TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de presença
CREATE TABLE IF NOT EXISTS public.presencas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id UUID REFERENCES public.aulas(id) ON DELETE CASCADE,
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
  presente BOOLEAN DEFAULT false,
  justificativa TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(aula_id, aluno_id)
);

-- Tabela de notas
CREATE TABLE IF NOT EXISTS public.notas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id UUID REFERENCES public.matriculas(id) ON DELETE CASCADE,
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE CASCADE,
  bimestre INTEGER CHECK (bimestre IN (1, 2, 3, 4)),
  nota DECIMAL(4,2),
  tipo_avaliacao TEXT,
  data_avaliacao DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de eventos da agenda escolar
CREATE TABLE IF NOT EXISTS public.eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  hora_inicio TIME,
  hora_fim TIME,
  tipo_evento TEXT CHECK (tipo_evento IN ('aula', 'prova', 'reuniao', 'evento', 'feriado')),
  turma_id UUID REFERENCES public.turmas(id),
  professor_id UUID REFERENCES public.professores(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de documentos
CREATE TABLE IF NOT EXISTS public.documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  url TEXT,
  aluno_id UUID REFERENCES public.alunos(id),
  professor_id UUID REFERENCES public.professores(id),
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turma_disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
