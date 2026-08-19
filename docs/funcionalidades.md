# Educational ERP — Funcionalidades

Sistema de Gestao Escolar completo para o Centro Educacional Evolucao.

---

## Sumario

1. [Visao Geral](#1-visao-geral)
2. [Autenticacao & Usuarios](#2-autenticacao--usuarios)
3. [Alunos](#3-alunos)
4. [Professores](#4-professores)
5. [Turmas](#5-turmas)
6. [Disciplinas](#6-disciplinas)
7. [Matriculas](#7-matriculas)
8. [Diario de Classe](#8-diario-de-classe)
9. [Notas](#9-notas)
10. [Frequencia](#10-frequencia)
11. [Agenda Escolar](#11-agenda-escolar)
12. [Agenda do Aluno](#12-agenda-do-aluno)
13. [Portal do Responsavel](#13-portal-do-responsavel)
14. [Grade de Horarios](#14-grade-de-horarios)
15. [Relatorios](#15-relatorios)
16. [Ferramentas](#16-ferramentas)
17. [Configuracoes](#17-configuracoes)
18. [Dashboard](#18-dashboard)
19. [Seguranca](#19-seguranca)
20. [Banco de Dados](#20-banco-de-dados)

---

## 1. Visao Geral

### Projeto

**Nome:** Centro Educacional Evolucao — Sistema de Gestao Escolar

### Stack Tecnica

| Camada | Tecnologia |
| -------- | ------------ |
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Estilo | Tailwind CSS v4, Shadcn UI |
| Backend | Supabase (PostgreSQL, Auth, RLS, Storage) |
| Editor | TipTap (Rich Text Editor) |
| Calendario | react-big-calendar |
| Formularios | Server Actions + Client Components |
| PDF | jsPDF |
| Pacotes | pnpm |

### Arquitetura

- **App Router** com rotas de grupo `(authenticated)` para area restrita
- **Server Components** para pages com busca de dados no servidor
- **Client Components** para interatividade (forms, filtros, modais)
- **Server Actions** para mutations (CRUD)
- **API Routes** para endpoints externos (login responsavel, agenda)
- **Middleware** para autenticacao e seguranca

---

## 2. Autenticacao & Usuarios

### 2.1 Login (`/auth/login`)

**Modo duplo de login:**

| Modo | Credenciais | Mecanismo |
|------|-------------|-----------|
| Funcionario | Email + Senha | Supabase Auth `signInWithPassword` |
| Responsavel | Email + CPF do aluno | API custom `/api/auth/responsavel` |

**Funcionalidades:**

- Toggle entre modos Funcionario/Responsavel
- Formatacao automatica de CPF (XXX.XXX.XXX-XX)
- Mostrar/ocultar senha
- Link "Esqueci a senha"
- Mensagens de erro traduzidas para portugues
- Redirect: funcionario → `/dashboard`, responsavel → `/responsavel/dashboard`

### 2.2 Cadastro (`/auth/cadastro`)

**Campos:** Nome completo, email, telefone (com mascara), tipo de usuario, senha, confirmar senha

**Tipos de usuario disponiveis no cadastro:**

- Secretaria
- Professor
- Coordenacao
- Diretor

**Fluxo:**

1. `supabase.auth.signUp` com `emailRedirectTo`
2. Redirect para pagina de verificacao de email

### 2.3 Verificacao de Email (`/auth/verificar-email`)

Pagina estatica pos-cadastro com instrucoes para verificar caixa de entrada.

### 2.4 Primeiro Acesso (`/auth/primeiro-acesso`)

**Obrigatoriedade:** Ativado quando `profiles.primeira_senha = true`

**Funcionalidades:**

- Medidor de forca da senha (Fraca/Media/Boa/Forte) com barra visual
- Checklist de regras: 6+ caracteres, maiuscula, minuscula, numero, caractere especial
- Mostrar/ocultar senha (nova e confirmacao)
- Ao sucesso: atualiza senha, seta `primeira_senha = false`, faz signout, redirect para login

### 2.5 Recuperacao de Senha (`/auth/recuperar-senha`)

- Input de email
- Chama `supabase.auth.resetPasswordForEmail` com redirect para `/auth/callback`
- Exibe confirmacao apos envio

### 2.6 Redefinicao de Senha (`/auth/redefinir-senha`)

- Handler do callback OAuth
- Server action `getAuthCode()` le cookie `auth_code`
- Cria client Supabase com `detectSessionInUrl: false`
- Troca codigo por sessao, permite atualizacao de senha
- Mesmo medidor de forca do primeiro acesso

### 2.7 Callback de Auth (`/auth/callback`)

- Route handler que captura `code` query parameter
- Salva como cookie httpOnly `auth_code` (60s max age, secure em producao)
- Redirect para `/auth/redefinir-senha`

### 2.8 Logout (`/auth/logout`)

- Pagina de confirmacao server-side
- Server action `logoutAction`: `supabase.auth.signOut()`, revalida layout, redirect para login
- Componente `LogoutConfirmDialog` na sidebar

### 2.9 Papeis de Usuario

Definidos em `profiles.tipo_usuario`:

| Papeis | Nivel de Acesso |
| -------- | ----------------- |
| `admin` | Acesso total a tudo |
| `diretor` | Acesso total (igual ao admin na maioria) |
| `secretaria` | CRUD na maioria das coisas, sem config admin |
| `coordenacao` | Similar a secretaria, mais acesso a config |
| `professor` | Leitura pesada; limitado a turmas/disciplinas atribuidas |

**Detalhamento de permissoes por funcionalidade:**

| Funcionalidade | Admin | Diretor | Secretaria | Coordenacao | Professor |
| ---------------- | ------- | --------- | ------------ | ------------- | ----------- |
| Gerenciar Usuarios | SIM | SIM | SIM | SIM | NAO |
| Cadastrar Aluno | SIM | SIM | SIM | SIM | NAO |
| Editar Aluno | SIM | SIM | SIM | SIM | NAO |
| Excluir Aluno | SIM | SIM | NAO | NAO | NAO |
| Cadastrar Professor | SIM | SIM | NAO | NAO | NAO |
| Excluir Professor | SIM | SIM | NAO | NAO | NAO |
| Cadastrar Turma | SIM | SIM | SIM | SIM | NAO |
| Gerenciar Disciplinas Turma | SIM | SIM | SIM | SIM | NAO |
| Gerenciar Alunos Turma | SIM | SIM | SIM | SIM | NAO |
| Cadastrar Matricula | SIM | SIM | SIM | SIM | NAO |
| Transferir Matricula | SIM | SIM | SIM | SIM | NAO |
| Criar Eventos Agenda | SIM | SIM | SIM | SIM | NAO |
| Editar Eventos Agenda | SIM | SIM | SIM (proprios) | SIM (proprios) | NAO |
| Excluir Eventos Agenda | SIM | SIM | SIM (proprios) | SIM (proprios) | NAO |
| Lancar Notas | SIM | SIM | SIM | SIM | SIM (disciplinas atribuidas) |
| Registrar Frequencia | SIM | SIM | SIM | SIM | SIM (disciplinas atribuidas) |
| Acessar Diario | SIM | SIM | SIM | SIM | SIM (turmas atribuidas) |
| Ver Relatorios | SIM | SIM | SIM | SIM | SIM |
| Configuracoes | SIM | SIM | PARCIAL | PARCIAL | NAO |
| Importar/Exportar Dados | SIM | SIM | NAO | NAO | NAO |
| Dados da Escola | SIM | SIM | SIM | SIM | NAO |
| Campos Obrigatorios | SIM | NAO | SIM | SIM | NAO |
| Calendario Letivo | SIM | SIM | SIM | SIM | NAO |

### 2.10 Gerenciamento de Usuarios (`/usuarios`)

**Lista** com busca (nome/email), filtro por role, colunas ordenaveis, paginacao.

**Criar Usuario (`/usuarios/novo`):**

- Form: nome, email, telefone, selecao de role
- Cria usuario Supabase Auth com senha temporaria (UUID random 12 chars)
- Se role = "professor", tambem cria registro em `professores`
- Usa Supabase Admin client para operacoes elevadas

**Editar Usuario (`updateUser`):**

- Atualiza email (via RPC `admin_update_user_email`)
- Atualiza senha (via RPC `admin_update_user_password` com bcrypt)
- Atualiza profile (via RPC `admin_update_user_profile`)
- Ao mudar role para/de "professor": cria/reativa/desativa registro de professor

**Excluir Usuario (`deleteUser`):**

- Usa RPC `admin_delete_user`
- Impede auto-exclusao

**Sistema de Convites (`createInvite`):**

- Cria tokens em `user_invites` com validade de 7 dias
- `deleteInvite` para remocao

### 2.11 Perfil (`/perfil`)

- Visualizar/editar: nome, telefone (email read-only, role read-only)
- Professores so editam telefone (edicao de nome desabilitada)
- Secao de troca de senha: verificar senha atual, depois atualizar
- Toggle mostrar/ocultar senha

---

## 3. Alunos

### 3.1 Lista de Alunos (`/alunos`)

- Busca por nome, CPF, email, numero de matricula
- Filtro por status (ativo/inativo/todos)
- Tabela paginada com colunas: nome, matricula, CPF, email, data nascimento, status
- Acoes rapidas: visualizar, editar, excluir (admin/diretor)

### 3.2 Cadastro de Aluno (`/alunos/novo`)

**Formulario completo (`AlunoForm`) com 12 secoes:**

| Secao | Campos |
| ------- | -------- |
| Dados Basicos | Nome completo, data nascimento, sexo, naturalidade, CPF, RG |
| Certidao de Nascimento | Numero, livro, folha, data emissao, cartorio, UF |
| Endereco | Logradouro, numero, bairro, cidade, UF, CEP |
| Contato | Telefone, email |
| Filiao — Mae | Nome, celular, profissao |
| Filiao — Pai | Nome, celular, profissao |
| Responsavel | Nome, telefone, email, responsavel matricula |
| Responsavel Financeiro | Nome completo, CPF, identidade, orgao emissor, UF, estado civil, grau parentesco, data nascimento, endereco completo |
| Informacoes Medicas | Uso medicamento continuo (rich text), alergia medicamento, alergia alimento |
| Dados da Matricula | Nivel, periodo letivo, turno preferencial |
| Observacoes | Rich text editor |
| Status | Ativo/Inativo toggle |

**Funcionalidades do formulario:**

- Campos obrigatorios configuraveis via `/configuracoes/campos-obrigatorios`
- Mascaras de entrada para CPF, telefone, CEP
- Rich text editor (TipTap) para observacoes e informacoes medicas
- Validacao com Zod

### 3.3 Detalhe do Aluno (`/alunos/[id])

**Visualizacao read-only com cards:**

- Dados pessoais (com calculo de idade)
- Documentacao (certidao de nascimento)
- Endereco
- Contato
- Filiao (mae e pai com bordas coloridas)
- Responsavel
- Responsavel Financeiro (endereco e documentos completos)
- Informacoes Medicas (medicacoes, alergias com rich text)
- Dados da Matricula
- Observacoes (rich text renderizado)
- Badge de status
- Informacoes do sistema (datas de criacao/atualizacao)

**Acoes:** Exportar PDF, Ver Agenda, Editar

### 3.4 Edicao (`/alunos/[id]/editar`)

Mesmo formulario do cadastro, preenchido com dados existentes.

### 3.5 Exportacao PDF

- Componentes `ExportAlunoPDFButton` e `ExportAlunoPDFWrapper`
- Gera PDF com dados do aluno usando `lib/pdf-generator.ts`

---

## 4. Professores

### 4.1 Lista de Professores (`/professores`)

- Busca por nome, CPF, email, formacao
- Filtro por status (ativo/inativo/todos)
- Tabela paginada
- Badges: "Incompleto" (sem CPF), "Sem acesso" (sem user_id)
- Botao "Criar Acesso" para professores legados (admin/diretor)

### 4.2 Cadastro (`/professores/novo`)

**Formulario (`ProfessorForm`):**

- Nome completo, CPF, email, telefone, formacao, data admissao, observacoes
- Opcao para criar acesso ao sistema (checkbox)

**Fluxo de criacao de acesso (`createProfessorUser`):**

1. Verifica autenticacao e permissao (admin/diretor)
2. Gera senha temporaria aleatoria (12 caracteres)
3. Verifica se ja existe auth user com o mesmo email
4. Se existe sem profile: reutiliza (atualiza senha e metadata)
5. Se existe com profile: retorna erro
6. Se nao existe: cria com `supabaseAdmin.auth.admin.createUser()`
7. Retorna `{ success: true, userId, senhaTemporaria }`

### 4.3 Detalhe (`/professores/[id]`)

- Visualizacao read-only de todos os dados
- Badge de acesso ao sistema (verde) ou "Sem acesso" (vermelho)

### 4.4 Edicao (`/professores/[id]/editar`)

- Formulario preenchido
- Sincroniza alteracoes com profiles via `admin_update_user_profile`

### 4.5 Criacao de Acesso para Legados (`createProfessorAccess`)

- Recebe `professorId`
- Verifica que `user_id` e NULL
- Cria auth user ou reutiliza existente
- Atualiza `professores.user_id`
- Retorna senha completa (nao mascarada) para admin copiar

### 4.6 Exclusao (`deleteProfessor`)

- Admin/Diretor apenas
- Cascade delete: exclui `professores`, profile e auth user via `admin_delete_user`

---

## 5. Turmas

### 5.1 Lista de Turmas (`/turmas`)

- Busca por nome, serie
- Filtro por ano letivo, status
- Mostra contagem de alunos matriculados por turma
- Filtro por professor aplicado para role professor

### 5.2 Cadastro (`/turmas/nova`)

**Formulario (`TurmaForm`):**

- Nome, serie, ano letivo, turno (matutino/vespertino/noturno), capacidade maxima, professor responsavel

### 5.3 Detalhe (`/turmas/[id]`)

**Cards:**

- **Informacoes da Turma:** Nome, serie, ano, turno (badge colorido), capacidade maxima
- **Professor Responsavel:** Nome, email, telefone
- **Disciplinas:** Lista de disciplinas associadas com codigo, carga horaria, professor
- **Alunos Matriculados:** Primeiros 10 alunos, indicador "e mais..."
- **Sidebar:** Status, estatisticas (matriculados, capacidade, disciplinas), info do sistema

**Acoes:**

- `GerenciarDisciplinasTurma`: Adicionar/remover disciplinas e atribuir professores
- `GerenciarAlunosTurma`: Adicionar/remover alunos matriculados, barra de progresso de capacidade

### 5.4 Edicao (`/turmas/[id]/editar`)

Formulario preenchido.

---

## 6. Disciplinas

### 6.1 Lista de Disciplinas (`/disciplinas`)

- Busca por nome, codigo, descricao
- Filtro por status, ordenacao por nome/codigo/carga horaria/professor
- Mostra professor associado
- Filtro por professor aplicado para role professor

### 6.2 Cadastro (`/disciplinas/nova`)

**Formulario (`DisciplinaForm`):**

- Nome, codigo, descricao, carga horaria, professor ativo, status

### 6.3 Detalhe (`/disciplinas/[id]`)

Visualizacao read-only completa.

### 6.4 Edicao (`/disciplinas/[id]/editar`)

Formulario preenchido.

---

## 7. Matriculas

### 7.1 Lista de Matriculas (`/matriculas`)

- Busca por nome/CPF do aluno ou numero da matricula
- Filtro por status (ativa/inativa/cancelada/todos), ano, turma
- Mostra: numero matricula, nome aluno, CPF, nome turma, status, data

### 7.2 Cadastro (`/matriculas/nova`)

**Formulario (`MatriculaForm`):**

- Selecionar aluno, selecionar turma, numero da matricula (auto ou manual), status, ano, observacoes

### 7.3 Detalhe (`/matriculas/[id]`)

- Informacoes completas da matricula
- Acoes: Editar, Transferir, Excluir, Gerar Declaracao de Matricula (PDF)

### 7.4 Transferencia (`/matriculas/[id]/transferir`)

- `TransferirMatriculaForm`: selecionar turma destino, valida capacidade
- Apenas para matriculas ativas
- Restrito a admin/secretaria/diretor/coordenacao

### 7.5 Declaracao PDF

- `DeclaracaoMatriculaButton`: gera PDF da declaracao de matricula
- Usa `declaracao-matricula-pdf.ts` com dados da escola

### 7.6 Historico

- Componente `MatriculaHistorico` mostra historico de matriculas por aluno

---

## 8. Diario de Classe

### 8.1 Visao Geral (`/diario`)

- Lista todas as turmas com suas disciplinas
- Mostra turmas sem disciplinas configuradas (alerta)
- Filtro por professor: mostra apenas turmas/disciplinas atribuidas
- Link para criar nova aula

### 8.2 Detalhe do Diario (`/diario/[turmaId]/[disciplinaId]`)

**Duas abas:**

| Aba | Conteudo |
|-----|----------|
| Aulas e Frequencia | Lista de aulas com data, horario, conteudo |
| Notas e Periodos | Lancamento de notas por periodo |

### 8.3 Criar Aula (`/diario/[turmaId]/[disciplinaId]/nova-aula`)

- `NovaAulaFormV2`: data, hora inicio, hora fim, conteudo (rich text)
- Calculo automatico de duracao padrao a partir dos horarios da grade

### 8.4 Registro de Frequencia (`/diario/[turmaId]/[disciplinaId]/presencas/[aulaId]`)

- `RegistrarPresencaForm`: marca cada aluno como presente/ausente
- Salva via server action em `presencas/[aulaId]/actions.ts`

### 8.5 Lancamento de Notas (aba Notas)

- Componente `NotasTab`: entrada de notas por aluno
- `NotasPorPeriodo`: exibicao de notas por periodo
- `ConfigurarPeriodosModal`: configurar periodos (bimestres/trimestres)

---

## 9. Notas

### 9.1 Visao Geral (`/notas`)

- Lista todas as turmas ativas com disciplinas associadas
- Mostra total de alunos matriculados por turma
- Filtro por professor aplicado

### 9.2 Lancamento de Notas (`/notas/[turmaId]/[disciplinaId]`)

- `NotasTable`: entrada de notas por aluno
- Suporta: bimestre, tipo_avaliacao, nota, data_avaliacao, observacoes
- Notas existentes pre-carregadas

### 9.3 Notas Individuais do Aluno (`/notas/aluno/[alunoId]`)

- Visualizacao de notas do aluno em todas as disciplinas
- Notas por bimestre com medias
- Exportar boletim (boletim) PDF

---

## 10. Frequencia

### 10.1 Visao Geral (`/presenca`)

- Grid de cards turma-disciplina
- Cada card mostra nome turma, serie, ano, disciplina, professor
- Link para registrar frequencia

### 10.2 Registro (`/presenca/[turmaId]/[disciplinaId]`)

- Selecionar aula/data, marcar alunos presente/ausente

---

## 11. Agenda Escolar

### 11.1 Calendario (`/agenda`)

**Integracao com react-big-calendar (RBC):**

- Visualizacoes: mes, semana, dia
- Eventos arrastaveis (usuarios nao-professores)
- Eventos redimensionaveis
- Click para criar evento em slot vazio

**Tipos de evento:**

| Tipo | Cor | Descricao |
| ------ | ----- | ----------- |
| `aula` | Azul | Aulas regulares |
| `prova` | Roxo | Provas e avaliacoes |
| `reuniao` | Azul | Reunioes |
| `evento` | Ciano | Eventos escolares |
| `feriado` | Vermelho | Feriados |
| `aviso_pais` | Amarelo | Avisos aos pais |

**CRUD de Eventos:**

- Criar: titulo, descricao (rich text), datas inicio/fim, horarios, all-day toggle, tipo
- Editar: mesmos campos
- Excluir: com dialog de confirmacao
- Dialog de descartar alteracoes

**Tabela abaixo do calendario:**

- Busca, filtro por data, filtro por tipo, paginacao

**Permissoes:**

- Professores: somente leitura
- Admin/diretor: editar/excluir qualquer evento
- Secretaria/coordenacao: editar/excluir apenas eventos criados por eles

### 11.2 Novo Evento (`/agenda/novo-evento`)

Formulario standalone (tambem acessivel do calendario).

### 11.3 Editar Evento (`/agenda/[id]/editar`)

Edicao de evento existente.

### 11.4 Periodos Letivos

- CRUD de periodos academicos (bimestres/trimestres)
- Com ano, numero, nome, data inicio/fim, status ativo
- Destaque visual no calendario (fundo verde)

---

## 12. Agenda do Aluno

### 12.1 Lista de Alunos (`/agenda-aluno`)

- Lista todos os alunos matriculados com informacoes de turma
- Filtro por turma, busca por nome/CPF
- Filtro por professor aplicado
- Click no aluno para ver/gerenciar agenda individual

### 12.2 Detalhe do Aluno (`/agenda-aluno/[alunoId]`)

- Calendario interativo (`AgendaRbc`) com avisos do aluno
- Tabela de avisos com busca e filtros
- CRUD de avisos (criar, editar, excluir)

**Categorias de avisos:**

| Categoria | Cor |
| ----------- | ----- |
| `comportamento` | Laranja |
| `reuniao` | Azul |
| `aviso` | Amarelo |
| `ocorrencia` | Vermelho |
| `elogio` | Verde |
| `outro` | Cinza |

---

## 13. Portal do Responsavel

### 13.1 Autenticacao

**Sistema JWT customizado (separado do Supabase Auth):**

- Login com email + CPF do aluno
- Cookie JWT `responsavel-session` (8 horas, httpOnly, secure, sameSite=strict)
- Sistema de revogacao de tokens via RPC `revoke_token`
- Validacao de sessao via `get_ultima_revogacao` e `is_token_revoked`
- Rate limiting: 5 tentativas por minuto por IP
- Validacao de origem da requisicao

### 13.2 Layout (`/responsavel`)

- Layout minimalista com header, navegacao, botao logout
- Componente `ResponsavelNav` para navegacao
- Logout via `/api/auth/responsavel/logout`

### 13.3 Dashboard (`/responsavel/dashboard`)

- Card com dados do aluno (nome, turma, serie, turno, numero matricula)
- Links rapidos: Agenda do Aluno, Agenda Escolar, Notas e Desempenho
- Ultimos 5 avisos com badges de categoria e preview de rich text

### 13.4 Agenda do Aluno (`/responsavel/agenda`)

**Duas abas com Tabs:**

| Aba | Conteudo |
|-----|----------|
| Agenda do Aluno | Calendario com avisos do aluno, lista completa, modal de detalhe |
| Agenda Escolar | Calendario com eventos da escola, lista completa, modal de detalhe |

**Funcionalidades:**

- Componente `AgendaCalendar` (visualizacao mensal)
- Click no dia para ver eventos/avisos
- Modal de detalhes com rich text renderizado
- Badges coloridos por tipo/categoria
- Suporte a query param `?tab=escola` para abrir aba especifica

### 13.5 Notas e Desempenho (`/responsavel/notas`)

- Tabela com todas as disciplinas e notas por bimestre (1-4)
- Media por disciplina com badges coloridos
- Botao para exportar boletim PDF
- Usa RPCs: `get_aluno_basico`, `get_aluno_notas`, `get_escola`

### 13.6 Rotas da API

| Rota | Metodo | Descricao |
| ------ | -------- | ----------- |
| `/api/auth/responsavel` | POST | Login (valida email+CPF, cria sessao JWT) |
| `/api/auth/responsavel/logout` | POST | Logout (revoga token, deleta cookie) |
| `/api/responsavel/agenda` | GET | Busca avisos do aluno e eventos escolares |

---

## 14. Grade de Horarios

### 14.1 Grade (`/grade-horarios`)

**Grid interativo:**

- Colunas: dias da semana
- Linhas: horarios

**Funcionalidades:**

- Filtro por turma ou professor
- Para professores: carrega automaticamente, somente leitura
- Para staff: click na celula para criar slot, click em slot existente para editar
- `SlotModal`: selecionar disciplina, definir horario inicio/fim
- Duracao padrao configuravel (salva em localStorage)

**Componentes:**

- `SemProfessorList`: mostra disciplinas sem professor atribuido
- `ExportGradePDF`: exportacao para PDF

**CRUD via server actions:** `listarGrade`, `listarTurmaDisciplinas`, `listarTurmaDisciplinasPorProfessor`

---

## 15. Relatorios

### 15.1 Hub de Relatorios (`/relatorios`)

Grid de cards com links para todos os tipos de relatorio.

### 15.2 Relatorio de Alunos (`/relatorios/alunos`)

- Lista completa de alunos com dados pessoais e status de matricula
- Componente `AlunosRelatorioTable`
- Exportacao PDF, busca, filtros, paginacao

### 15.3 Relatorio de Professores (`/relatorios/professores`)

- Lista de professores com formacao e disciplinas

### 15.4 Relatorio de Matriculas (`/relatorios/matriculas`)

- Matriculas por periodo, turma e status

### 15.5 Relatorio de Frequencia (`/relatorios/frequencia`)

- Usa view `vw_frequencia_alunos`
- Mostra: aluno, turma, disciplina, total aulas, presencas, faltas, percentual

### 15.6 Relatorio de Notas (`/relatorios/notas`)

- Usa view `vw_notas_alunos`
- Mostra: aluno, turma, disciplina, bimestre, tipo nota, nota, data

### 15.7 Relatorio de Turmas (`/relatorios/turmas`)

- Informacoes da turma e detalhes das disciplinas

### 15.8 Alunos por Turma (`/relatorios/alunos-por-turma`)

- `AlunosPorTurmaView`: selecionar turma, ver todos os alunos matriculados
- Exportacao PDF (`alunos-por-turma-pdf.ts`)

---

## 16. Ferramentas

### 16.1 Migracao de Dados (`/ferramentas/export-import`)

**Restrito a Admin/Diretor**

**Componente `MigrationTool`:**

| Funcao | Descricao |
| -------- | ----------- |
| Exportar | Usuarios, Professores, Turmas, Alunos como JSON |
| Importar | Upload de arquivos JSON |
| Cards de entidade | Mostra contagens |
| Dialog de estrategia de conflito | skip, overwrite, merge |
| Dialog de importacao | Com progresso |

**Ordem de importacao obrigatoria:** usuarios → professores → turmas → alunos

**Server actions:** `import.ts` e `export.ts`

---

## 17. Configuracoes

### 17.1 Hub (`/configuracoes`)

Grid de cards com controle de acesso por role:

| Configuracao | Acesso |
| -------------- | -------- |
| Dados da Escola | Todos os papeis permitidos |
| Gerenciar Usuarios | Admin/Diretor |
| Campos Obrigatorios | Admin/Coordenacao/Secretaria |
| Links de Documentos | Admin/Coordenacao/Secretaria |
| Calendario Letivo | Admin/Coordenacao/Secretaria |
| Migracao de Dados | Admin/Diretor |

Mostra aviso "Acesso Limitado" para usuarios nao-admin.

### 17.2 Dados da Escola (`/escola`)

**Formulario:**

- Nome da escola, CNPJ
- Endereco: logradouro, numero, complemento, cidade, estado (27 UFs), CEP
- Contatos: telefone, telefone2, email, site
- Mascaras: CEP, CNPJ, telefone
- Server action `saveEscolaData`

### 17.3 Campos Obrigatorios (`/configuracoes/campos-obrigatorios`)

**Toggles para 30+ campos organizados por categoria:**

| Categoria | Campos |
| ----------- | -------- |
| Dados basicos | nome, data nascimento, sexo, naturalidade, CPF, RG |
| Certidao de nascimento | numero, livro, folha, data emissao, cartorio |
| Endereco | endereco, bairro, cidade, UF, CEP |
| Contatos | telefone, email |
| Pais | nome mae, celular mae, nome pai, celular pai |
| Responsavel | nome, telefone, email |
| Responsavel Financeiro | nome, CPF, telefone |
| Dados da Matricula | periodo letivo, nivel, turno |

- Salvo em `config_campos_obrigatorios`
- Aplicado dinamicamente no formulario de cadastro de aluno

### 17.4 Links de Documentos (`/configuracoes/links-documentos`)

- `LinksDocumentosManager`: CRUD de links que aparecem no dashboard

### 17.5 Calendario Letivo (`/configuracoes/calendario-letivo`)

**Tres secoes:**

| Secao | Descricao |
| ------- | ----------- |
| Periodos Letivos | CRUD de periodos academicos (bimestres/trimestres) |
| Ferias Escolares | CRUD de periodos de ferias (eventos tipo="ferias") |
| Feriados | CRUD de feriados (eventos tipo="feriado") |

Edicao para admin/diretor/coordenacao.

---

## 18. Dashboard

### 18.1 Dashboard Principal (`/dashboard`)

**Cards de Metricas (`StatsCards`):**

- Total de alunos
- Total de professores
- Total de turmas
- Total de matriculas

**Acoes Rapidas (ocultas para professores):**

- Novo Aluno
- Novo Professor
- Nova Turma
- Nova Matricula

**Outros componentes:**

- Links de Documentos
- Aniversariantes do mes
- Turmas com vagas disponiveis
- Alunos sem matricula
- Matriculas pendentes

---

## 19. Seguranca

### 19.1 Middleware (`middleware.ts`)

**Tres caminhos de autenticacao:**

| Rota | Comportamento |
| ------ | --------------- |
| `/api/auth/responsavel` e `/api/responsavel` | Pass-through (sem auth Supabase) |
| `/responsavel/*` | Verificacao JWT cookie via `verifyResponsavelToken` |
| Todas as outras | Supabase session via `updateSession` |

**Headers de seguranca:**

- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Content-Security-Policy: dinamico com origem Supabase

### 19.2 Rate Limiting (`lib/rate-limit.ts`)

- Aplicado ao login do responsavel (5 tentativas por minuto)

### 19.3 Validacao de Inputs (`lib/validate-params.ts`)

- `sanitizeSearchParam`: sanitizacao de parametros de busca
- `validatePageParam`: validacao de pagina
- `validateLimitParam`: validacao de limite
- `validateRequestOrigin`: validacao de origem da requisicao

### 19.4 Mensagens de Erro (`lib/error-messages.ts`)

- `translateError`: traduz erros do Supabase/tecnicos para portugues

---

## 20. Banco de Dados

### 20.1 Tabelas Principais

| Tabela | Descricao |
| -------- | ----------- |
| `profiles` | Perfis de usuarios (id, nome, email, telefone, tipo_usuario, primeira_senha) |
| `alunos` | Cadastro de alunos (40+ campos: dados pessoais, documentos, pais, responsavel, medicos) |
| `professores` | Cadastro de professores (id, user_id, nome, email, telefone, cpf, formacao) |
| `turmas` | Turmas (id, nome, serie, ano_letivo, turno, capacidade_maxima, professor_responsavel_id) |
| `disciplinas` | Disciplinas (id, nome, codigo, descricao, carga_horaria, professor_id) |
| `turma_disciplinas` | Associacao turma-disciplina-professor |
| `matriculas` | Matriculas (id, aluno_id, turma_id, numero_matricula, status, data_matricula) |
| `aulas` | Aulas (id, turma_disciplina_id, data_aula, hora_inicio, hora_fim, conteudo) |
| `presencas` | Frequencia (aula_id, matricula_id, presente) |
| `notas` | Notas (id, matricula_id, disciplina_id, bimestre, nota, tipo_avaliacao) |
| `eventos` | Eventos da agenda (titulo, descricao, datas, tipo_evento, local) |
| `periodos_letivos` | Periodos academicos (ano, numero, nome, datas, ativo) |
| `avisos_aluno` | Avisos especificos do aluno (aluno_id, titulo, descricao, tipo_aviso, data) |
| `escola` | Dados da escola (nome, endereco, cnpj, telefone, etc.) |
| `config_campos_obrigatorios` | Configuracao de campos obrigatorios |
| `links_documentos` | Links de documentos do dashboard |
| `user_invites` | Convites de usuarios (email, tipo, token, validade) |
| `grade_horarios` | Grade de horarios (turma_disciplina_id, dia_semana, horarios) |
| `professor_disciplinas` | Associacao professor-disciplina |
| `revoked_tokens` | Tokens revogados (para sessao do responsavel) |

### 20.2 Views

| View | Descricao |
|------|-----------|
| `vw_frequencia_alunos` | Percentuais de frequencia por aluno/turma/disciplina |
| `vw_notas_alunos` | Notas com dados joins (aluno, turma, disciplina) |

### 20.3 Funcoes RPC Principais

| Funcao | Descricao |
| -------- | ----------- |
| `admin_delete_user` | Exclui usuario com cascade (profile, auth) |
| `admin_update_user_email` | Atualiza email do auth user |
| `admin_update_user_password` | Atualiza senha com bcrypt |
| `admin_update_user_profile` | Atualiza dados do profile |
| `buscar_aluno_responsavel` | Busca aluno por email do responsavel |
| `get_aluno_basico` | Retorna dados basicos do aluno |
| `get_avisos_aluno` | Retorna avisos do aluno como JSONB |
| `get_matricula_ativa` | Retorna matricula ativa do aluno |
| `get_turma` | Retorna dados da turma |
| `get_aluno_notas` | Retorna notas do aluno por disciplina/bimestre |
| `get_escola` | Retorna dados da escola |
| `revoke_token` | Revoga token de sessao do responsavel |
| `is_token_revoked` | Verifica se token foi revogado |
| `get_ultima_revogacao` | Retorna data da ultima revogacao |
| `handle_new_user` | Trigger: cria profile automaticamente ao criar auth user |
| `create_professor_user` | Trigger: cria profile ao inserir professor |
| `generate_matricula` | Gera numero de matricula automatico |

### 20.4 Triggers

| Trigger | Evento | Funcao |
|---------|--------|--------|
| `on_auth_user_created` | INSERT em `auth.users` | `handle_new_user()` |
| `on_professor_created` | INSERT em `professores` | `create_professor_user()` |

---

## Modulos de Biblioteca

| Modulo | Descricao |
| -------- | ----------- |
| `lib/supabase/server.ts` | Client Supabase server-side |
| `lib/supabase/client.ts` | Client Supabase browser-side |
| `lib/supabase/admin.ts` | Client Supabase admin (service role) |
| `lib/supabase/middleware.ts` | Refresh de sessao no middleware |
| `lib/supabase/responsavel-client.ts` | Client Supabase para responsavel |
| `lib/responsavel-auth.ts` | Gerenciamento de sessao JWT do responsavel |
| `lib/professor-filter.ts` | Filtro de dados por role de professor |
| `lib/input-masks.ts` | Mascaras de CPF, telefone, CEP |
| `lib/formatters.ts` | Formatacao de datas/numeros |
| `lib/cache-helpers.ts` | Utilitarios de cache |
| `lib/rate-limit.ts` | Rate limiting |
| `lib/validate-params.ts` | Sanitizacao e validacao de inputs |
| `lib/schemas/aluno.ts` | Schema Zod para validacao de aluno |
| `lib/agenda/rbc-adapter.ts` | Adapter de eventos para react-big-calendar |
| `lib/migration/*` | Definicoes de tipos e schemas de importacao/exportacao |

## Geracao de PDFs

| Arquivo | Descricao |
| --------- | ----------- |
| `lib/pdf-generator.ts` | PDF geral do aluno |
| `lib/boletim-pdf-generator.ts` | Boletim escolar |
| `lib/notas-pdf-generator.ts` | PDF de notas |
| `lib/lista-presenca-pdf.ts` | Lista de presenca |
| `lib/alunos-por-turma-pdf.ts` | Alunos por turma |
| `lib/declaracao-matricula-pdf.ts` | Declaracao de matricula |

## Componentes Compartilhados

| Componente | Descricao |
| ------------ | ----------- |
| `app-sidebar.tsx` | Sidebar de navegacao principal |
| `app-layout.tsx` | Layout da area autenticada |
| `page-header.tsx` | Header de pagina padrao |
| `breadcrumb-nav.tsx` | Navegacao por breadcrumbs |
| `back-button.tsx` | Botao de voltar |
| `logout-confirm-dialog.tsx` | Modal de confirmacao de logout |
| `responsavel-nav.tsx` | Navegacao do portal do responsavel |
| `ui/*` | Biblioteca completa Shadcn UI |
| `ui/searchable-select.tsx` | Dropdown com busca |
| `ui/rich-text-editor.tsx` | Editor rich text (TipTap) |
| `ui/data-pagination.tsx` | Componente de paginacao |
| `ui/matricula-status-badge.tsx` | Badge de status de matricula |
| `ui/ativo-status-badge.tsx` | Badge de status ativo/inativo |
| `ui/loading-state.tsx` | Spinner de carregamento |
