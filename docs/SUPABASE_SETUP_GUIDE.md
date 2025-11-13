# Guia Completo de Configuração do Supabase

Este guia detalha todos os passos necessários para criar e configurar uma nova conta Supabase para o projeto Educational ERP System.

## 📋 Índice

1. [Criação da Conta Supabase](#1-criação-da-conta-supabase)
2. [Criação do Projeto](#2-criação-do-projeto)
3. [Configuração do Banco de Dados](#3-configuração-do-banco-de-dados)
4. [Configuração de Autenticação](#4-configuração-de-autenticação)
5. [Obtenção das Variáveis de Ambiente](#5-obtenção-das-variáveis-de-ambiente)
6. [Configuração no Vercel/v0](#6-configuração-no-vercelv0)
7. [Testes de Conexão](#7-testes-de-conexão)
8. [Migração de Dados (Opcional)](#8-migração-de-dados-opcional)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Criação da Conta Supabase

### Passo 1.1: Acessar o Supabase
1. Acesse [https://supabase.com](https://supabase.com)
2. Clique em **"Start your project"** ou **"Sign Up"**

### Passo 1.2: Escolher Método de Autenticação
Você pode criar sua conta usando:
- **GitHub** (recomendado para desenvolvedores)
- **Google**
- **Email/Senha**

### Passo 1.3: Verificar Email
- Se escolheu email/senha, verifique sua caixa de entrada
- Clique no link de verificação enviado pelo Supabase

---

## 2. Criação do Projeto

### Passo 2.1: Criar Novo Projeto
1. No dashboard do Supabase, clique em **"New project"**
2. Selecione ou crie uma **Organization** (pode usar o nome da instituição)

### Passo 2.2: Configurar o Projeto
Preencha as informações:

- **Name**: `educational-erp-production` (ou nome de sua escolha)
- **Database Password**: 
  - Crie uma senha forte (mínimo 12 caracteres)
  - ⚠️ **IMPORTANTE**: Guarde esta senha em local seguro
  - Sugestão: Use um gerenciador de senhas
- **Region**: Escolha a região mais próxima dos usuários
  - Para Brasil: `South America (São Paulo)` ou `East US (North Virginia)`
- **Pricing Plan**: 
  - **Free**: Até 500MB de banco de dados, 2GB de armazenamento
  - **Pro**: $25/mês - Para produção com mais recursos

### Passo 2.3: Aguardar Criação
- O projeto leva cerca de 2-3 minutos para ser criado
- Você verá uma barra de progresso

---

## 3. Configuração do Banco de Dados

### Passo 3.1: Acessar o SQL Editor
1. No menu lateral, clique em **"SQL Editor"**
2. Você verá um editor de código SQL

### Passo 3.2: Executar Scripts de Criação

Execute os scripts na seguinte ordem:

#### Script 1: Funções Utilitárias
\`\`\`sql
-- Copie e cole o conteúdo de: scripts/new_scripts/001_utility_functions.sql
\`\`\`
1. Copie todo o conteúdo do arquivo `001_utility_functions.sql`
2. Cole no SQL Editor
3. Clique em **"Run"** ou pressione `Ctrl+Enter`
4. Aguarde a mensagem de sucesso

#### Script 2: Dados Iniciais (Disciplinas)
\`\`\`sql
-- Copie e cole o conteúdo de: scripts/new_scripts/002_seed_disciplinas.sql
\`\`\`
1. Copie todo o conteúdo do arquivo `002_seed_disciplinas.sql`
2. Cole no SQL Editor
3. Clique em **"Run"**

#### Script 3: Triggers
\`\`\`sql
-- Copie e cole o conteúdo de: scripts/new_scripts/003_add_missing_triggers.sql
\`\`\`

#### Script 4: Índices
\`\`\`sql
-- Copie e cole o conteúdo de: scripts/new_scripts/004_optimize_indexes.sql
\`\`\`

#### Script 5: Constraints
\`\`\`sql
-- Copie e cole o conteúdo de: scripts/new_scripts/005_add_constraints.sql
\`\`\`

#### Script 6: Views
\`\`\`sql
-- Copie e cole o conteúdo de: scripts/new_scripts/006_create_views.sql
\`\`\`

### Passo 3.3: Verificar Tabelas Criadas
1. No menu lateral, clique em **"Table Editor"**
2. Você deve ver todas as tabelas criadas:
   - `profiles`
   - `escola`
   - `alunos`
   - `responsaveis`
   - `aluno_responsavel`
   - `turmas`
   - `disciplinas`
   - `professores`
   - `professor_disciplina`
   - `matriculas`
   - `notas`
   - `frequencias`
   - `eventos`
   - `comunicados`
   - `financeiro`
   - `user_invites`

### Passo 3.4: Verificar RLS (Row Level Security)
1. Clique em qualquer tabela no Table Editor
2. Clique na aba **"Policies"**
3. Verifique se as políticas RLS estão ativas

---

## 4. Configuração de Autenticação

### Passo 4.1: Configurar Provider de Email
1. No menu lateral, clique em **"Authentication"**
2. Clique em **"Providers"**
3. Localize **"Email"** e clique para expandir
4. Configure:
   - ✅ **Enable Email provider**
   - ✅ **Confirm email** (recomendado para produção)
   - ✅ **Secure email change** (recomendado)

### Passo 4.2: Configurar Email Templates
1. Ainda em **"Authentication"**, clique em **"Email Templates"**
2. Personalize os templates (opcional):
   - **Confirm signup**: Email de confirmação de cadastro
   - **Magic Link**: Link mágico de login
   - **Change Email Address**: Confirmação de mudança de email
   - **Reset Password**: Redefinição de senha

### Passo 4.3: Configurar URLs de Redirecionamento
1. Em **"Authentication"**, clique em **"URL Configuration"**
2. Configure:
   - **Site URL**: URL do seu app em produção
     - Exemplo: `https://seu-dominio.vercel.app`
   - **Redirect URLs**: Adicione todas as URLs válidas para redirecionamento
     \`\`\`
     https://seu-dominio.vercel.app/**
     https://seu-dominio.vercel.app/auth/callback
     http://localhost:3000/** (para desenvolvimento)
     \`\`\`

### Passo 4.4: Configurar Trigger de Novo Usuário
Este trigger já foi criado nos scripts SQL, mas você pode verificar:

1. Vá em **"Database"** → **"Functions"**
2. Procure por `handle_new_user`
3. Esta função cria automaticamente um perfil quando um usuário se registra

---

## 5. Obtenção das Variáveis de Ambiente

### Passo 5.1: Acessar Project Settings
1. No menu lateral, clique no ícone de **"Settings"** (engrenagem)
2. Clique em **"API"**

### Passo 5.2: Copiar as Credenciais

Você precisará copiar as seguintes informações:

#### URL do Projeto
\`\`\`
Project URL: https://xxxxxxxxxxxxxxxx.supabase.co
\`\`\`
- Localize em **"Project URL"** ou **"API URL"**

#### Chave Anônima (anon/public key)
\`\`\`
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`
- Localize em **"Project API keys"** → **"anon public"**
- Esta chave é segura para usar no cliente (navegador)

#### Chave de Serviço (service_role key)
\`\`\`
service_role secret: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`
- Localize em **"Project API keys"** → **"service_role secret"**
- ⚠️ **CUIDADO**: Esta chave bypassa RLS, NUNCA exponha no cliente
- Use apenas em server-side (Node.js, API Routes)

#### JWT Secret
\`\`\`
JWT Secret: your-super-secret-jwt-token-with-at-least-32-characters-long
\`\`\`
- Localize em **"JWT Settings"** → **"JWT Secret"**
- Usado para verificar tokens JWT

### Passo 5.3: Copiar Credenciais do Banco de Dados (PostgreSQL)
1. Ainda em **"Settings"**, clique em **"Database"**
2. Role até **"Connection string"**
3. Selecione a aba **"URI"**
4. Copie a connection string completa:

\`\`\`
postgres://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxxxxx.supabase.co:5432/postgres
\`\`\`

**Variações da Connection String:**

- **POSTGRES_URL** (Connection pooling - Transaction mode):
  \`\`\`
  postgres://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
  \`\`\`

- **POSTGRES_PRISMA_URL** (Connection pooling - Session mode):
  \`\`\`
  postgres://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
  \`\`\`

- **POSTGRES_URL_NON_POOLING** (Direct connection):
  \`\`\`
  postgres://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
  \`\`\`

### Passo 5.4: Organizar as Variáveis

Crie um arquivo temporário (não commitar no git) com todas as variáveis:

\`\`\`env
# Supabase Configuration
SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long

# Database Configuration
POSTGRES_URL=postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
POSTGRES_PRISMA_URL=postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
POSTGRES_URL_NON_POOLING=postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
POSTGRES_USER=postgres.[PROJECT-REF]
POSTGRES_HOST=aws-0-sa-east-1.pooler.supabase.com
POSTGRES_PASSWORD=[YOUR-PASSWORD]
POSTGRES_DATABASE=postgres

# Development (v0)
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
\`\`\`

---

## 6. Configuração no Vercel/v0

### Opção A: Configuração no v0

#### Passo 6.1: Acessar a Aba "Connect"
1. No chat do v0, clique em **"Connect"** na barra lateral esquerda
2. Localize **"Supabase"**

#### Passo 6.2: Remover Integração Antiga (se necessário)
1. Se já existe uma integração Supabase, clique em **"Remove"**
2. Confirme a remoção

#### Passo 6.3: Adicionar Nova Integração
1. Clique em **"Add Integration"** ou no botão **"+"**
2. Selecione **"Supabase"**
3. Clique em **"Connect"**

#### Passo 6.4: Autorizar e Selecionar Projeto
1. Você será redirecionado para o Supabase
2. Faça login na conta nova
3. Autorize o acesso do v0
4. Selecione o projeto que você criou
5. Confirme a integração

### Opção B: Configuração Manual das Variáveis

Se preferir configurar manualmente:

#### Passo 6.5: Acessar a Aba "Vars"
1. No chat do v0, clique em **"Vars"** na barra lateral esquerda
2. Você verá todas as variáveis de ambiente

#### Passo 6.6: Atualizar Variáveis
Para cada variável, clique em **"Edit"** e atualize com os novos valores:

1. **SUPABASE_URL** e **NEXT_PUBLIC_SUPABASE_URL**
   - Cole a Project URL do passo 5.2

2. **SUPABASE_ANON_KEY** e **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Cole a anon public key do passo 5.2

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Cole a service_role secret key do passo 5.2

4. **SUPABASE_JWT_SECRET**
   - Cole o JWT Secret do passo 5.2

5. **POSTGRES_URL**, **POSTGRES_PRISMA_URL**, **POSTGRES_URL_NON_POOLING**
   - Cole as connection strings do passo 5.3

6. **POSTGRES_USER**, **POSTGRES_HOST**, **POSTGRES_PASSWORD**, **POSTGRES_DATABASE**
   - Preencha com as informações da connection string

### Opção C: Deploy no Vercel (Produção)

#### Passo 6.7: Conectar ao Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Faça login ou crie uma conta
3. Clique em **"Add New..."** → **"Project"**

#### Passo 6.8: Importar Repositório
1. Conecte ao GitHub, GitLab ou Bitbucket
2. Selecione o repositório do projeto
3. Clique em **"Import"**

#### Passo 6.9: Configurar Variáveis de Ambiente
1. Expanda **"Environment Variables"**
2. Adicione todas as variáveis do passo 5.4
3. Selecione os ambientes: **Production**, **Preview**, **Development**

#### Passo 6.10: Deploy
1. Clique em **"Deploy"**
2. Aguarde o build e deploy (2-5 minutos)
3. Acesse a URL do projeto para testar

---

## 7. Testes de Conexão

### Passo 7.1: Testar Autenticação

1. Acesse a página de registro do app
2. Tente criar um novo usuário:
   - Email: `teste@exemplo.com`
   - Senha: `Senha123!@#`

3. Verifique:
   - ✅ Usuário foi criado
   - ✅ Email de confirmação foi enviado (se configurado)
   - ✅ Registro na tabela `auth.users` do Supabase
   - ✅ Registro na tabela `public.profiles` foi criado automaticamente

### Passo 7.2: Verificar no Supabase

1. No Supabase, vá em **"Authentication"** → **"Users"**
2. Você deve ver o usuário recém-criado

3. Vá em **"Table Editor"** → **"profiles"**
4. Você deve ver um registro correspondente ao usuário

### Passo 7.3: Testar Login

1. Faça logout do app
2. Tente fazer login com as credenciais criadas
3. Verifique se o login foi bem-sucedido

### Passo 7.4: Testar Operações CRUD

Teste cada módulo do sistema:

- ✅ **Alunos**: Criar, listar, editar, excluir
- ✅ **Turmas**: Criar, listar, editar, excluir
- ✅ **Professores**: Criar, listar, editar, excluir
- ✅ **Disciplinas**: Listar (já populadas pelo seed)
- ✅ **Matrículas**: Criar, listar
- ✅ **Notas**: Lançar, visualizar
- ✅ **Frequência**: Registrar, visualizar
- ✅ **Comunicados**: Criar, visualizar
- ✅ **Financeiro**: Criar cobranças, visualizar

### Passo 7.5: Verificar Logs

Em caso de erros:

1. No Supabase, vá em **"Logs"**
2. Selecione:
   - **API**: Para erros de requisições
   - **Postgres**: Para erros de banco de dados
   - **Auth**: Para erros de autenticação

---

## 8. Migração de Dados (Opcional)

Se você precisa migrar dados do banco antigo para o novo:

### Passo 8.1: Exportar Dados do Banco Antigo

1. No Supabase antigo, vá em **"Table Editor"**
2. Para cada tabela, clique nos **"..."** → **"Export"** → **"CSV"**
3. Salve todos os arquivos CSV

### Passo 8.2: Ajustar CSVs (se necessário)

- Remova colunas `id` se forem auto-incrementadas
- Remova colunas `created_at` e `updated_at` (serão geradas automaticamente)
- Verifique formatação de datas (ISO 8601)

### Passo 8.3: Importar no Novo Banco

**Ordem correta de importação** (respeite as dependências):

1. `escola`
2. `profiles`
3. `disciplinas` (pule se já executou o seed)
4. `turmas`
5. `alunos`
6. `responsaveis`
7. `aluno_responsavel`
8. `professores`
9. `professor_disciplina`
10. `matriculas`
11. `notas`
12. `frequencias`
13. `eventos`
14. `comunicados`
15. `financeiro`
16. `user_invites`

Para cada tabela:
1. No novo Supabase, vá em **"Table Editor"**
2. Selecione a tabela
3. Clique em **"Insert"** → **"Import CSV"**
4. Selecione o arquivo e configure o mapeamento de colunas
5. Clique em **"Import"**

### Passo 8.4: Verificar Integridade dos Dados

Execute queries de validação:

\`\`\`sql
-- Verificar total de registros
SELECT 'alunos' as tabela, COUNT(*) as total FROM alunos
UNION ALL
SELECT 'turmas', COUNT(*) FROM turmas
UNION ALL
SELECT 'professores', COUNT(*) FROM professores
UNION ALL
SELECT 'matriculas', COUNT(*) FROM matriculas;

-- Verificar relações órfãs
SELECT a.* FROM alunos a
LEFT JOIN turmas t ON a.turma_id = t.id
WHERE a.turma_id IS NOT NULL AND t.id IS NULL;
\`\`\`

---

## 9. Troubleshooting

### Problema: "JWT expired" ou "Invalid JWT"

**Causa**: Token expirado ou JWT Secret incorreto

**Solução**:
1. Verifique se `SUPABASE_JWT_SECRET` está correto
2. Faça logout e login novamente
3. Limpe cookies do navegador

### Problema: "Row Level Security policy violation"

**Causa**: Políticas RLS bloqueando acesso

**Solução**:
1. No Supabase, vá na tabela problemática
2. Clique em **"Policies"**
3. Verifique se as policies estão corretas
4. Re-execute o script `001_utility_functions.sql` se necessário

### Problema: "Connection timeout" ou "Database not responding"

**Causa**: Limites de conexão ou projeto pausado

**Solução**:
1. Verifique se o projeto está ativo (não pausado por inatividade no plano Free)
2. No Supabase, vá em **"Settings"** → **"Database"**
3. Verifique o status do Connection Pooler
4. Considere upgrade para plano Pro se atingiu limites

### Problema: "Emails não estão sendo enviados"

**Causa**: Limite de emails no plano Free ou configuração incorreta

**Solução**:
1. Plano Free: máximo 4 emails/hora
2. Configure SMTP customizado em **"Project Settings"** → **"Auth"** → **"SMTP Settings"**
3. Use serviços como SendGrid, Mailgun, ou Amazon SES

### Problema: "Function already exists"

**Causa**: Tentativa de recriar função que já existe

**Solução**:
1. Use `CREATE OR REPLACE FUNCTION` nos scripts
2. Ou delete a função antes: `DROP FUNCTION IF EXISTS nome_da_funcao CASCADE;`

### Problema: "Permission denied for schema public"

**Causa**: Permissões do usuário postgres

**Solução**:
\`\`\`sql
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
\`\`\`

---

## 📞 Suporte

### Documentação Oficial
- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### Comunidade
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Discussions](https://github.com/supabase/supabase/discussions)

### Logs e Debug
- **Supabase Logs**: Dashboard → Logs
- **Vercel Logs**: Dashboard → Deployments → [seu deploy] → Logs
- **Browser Console**: F12 → Console (para erros client-side)

---

## ✅ Checklist Final

Antes de considerar a migração completa:

- [ ] Conta Supabase criada
- [ ] Projeto Supabase criado e ativo
- [ ] Todos os scripts SQL executados com sucesso
- [ ] Tabelas criadas e visíveis no Table Editor
- [ ] RLS policies ativas em todas as tabelas
- [ ] Authentication configurada (email provider ativo)
- [ ] URLs de redirecionamento configuradas
- [ ] Todas as variáveis de ambiente copiadas
- [ ] Variáveis configuradas no v0/Vercel
- [ ] Teste de registro de usuário funcionando
- [ ] Teste de login funcionando
- [ ] Trigger `handle_new_user` criando profiles automaticamente
- [ ] Operações CRUD testadas em cada módulo
- [ ] Dados migrados (se aplicável)
- [ ] Backup do banco antigo realizado
- [ ] Documentação atualizada com novas credenciais

---

**Última atualização**: 2025-01-13
**Versão**: 1.0.0
