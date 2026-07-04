# Verificação de Campos - Remoção de `select("*")`

## Paginas de Listagem (Tabelas)

| Pagina | Antes | Depois |
|--------|-------|--------|
| `/alunos` | `alunos.*` | `id, nome_completo, matricula, data_nascimento, cpf, email, ativo, nome_responsavel, created_at` |
| `/professores` | `professores.*` | colunas da tabela |
| `/turmas` | `turmas.*` | `id, nome, serie, ano_letivo, turno, capacidade_maxima, ativo, created_at` |
| `/matriculas` | `matriculas.*` | `id, numero_matricula, status, data_matricula, ano_letivo, created_at` |
| `/agenda` | `eventos.*` | `id, titulo, descricao, data_inicio, data_fim, hora_inicio, hora_fim, tipo_evento, local` |
| `/presenca` | `turma_disciplinas.*` | `turma_id, disciplina_id, professor_id` |
| `/diario` | `turma_disciplinas.*` | `turma_id, disciplina_id, professor_id` |
| `/diario/nova-aula` | `turma_disciplinas.*` | `id, turma_id, disciplina_id, professor_id` |

## Paginas de Detalhe

| Pagina | Antes | Depois |
|--------|-------|--------|
| `/alunos/[id]` | `alunos.*` | colunas explicitas da pagina + PDF |
| `/professores/[id]` | `professores.*` | `id, nome_completo, email, cpf, rg, data_nascimento, endereco, telefone, formacao, especializacao, registro_profissional, data_admissao, salario, ativo` |
| `/disciplinas/[id]` | `disciplinas.*` | `id, nome, codigo, descricao, carga_horaria, ativo` |
| `/matriculas/[id]` | `matriculas.*` + `alunos!fk(*)` + `turmas!fk(*)` | colunas especificas |
| `/diario/[turmaId]/[disciplinaId]` | `aulas.*` | `id, data_aula, hora_inicio, hora_fim, conteudo` |
| `/diario/[turmaId]/[disciplinaId]` | `periodos_letivos.*` | `id, numero_periodo, nome, data_inicio, data_fim` |
| `/presenca/[turmaId]/[disciplinaId]` | `turma_disciplinas.*` | `id, professor_id` |
| `/notas/[turmaId]/[disciplinaId]` | `turmas.*` | `id, nome, serie, ano_letivo` |
| `/notas/[turmaId]/[disciplinaId]` | `disciplinas.*` | `id, nome` |
| `/notas/[turmaId]/[disciplinaId]` | `vw_notas_alunos.*` | colunas do grid |

## Paginas de Edicao / Formulario

| Pagina | Antes | Depois |
|--------|-------|--------|
| `/alunos/[id]/editar` | `alunos.*` | colunas do AlunoForm |
| `/professores/[id]/editar` | `professores.*` | colunas do ProfessorForm |
| `/disciplinas/[id]/editar` | `disciplinas.*` | `id, nome, codigo, descricao, carga_horaria, ativo, professor_id` |
| `/turmas/[id]/editar` | `turmas.*` | `id, nome, ano_letivo, serie, turno, capacidade_maxima, professor_responsavel_id, ativo` |
| `/matriculas/[id]/editar` | `matriculas.*` | `id, numero_matricula, aluno_id, turma_id, ano_letivo, data_matricula, status, observacoes` |
| `/agenda/[id]/editar` | `eventos.*` | `titulo, descricao, data_inicio, data_fim, hora_inicio, hora_fim, created_by` |
| `/escola` | `escola.*` | colunas do formulario |
| `/aulas/[aulaId]/editar` | `aulas.*` | `id, data_aula, hora_inicio, hora_fim, conteudo, observacoes` |

## Relatorios

| Pagina | Antes | Depois |
|--------|-------|--------|
| `/relatorios/turmas` | view.* | `id, nome, serie, turno, ano_letivo, capacidade_maxima, ativo` |
| `/relatorios/frequencia` | view.* | `aluno_nome, turma_nome, disciplina_nome, total_aulas, presencas, faltas, percentual_presenca` |
| `/relatorios/notas` | view.* | `aluno_nome, turma_nome, disciplina_codigo, disciplina_nome, bimestre, tipo_avaliacao, nota, data_avaliacao` |
| `/relatorios/professores` | view.* | `id, nome_completo, email, telefone, formacao, ativo` + `professor_id, disciplina_nome` |
| `/relatorios/matriculas` | view.* | `matricula_id, nome_completo, numero_matricula, turma_nome, serie, turno, ano_letivo, status_matricula` |

## Configuracoes e Outros

| Arquivo | Antes | Depois |
|---------|-------|--------|
| `/configuracoes/calendario-letivo` | `eventos.*` (x4) + `periodos_letivos.*` (x2) | colunas especificas |
| `/agenda-aluno/[alunoId]` | `alunos.*` + `avisos_aluno.*` | colunas especificas |
| `components/diario/notas-por-periodo.tsx` | `notas.*` | `matricula_id, nota` |
| `components/configuracoes/links-documentos-manager.tsx` | `links_documentos.*` | colunas do manager |
| `components/dashboard/links-documentos-card.tsx` | `links_documentos.*` | colunas do card |
| `app/presenca/actions.ts` | `.select()` | `.select("id")` |
