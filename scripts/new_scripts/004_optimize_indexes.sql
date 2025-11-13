-- Criar índices para melhorar performance se não existirem

-- Índices para busca rápida por aluno
CREATE INDEX IF NOT EXISTS idx_alunos_nome ON alunos(nome_completo);
CREATE INDEX IF NOT EXISTS idx_alunos_cpf ON alunos(cpf);
CREATE INDEX IF NOT EXISTS idx_alunos_ativo ON alunos(ativo);

-- Índices para busca rápida por professor
CREATE INDEX IF NOT EXISTS idx_professores_nome ON professores(nome_completo);
CREATE INDEX IF NOT EXISTS idx_professores_cpf ON professores(cpf);
CREATE INDEX IF NOT EXISTS idx_professores_user_id ON professores(user_id);
CREATE INDEX IF NOT EXISTS idx_professores_ativo ON professores(ativo);

-- Índices para matrículas
CREATE INDEX IF NOT EXISTS idx_matriculas_aluno ON matriculas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_turma ON matriculas(turma_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_ano ON matriculas(ano_letivo);
CREATE INDEX IF NOT EXISTS idx_matriculas_status ON matriculas(status);

-- Índices para notas
CREATE INDEX IF NOT EXISTS idx_notas_matricula ON notas(matricula_id);
CREATE INDEX IF NOT EXISTS idx_notas_disciplina ON notas(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_notas_bimestre ON notas(bimestre);

-- Índices para presencas
CREATE INDEX IF NOT EXISTS idx_presencas_aula ON presencas(aula_id);
CREATE INDEX IF NOT EXISTS idx_presencas_aluno ON presencas(aluno_id);

-- Índices para aulas
CREATE INDEX IF NOT EXISTS idx_aulas_turma_disciplina ON aulas(turma_disciplina_id);
CREATE INDEX IF NOT EXISTS idx_aulas_data ON aulas(data_aula);

-- Índices para turmas
CREATE INDEX IF NOT EXISTS idx_turmas_ano ON turmas(ano_letivo);
CREATE INDEX IF NOT EXISTS idx_turmas_ativo ON turmas(ativo);
CREATE INDEX IF NOT EXISTS idx_turmas_professor ON turmas(professor_responsavel_id);

-- Índices para disciplinas
CREATE INDEX IF NOT EXISTS idx_disciplinas_codigo ON disciplinas(codigo);
CREATE INDEX IF NOT EXISTS idx_disciplinas_ativo ON disciplinas(ativo);

-- Índices para eventos
CREATE INDEX IF NOT EXISTS idx_eventos_data_inicio ON eventos(data_inicio);
CREATE INDEX IF NOT EXISTS idx_eventos_turma ON eventos(turma_id);
CREATE INDEX IF NOT EXISTS idx_eventos_professor ON eventos(professor_id);

-- Índices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_tipo_usuario ON profiles(tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
