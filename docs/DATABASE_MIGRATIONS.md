# Migrations SQL - Status e Referência

## Scripts Executados com Sucesso

### 1. ✅ 025_add_notas_constraints.sql
**Status**: EXECUTADO COM SUCESSO

\`\`\`sql
ALTER TABLE notas
ADD CONSTRAINT notas_unique_matricula_disciplina_bimestre
UNIQUE (matricula_id, disciplina_id, bimestre);

CREATE INDEX IF NOT EXISTS idx_notas_matricula_disciplina ON notas(matricula_id, disciplina_id);
\`\`\`

**Objetivo**: Garantir que não existam duplicatas de notas e otimizar queries por aluno/disciplina

**Data de Execução**: 2024-04-22  
**Banco de Dados**: Supabase PostgreSQL

---

### 2. ✅ 026_improve_rls_policies.sql
**Status**: EXECUTADO COM SUCESSO

\`\`\`sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas ENABLE ROW LEVEL SECURITY;

-- Policies implementadas para type_usuario
\`\`\`

**Objetivo**: Melhorar segurança com RLS baseado em `tipo_usuario`

**Data de Execução**: 2024-04-22  
**Banco de Dados**: Supabase PostgreSQL

---

### 3. ✅ 027_add_performance_indexes.sql
**Status**: EXECUTADO COM SUCESSO

13 índices criados:
- `idx_alunos_nome_completo` - Busca por nome
- `idx_alunos_cpf` - Validação de CPF
- `idx_alunos_email` - Login de alunos
- `idx_alunos_email_responsavel` - Login de responsáveis
- `idx_professores_cpf` - Busca de professor
- `idx_professores_email` - Login de professor
- `idx_matriculas_status_ativa` - Matrículas ativas
- `idx_notas_bimestre` - Notas por período
- `idx_notas_aluno_periodo` - Composite para notas
- `idx_turmas_ativo` - Turmas ativas
- `idx_disciplinas_ativo` - Disciplinas ativas

**Objetivo**: Otimizar performance de queries comuns

**Data de Execução**: 2024-04-22  
**Banco de Dados**: Supabase PostgreSQL

---

## Como Reverter Mudanças (se necessário)

### Reverter Constraint de Notas
\`\`\`sql
ALTER TABLE notas DROP CONSTRAINT notas_unique_matricula_disciplina_bimestre;
DROP INDEX IF EXISTS idx_notas_matricula_disciplina;
\`\`\`

### Reverter RLS Policies
\`\`\`sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE alunos DISABLE ROW LEVEL SECURITY;
ALTER TABLE notas DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own profile" ON profiles;
DROP POLICY IF EXISTS "Read notas based on role" ON notas;
\`\`\`

### Remover Índices
\`\`\`sql
DROP INDEX IF EXISTS idx_alunos_nome_completo;
DROP INDEX IF EXISTS idx_alunos_cpf;
DROP INDEX IF EXISTS idx_alunos_email;
-- ... e assim por diante
\`\`\`

---

## Próximas Migrations Recomendadas

### Fase 2: Soft Deletes
\`\`\`sql
-- Adicionar campo deleted_at em tabelas principais
ALTER TABLE alunos ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE professores ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE notas ADD COLUMN deleted_at TIMESTAMP NULL;

-- Views para filtrar registros deletados
CREATE VIEW alunos_ativos AS
SELECT * FROM alunos WHERE deleted_at IS NULL;
\`\`\`

### Fase 3: Auditoria
\`\`\`sql
-- Tabela de auditoria
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela TEXT NOT NULL,
  operacao TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  usuario_id UUID NOT NULL,
  dados_anteriores JSONB,
  dados_novos JSONB,
  timestamp TIMESTAMP DEFAULT now()
);
\`\`\`

### Fase 4: Normalização
\`\`\`sql
-- Separar endereços em tabela própria
CREATE TABLE enderecos (
  id UUID PRIMARY KEY,
  cep VARCHAR(8),
  logradouro TEXT,
  numero VARCHAR(10),
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado VARCHAR(2),
  created_at TIMESTAMP DEFAULT now()
);

-- Referenciar de alunos e responsáveis
ALTER TABLE alunos ADD COLUMN endereco_id UUID REFERENCES enderecos(id);
\`\`\`

---

## Checklist de Validação

Após executar os scripts, validar:

- [ ] Constraint UNIQUE em notas funcionando (tentar inserir duplicate gera erro)
- [ ] Índices criados (verificar em Supabase > SQL Editor > Indexes)
- [ ] RLS policies habilitadas (SELECT em tabelas restritas funciona conforme perfil)
- [ ] Performance melhorada (verificar query times antes/depois)

---

## Monitoramento Contínuo

### No Supabase Dashboard

1. **SQL Editor > Performance**
   - Verificar queries lentas regularmente
   - Adicionar índices conforme necessário

2. **Database > Extensions**
   - Verificar pg_stat_statements ativada

3. **Settings > Database**
   - Monitorar conexões ativas
   - Verificar query logs

### Queries Úteis

\`\`\`sql
-- Ver índices não utilizados
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY tablename, indexname;

-- Ver tamanho de índices
SELECT schemaname, tablename, indexname, 
       pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_indexes i
JOIN pg_class c ON c.relname = indexname
ORDER BY pg_relation_size(indexrelid) DESC;

-- Ver queries mais lentas (se pg_stat_statements ativo)
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
\`\`\`

---

## Documentação Referente

- [QUERY_OPTIMIZATION.md](./QUERY_OPTIMIZATION.md) - Boas práticas de queries
- [OPTIMIZATIONS_APPLIED.md](./OPTIMIZATIONS_APPLIED.md) - Resumo de otimizações
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - Como usar os novos helpers
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Resumo completo

---

**Última atualização**: 2024-04-22  
**Próxima revisão**: 2024-05-22
