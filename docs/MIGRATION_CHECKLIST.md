# Checklist de Migração - Supabase

Use este checklist para garantir que nenhuma etapa seja esquecida durante a migração.

## 📋 Pré-Migração

### Preparação

- [ ] Fazer backup completo do banco de dados atual
  - [ ] Exportar todas as tabelas em CSV
  - [ ] Exportar schema SQL completo
  - [ ] Exportar dados de autenticação (se possível)
  
- [ ] Documentar configurações atuais
  - [ ] URLs de callback configuradas
  - [ ] Providers de autenticação ativos
  - [ ] Integrações de terceiros
  - [ ] Webhooks configurados

- [ ] Notificar stakeholders sobre a migração
  - [ ] Definir janela de manutenção
  - [ ] Comunicar tempo de indisponibilidade (se houver)

---

## 🆕 Nova Conta Supabase

### Criação da Conta

- [ ] Criar conta no Supabase
  - Método escolhido: [ ] GitHub [ ] Google [ ] Email
  
- [ ] Verificar email (se aplicável)

### Criação do Projeto

- [ ] Criar organization (se necessário)
  - Nome da organization: ________________
  
- [ ] Criar novo projeto
  - Nome do projeto: ________________
  - Região selecionada: ________________
  - Plano escolhido: [ ] Free [ ] Pro
  - Senha do database definida: [ ] Sim
  - Senha salva em local seguro: [ ] Sim

- [ ] Aguardar conclusão da criação (~2-3 min)

---

## 🗄️ Configuração do Banco de Dados

### Execução dos Scripts

Execute os scripts na ordem correta:

- [ ] **001_utility_functions.sql**
  - Data/Hora da execução: ________________
  - Status: [ ] Sucesso [ ] Erro
  - Notas: ________________________________

- [ ] **002_seed_disciplinas.sql**
  - Data/Hora da execução: ________________
  - Status: [ ] Sucesso [ ] Erro
  - Notas: ________________________________

- [ ] **003_add_missing_triggers.sql**
  - Data/Hora da execução: ________________
  - Status: [ ] Sucesso [ ] Erro
  - Notas: ________________________________

- [ ] **004_optimize_indexes.sql**
  - Data/Hora da execução: ________________
  - Status: [ ] Sucesso [ ] Erro
  - Notas: ________________________________

- [ ] **005_add_constraints.sql**
  - Data/Hora da execução: ________________
  - Status: [ ] Sucesso [ ] Erro
  - Notas: ________________________________

- [ ] **006_create_views.sql**
  - Data/Hora da execução: ________________
  - Status: [ ] Sucesso [ ] Erro
  - Notas: ________________________________

### Verificação do Schema

- [ ] Verificar que todas as tabelas foram criadas
  - [ ] profiles
  - [ ] escola
  - [ ] alunos
  - [ ] responsaveis
  - [ ] aluno_responsavel
  - [ ] turmas
  - [ ] disciplinas
  - [ ] professores
  - [ ] professor_disciplina
  - [ ] matriculas
  - [ ] notas
  - [ ] frequencias
  - [ ] eventos
  - [ ] comunicados
  - [ ] financeiro
  - [ ] user_invites

- [ ] Verificar que RLS está ativo em todas as tabelas

- [ ] Verificar policies criadas em cada tabela

- [ ] Verificar functions criadas
  - [ ] update_updated_at_column()
  - [ ] handle_new_user()

- [ ] Verificar triggers criados

- [ ] Verificar indexes criados

---

## 🔐 Configuração de Autenticação

### Email Provider

- [ ] Ativar Email provider
- [ ] Configurar "Confirm email": [ ] Ativado [ ] Desativado
- [ ] Configurar "Secure email change": [ ] Ativado [ ] Desativado

### Email Templates

- [ ] Personalizar template "Confirm signup" (opcional)
- [ ] Personalizar template "Magic Link" (opcional)
- [ ] Personalizar template "Change Email Address" (opcional)
- [ ] Personalizar template "Reset Password" (opcional)

### URLs de Redirecionamento

- [ ] Configurar Site URL: ________________
- [ ] Adicionar Redirect URLs:
  - [ ] `https://seu-dominio.vercel.app/**`
  - [ ] `https://seu-dominio.vercel.app/auth/callback`
  - [ ] `http://localhost:3000/**`
  - [ ] Outras: ________________________________

### Outros Providers (se aplicável)

- [ ] Configurar Google OAuth
- [ ] Configurar GitHub OAuth
- [ ] Configurar outros providers

---

## 🔑 Coleta de Credenciais

### Variáveis Supabase

- [ ] Copiar Project URL
  - Valor: ________________
  
- [ ] Copiar anon public key
  - Valor copiado: [ ] Sim
  
- [ ] Copiar service_role secret key
  - Valor copiado: [ ] Sim
  - ⚠️ Armazenado com segurança: [ ] Sim
  
- [ ] Copiar JWT Secret
  - Valor copiado: [ ] Sim

### Variáveis PostgreSQL

- [ ] Copiar POSTGRES_URL (Transaction pooling)
- [ ] Copiar POSTGRES_PRISMA_URL (Session pooling)
- [ ] Copiar POSTGRES_URL_NON_POOLING (Direct connection)
- [ ] Anotar POSTGRES_USER: ________________
- [ ] Anotar POSTGRES_HOST: ________________
- [ ] Anotar POSTGRES_PASSWORD: ________________
- [ ] Anotar POSTGRES_DATABASE: ________________

### Organização

- [ ] Criar arquivo temporário com todas as variáveis
- [ ] Validar formato de todas as URLs e keys
- [ ] Verificar que nenhuma variável está vazia

---

## ⚙️ Configuração no Ambiente de Deploy

### Opção v0

- [ ] Acessar aba "Connect" no v0
- [ ] Remover integração Supabase antiga (se houver)
- [ ] Adicionar nova integração Supabase
- [ ] Autorizar e selecionar novo projeto
- [ ] Verificar que integração está conectada

### Opção Vercel

- [ ] Acessar projeto no Vercel Dashboard
- [ ] Ir em Settings → Environment Variables
- [ ] Adicionar/Atualizar todas as variáveis:
  - [ ] SUPABASE_URL
  - [ ] NEXT_PUBLIC_SUPABASE_URL
  - [ ] SUPABASE_ANON_KEY
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
  - [ ] SUPABASE_SERVICE_ROLE_KEY
  - [ ] SUPABASE_JWT_SECRET
  - [ ] POSTGRES_URL
  - [ ] POSTGRES_PRISMA_URL
  - [ ] POSTGRES_URL_NON_POOLING
  - [ ] POSTGRES_USER
  - [ ] POSTGRES_HOST
  - [ ] POSTGRES_PASSWORD
  - [ ] POSTGRES_DATABASE
  
- [ ] Selecionar ambientes: Production, Preview, Development
- [ ] Salvar alterações

### Novo Deploy

- [ ] Fazer novo deploy / redeploy
- [ ] Aguardar conclusão do build
- [ ] Verificar logs de build para erros

---

## 📊 Migração de Dados

### Exportação (Banco Antigo)

- [ ] Exportar tabela: escola
- [ ] Exportar tabela: profiles
- [ ] Exportar tabela: disciplinas (ou usar seed)
- [ ] Exportar tabela: turmas
- [ ] Exportar tabela: alunos
- [ ] Exportar tabela: responsaveis
- [ ] Exportar tabela: aluno_responsavel
- [ ] Exportar tabela: professores
- [ ] Exportar tabela: professor_disciplina
- [ ] Exportar tabela: matriculas
- [ ] Exportar tabela: notas
- [ ] Exportar tabela: frequencias
- [ ] Exportar tabela: eventos
- [ ] Exportar tabela: comunicados
- [ ] Exportar tabela: financeiro
- [ ] Exportar tabela: user_invites

### Limpeza dos CSVs

- [ ] Remover colunas `id` auto-geradas
- [ ] Remover colunas `created_at` e `updated_at`
- [ ] Validar formato de datas (ISO 8601)
- [ ] Validar formato de UUIDs
- [ ] Validar valores de enums

### Importação (Banco Novo)

Importar na ordem correta:

1. [ ] escola
2. [ ] profiles
3. [ ] disciplinas (ou pular se usou seed)
4. [ ] turmas
5. [ ] alunos
6. [ ] responsaveis
7. [ ] aluno_responsavel
8. [ ] professores
9. [ ] professor_disciplina
10. [ ] matriculas
11. [ ] notas
12. [ ] frequencias
13. [ ] eventos
14. [ ] comunicados
15. [ ] financeiro
16. [ ] user_invites

### Validação de Dados

- [ ] Executar queries de contagem
- [ ] Verificar integridade referencial
- [ ] Verificar dados órfãos
- [ ] Comparar totais com banco antigo

---

## 🧪 Testes

### Autenticação

- [ ] Criar novo usuário de teste
  - Email: ________________
  - Status: [ ] Sucesso [ ] Erro
  
- [ ] Verificar registro na tabela auth.users
- [ ] Verificar criação automática de profile
- [ ] Testar login com usuário criado
- [ ] Testar logout
- [ ] Testar recuperação de senha

### Funcionalidades (CRUD)

- [ ] **Alunos**
  - [ ] Criar aluno
  - [ ] Listar alunos
  - [ ] Editar aluno
  - [ ] Excluir aluno
  
- [ ] **Turmas**
  - [ ] Criar turma
  - [ ] Listar turmas
  - [ ] Editar turma
  - [ ] Excluir turma
  
- [ ] **Professores**
  - [ ] Criar professor
  - [ ] Listar professores
  - [ ] Editar professor
  - [ ] Excluir professor
  
- [ ] **Disciplinas**
  - [ ] Listar disciplinas
  - [ ] Associar professor a disciplina
  
- [ ] **Matrículas**
  - [ ] Criar matrícula
  - [ ] Listar matrículas
  - [ ] Atualizar status de matrícula
  
- [ ] **Notas**
  - [ ] Lançar nota
  - [ ] Visualizar notas
  - [ ] Editar nota
  - [ ] Calcular médias
  
- [ ] **Frequência**
  - [ ] Registrar presença
  - [ ] Registrar falta
  - [ ] Visualizar relatório de frequência
  
- [ ] **Comunicados**
  - [ ] Criar comunicado
  - [ ] Visualizar comunicados
  - [ ] Editar comunicado
  - [ ] Excluir comunicado
  
- [ ] **Financeiro**
  - [ ] Criar cobrança
  - [ ] Listar cobranças
  - [ ] Atualizar status de pagamento
  - [ ] Visualizar relatórios

### Permissões (RLS)

- [ ] Testar acesso como Administrador
- [ ] Testar acesso como Professor
- [ ] Testar acesso como Aluno/Responsável
- [ ] Verificar que usuários não veem dados de outros
- [ ] Verificar que RLS está bloqueando acessos não autorizados

### Performance

- [ ] Testar tempo de carregamento de páginas
- [ ] Verificar queries lentas nos logs
- [ ] Testar listagens com muitos registros
- [ ] Verificar uso de índices

---

## 🔍 Verificação Final

### Supabase Dashboard

- [ ] Verificar métricas de uso (API requests)
- [ ] Verificar logs de erros
- [ ] Verificar logs de autenticação
- [ ] Verificar logs do PostgreSQL

### Aplicação

- [ ] Testar em diferentes navegadores
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge
  
- [ ] Testar em dispositivos móveis
  - [ ] iOS
  - [ ] Android
  
- [ ] Verificar responsividade
- [ ] Testar fluxos completos de usuário

### Documentação

- [ ] Atualizar README com novas instruções
- [ ] Atualizar .env.example
- [ ] Documentar mudanças para equipe
- [ ] Atualizar diagramas (se houver)

---

## 📢 Pós-Migração

### Comunicação

- [ ] Notificar equipe sobre conclusão da migração
- [ ] Enviar credenciais para administradores (via canal seguro)
- [ ] Atualizar documentação de onboarding

### Monitoramento

- [ ] Configurar alertas no Supabase
- [ ] Monitorar logs nas primeiras 24h
- [ ] Monitorar métricas de uso
- [ ] Coletar feedback de usuários

### Backup do Sistema Antigo

- [ ] Manter banco antigo ativo por período de transição
  - Período: ________ dias
  
- [ ] Agendar desativação do projeto antigo
  - Data prevista: ________________
  
- [ ] Fazer backup final antes de desativar
- [ ] Arquivar backups em local seguro

### Otimizações

- [ ] Revisar e otimizar queries lentas
- [ ] Configurar cache (se aplicável)
- [ ] Configurar CDN para assets estáticos
- [ ] Implementar rate limiting (se necessário)

---

## ✅ Conclusão

- [ ] Migração completada com sucesso
- [ ] Todos os testes passaram
- [ ] Documentação atualizada
- [ ] Equipe treinada
- [ ] Sistema monitorado

**Data de conclusão**: ________________  
**Responsável**: ________________  
**Notas finais**: ________________________________

---

**Versão**: 1.0.0  
**Última atualização**: 2025-01-13
