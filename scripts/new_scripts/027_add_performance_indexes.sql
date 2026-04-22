-- Índices adicionais para otimizar queries comuns

-- Índice para buscar alunos por nome (usado em search/filter)
CREATE INDEX IF NOT EXISTS idx_alunos_nome_completo ON alunos(nome_completo);

-- Índice para buscar alunos por CPF (único e frequentemente buscado)
CREATE INDEX IF NOT EXISTS idx_alunos_cpf ON alunos(cpf);

-- Índice para buscar alunos por email
CREATE INDEX IF NOT EXISTS idx_alunos_email ON alunos(email);

-- Índice para buscar alunos por email_responsavel
CREATE INDEX IF NOT EXISTS idx_alunos_email_responsavel ON alunos(email_responsavel);

-- Índice para buscar professores por CPF
CREATE INDEX IF NOT EXISTS idx_professores_cpf ON professores(cpf);

-- Índice para buscar profesores por email
CREATE INDEX IF NOT EXISTS idx_professores_email ON professores(email);

-- Índice para buscar matriculas ativas
CREATE INDEX IF NOT EXISTS idx_matriculas_status_ativa ON matriculas(status) WHERE status = 'ativa';

-- Índice para buscar notas por bimestre
CREATE INDEX IF NOT EXISTS idx_notas_bimestre ON notas(bimestre);

-- Índice composto para buscar notas de um aluno em um período
CREATE INDEX IF NOT EXISTS idx_notas_aluno_periodo ON notas(matricula_id, bimestre);

-- Índice para buscar turmas ativas
CREATE INDEX IF NOT EXISTS idx_turmas_ativo ON turmas(ativo) WHERE ativo = true;

-- Índice para buscar disciplinas ativas
CREATE INDEX IF NOT EXISTS idx_disciplinas_ativo ON disciplinas(ativo) WHERE ativo = true;
