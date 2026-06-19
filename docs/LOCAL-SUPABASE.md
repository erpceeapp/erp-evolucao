<!-- markdownlint-disable MD051 MD040 MD060 -->

# Guia de Ambiente Local Supabase

Guia de como configurar um ambiente Supabase local (via Docker) espelhado a partir do projeto Supabase cloud que está integrado ao Vercel.

## Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Instalação do Supabase CLI](#2-instalação-do-supabase-cli)
3. [Inicializar o Projeto Local](#3-inicializar-o-projeto-local)
4. [Link com o Projeto Cloud](#4-link-com-o-projeto-cloud) (requer acesso de admin)
5. [Pull do Schema do Banco Remoto](#5-pull-do-schema-do-banco-remoto)
   - [Via supabase link](#51-via-supabase-link---admin)
   - [Via --db-url - sem admin](#52-via---db-url---sem-acesso-de-admin-recomendado)
6. [Dump dos Dados (Opcional)](#6-dump-dos-dados-opcional)
7. [Iniciar o Supabase Local](#7-iniciar-o-supabase-local)
8. [Aplicar Migrations e Seed](#8-aplicar-migrations-e-seed)
9. [Configurar o .env.local](#9-configurar-o-envlocal)
10. [Workflow de Desenvolvimento](#10-workflow-de-desenvolvimento)
11. [Comandos Úteis](#11-comandos-úteis)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Pré-requisitos

### 1.1 Docker Desktop

- Instale o [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Verifique se está rodando:

  ```bash
  docker --version
  docker info
  ```

### 1.2 Acesso ao Projeto Supabase Cloud

- Tenha acesso ao dashboard do Supabase
- Localize o **Project Reference ID**:
  - Na URL do dashboard: `https://supabase.com/dashboard/project/<AQUI_FICA_O_REF>`
  - Ou em **Settings** → **General** → **Project Settings** → **Reference ID**

### 1.3 Supabase Access Token

1. Acesse [https://supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)
2. Clique em **"Generate New Token"**
3. Dê um nome (ex: `local-development`)
4. Copie o token gerado (só aparece uma vez)

### 1.4 Variáveis do Projeto Cloud

Você vai precisar das credenciais do Supabase cloud (estão no Vercel ou no dashboard do Supabase):

- `SUPABASE_URL` (ex: `https://xxxxx.supabase.co`)
- `SUPABASE_SERVICE_ROLE_KEY`
- `POSTGRES_URL_NON_POOLING` (conexão direta sem pooler)

---

## 2. Instalação do Supabase CLI como Dev Dependency

O Supabase CLI é instalado como **dependência de desenvolvimento** do projeto, garantindo que cada projeto tenha sua própria versão isolada.

```bash
pnpm add -D supabase
```

A partir de agora, todos os comandos usam `pnpm supabase` em vez de `supabase`:

```bash
pnpm supabase --version
```

### Scripts do projeto (opcional)

Os seguintes scripts foram adicionados ao `package.json` para facilitar o uso:

```json
"scripts": {
  "supabase:start": "supabase start",
  "supabase:stop": "supabase stop",
  "supabase:status": "supabase status",
  "supabase:pull": "supabase db pull",
  "supabase:reset": "supabase db reset",
  "supabase:studio": "start http://127.0.0.1:54343"
}
```

> Use via `pnpm supabase:start`, `pnpm supabase:pull`, etc.

---

## 3. Inicializar o Projeto Local

Na raiz do projeto, execute:

```bash
pnpm supabase init
```

Isso cria a estrutura:

```
supabase/
  config.toml      # Configuração do projeto local
  migrations/      # (vazio - será populado no pull)
  seed.sql         # (vazio - dados iniciais opcionais)
```

### 3.1 Verificar config.toml

O arquivo `supabase/config.toml` gerado contém configurações como:

```toml
[project]
name = "educational-erp"

[auth]
enabled = true

[api]
enabled = true
port = 54341

[db]
port = 54342

[storage]
enabled = true
```

> **Importante**: O `config.toml` contém secrets locais. Adicione `supabase/` ao `.gitignore` para não commitar acidentalmente, ou apenas não versionar o `config.toml` se ele tiver senhas.

---

## 4. Link com o Projeto Cloud

> Esta etapa só funciona se sua conta Supabase tiver acesso de **admin** ou **colaborador** ao projeto cloud.
> Se o projeto foi criado via Vercel Integration na conta de outra pessoa, pule para a [seção 5.2](#52-via---db-url---sem-acesso-de-admin-recomendado).

Com o Supabase CLI instalado e o project ref em mãos:

```bash
pnpm supabase link --project-ref <SEU_PROJECT_REF>
```

O CLI vai:

1. Solicitar o **Supabase Access Token** (criado no passo 1.3)
2. Autenticar e baixar informações do projeto remoto
3. Salvar a referência localmente

### Verificar se o link funcionou

```bash
pnpm supabase projects list
```

---

## 5. Pull do Schema do Banco Remoto

Existem duas formas de puxar o schema, dependendo do nível de acesso que você tem ao projeto Supabase.

---

### 5.1 Via supabase link (admin)

Se você conseguiu fazer o `supabase link` na [seção 4](#4-link-com-o-projeto-cloud):

```bash
pnpm supabase db pull
```

O CLI usa as credenciais salvas no link para conectar e extrair o schema.

---

### 5.2 Via --db-url (sem acesso de admin — recomendado)

Se o projeto Supabase está na conta de outra pessoa (ex: criado via Vercel Integration), você **não precisa** de `link` nem de token de API. Basta usar a string de conexão direta do banco:

```bash
pnpm supabase db pull --db-url "<POSTGRES_URL_NON_POOLING>"
```

A `POSTGRES_URL_NON_POOLING` está disponível em:
- **Vercel Dashboard**: Environment Variables do projeto
- **Supabase Dashboard**: Settings → Database → Connection String (Direct)

Ela se parece com:
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
```

> ⚠️ Use sempre a **URL sem pooler** (porta **5432**, não 6543) para operações de schema.

### Funcionamento do db pull

O `db pull` usa `pg_dump` internamente e:

- Conecta ao banco remoto
- Extrai todo o schema (tabelas, RLS policies, functions, triggers, views, indexes, etc.)
- Cria arquivos de migration incremental em `supabase/migrations/`
- Gera um arquivo `supabase/migrations/<timestamp>_schema.sql`

### O que é incluído

- ✅ Tabelas e colunas
- ✅ Tipos enumerados
- ✅ Functions e triggers
- ✅ RLS policies
- ✅ Indexes e constraints
- ✅ Views
- ✅ Sequences

### O que NÃO é incluído

- ❌ Dados das tabelas (apenas schema)
- ❌ Usuários do auth.users
- ❌ Arquivos do Storage
- ❌ Configurações de autenticação (providers, templates)

---

## 6. Dump dos Dados (Opcional)

Se você quiser copiar os dados do banco cloud para o local:

### 6.1 Exportar dados via Supabase CLI

```bash
pnpm supabase db dump --data-only -f supabase/seed.sql
```

Isso gera um `supabase/seed.sql` com INSERTs de todas as tabelas.

### 6.2 Exportar manualmente pelo Dashboard

1. No Supabase Dashboard, vá em **Table Editor**
2. Para cada tabela desejada, clique em **"Export"** → **"CSV"**
3. Ou execute no SQL Editor:

```sql
-- Exportar dados de todas as tabelas (exceto auth e storage)
\COPY public.alunos TO 'alunos.csv' CSV HEADER;
\COPY public.professores TO 'professores.csv' CSV HEADER;
-- ... repita para cada tabela desejada
```

### 6.3 Exportar via pg_dump direto

```bash
pg_dump --data-only --exclude-schema=auth --exclude-schema=storage \
  --dbname="<POSTGRES_URL_NON_POOLING>" > supabase/seed.sql
```

### 6.4 Limitações do dump de dados

- **auth.users**: não pode ser exportado facilmente (senhas são hashadas com salt único)
- **storage.objects**: arquivos não são incluídos no dump SQL
- **sequences**: os IDs auto-increment podem conflitar se você reimportar
- **Ordem de importação**: precisa respeitar foreign keys (use `--disable-triggers` ou importe na ordem correta)

---

## 7. Iniciar o Supabase Local

```bash
pnpm supabase start
```

Este comando:

- Baixa as imagens Docker do Supabase (primeira vez é mais lenta)
- Inicia containers: PostgreSQL, GoTrue (auth), Realtime, Storage API, Edge Functions
- Cria um banco local com as configurações do `config.toml`

### Saída esperada

```
Started supabase local development setup.

         API URL: http://127.0.0.1:54341
     GraphQL URL: http://127.0.0.1:54341/graphql/v1
          DB URL: postgresql://postgres:postgres@127.0.0.1:54342/postgres
      Studio URL: http://127.0.0.1:54343
    Inbucket URL: http://127.0.0.1:54344 (email catch-all)
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Acessar o Studio Local

Abra `http://127.0.0.1:54343` no navegador — é o equivalente local do dashboard do Supabase.

---

## 8. Aplicar Migrations e Seed

### 8.1 Aplicar as migrations (schema)

```bash
pnpm supabase migration up
```

### 8.2 Reset completo (schema + seed data)

```bash
pnpm supabase db reset
```

O `db reset`:

1. Para o banco local
2. Recria o banco do zero
3. Aplica todas as migrations de `supabase/migrations/`
4. Executa o `supabase/seed.sql` se existir

---

## 9. Configurar o .env.local

Após o `pnpm supabase start`, configure o arquivo `.env.local` (raiz do projeto) com as credenciais locais:

```env
# Supabase Local
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54341
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key_do_supabase_status>

SUPABASE_URL=http://127.0.0.1:54341
SUPABASE_ANON_KEY=<anon_key_do_supabase_status>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key_do_supabase_status>
SUPABASE_JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long

# PostgreSQL Local
POSTGRES_URL=postgresql://postgres:postgres@127.0.0.1:54342/postgres
POSTGRES_PRISMA_URL=postgresql://postgres:postgres@127.0.0.1:54342/postgres
POSTGRES_URL_NON_POOLING=postgresql://postgres:postgres@127.0.0.1:54342/postgres
POSTGRES_USER=postgres
POSTGRES_HOST=127.0.0.1
POSTGRES_PASSWORD=postgres
POSTGRES_DATABASE=postgres

# Desenvolvimento
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
```

> ⚠️ **Importante**: Nunca commite o `.env.local` no git. O `.gitignore` já deve incluir `.env*`.

### Obter as credenciais locais

```bash
pnpm supabase status
```

Esse comando mostra todas as URLs e chaves necessárias.

---

## 10. Workflow de Desenvolvimento

### 10.1 Fluxo Diário

```bash
# 1. Garantir que o Supabase local está rodando
pnpm supabase start

# 2. Rodar o projeto Next.js
pnpm dev

# 3. Desenvolver normalmente
# As mudanças no banco local são voláteis (perdidas no reset)
```

### 10.2 Fazer mudanças no schema local

Crie migrations incrementais em vez de editar o banco manualmente:

```bash
# Criar uma nova migration
pnpm supabase migration new nome_da_mudanca

# Editar o arquivo criado em supabase/migrations/<timestamp>_nome_da_mudanca.sql
# Aplicar a migration
pnpm supabase migration up
```

### 10.3 Sincronizar mudanças locais com o cloud

Depois de testar localmente, execute os scripts SQL manualmente no SQL Editor do Supabase cloud (como já é feito hoje com os scripts em `scripts/new_scripts/`).

### 10.4 Atualizar o ambiente local com o cloud mais recente

```bash
# Comando único (schema + dados + reset)
pnpm supabase:sync

# Ou manualmente:
pnpm supabase db pull
pnpm supabase db dump --data-only -f supabase/seed.sql
pnpm supabase db reset
```

---

## 11. Comandos Úteis

| Comando | Descrição |
|---------|-----------|
| `pnpm supabase start` | Iniciar ambiente local |
| `pnpm supabase stop` | Parar ambiente local |
| `pnpm supabase status` | Ver status e credenciais |
| `pnpm supabase init` | Inicializar configuração |
| `pnpm supabase link --project-ref <ref>` | Linkar com projeto cloud |
| `pnpm supabase:sync` | Sincronizar tudo do cloud (schema + dados + reset) |
| `pnpm supabase db pull` | Puxar schema do cloud |
| `pnpm supabase db push` | Enviar schema local para cloud (cuidado!) |
| `pnpm supabase db dump --data-only` | Exportar dados do cloud |
| `pnpm supabase migration up` | Aplicar migrations |
| `pnpm supabase migration new <nome>` | Criar nova migration |
| `pnpm supabase db reset` | Resetar banco local |
| `pnpm supabase projects list` | Listar projetos linkados |
| `pnpm supabase unlink` | Desvincular projeto cloud |

---

## 12. Troubleshooting

### "docker: command not found"

**Causa**: Docker não está instalado ou não está no PATH.

**Solução**: Instale o Docker Desktop e reinicie o terminal.

---

### "Your account does not have the necessary privileges" / "Unauthorized"

**Causa**: O Supabase CLI está tentando acessar a API do projeto cloud (link), mas sua conta não tem permissão — comum quando o projeto foi criado via Vercel Integration na conta de outra pessoa.

**Solução**: Use `--db-url` em vez de `link`. Você só precisa da string de conexão do banco (que está no Vercel):

```bash
pnpm supabase db pull --db-url "<POSTGRES_URL_NON_POOLING>"
```

Pule completamente os passos de `link` e `login`.

---

### "Supabase CLI is not authenticated"

**Causa**: Access token não configurado (só relevante se você for usar `supabase link`).

**Solução**:

```bash
pnpm supabase login
```

Cole o token gerado no passo 1.3.

---

### "failed to connect to remote database"

**Causa**: Credenciais do banco cloud incorretas ou IP não autorizado.

**Solução**:

1. Verifique se a `POSTGRES_URL_NON_POOLING` está correta
2. No Supabase Dashboard, vá em **Settings** → **Database** → **Network Restrictions**
3. Adicione seu IP atual à lista de permissões (ou desabilite restrições para desenvolvimento)

---

### Porta já em uso

**Causa**: Outro serviço usando a porta ou outro Supabase local rodando.

**Solução**:

```bash
# Verificar qual processo está na porta
netstat -ano | findstr :54341

# Parar instância anterior
pnpm supabase stop --project-id <nome_do_projeto>

# Ou alterar as portas no config.toml:
[api]
port = 54341
```

---

### "relation already exists" ao rodar migrations

**Causa**: Conflito entre migrations existentes e schema atual.

**Solução**:

```bash
pnpm supabase db reset  # Recria o banco do zero
```

---

### Dados inconsistentes após importar seed

**Causa**: Ordem de importação incorreta ou conflito de foreign keys.

**Solução**:

1. Use `pnpm supabase db reset` para limpar o banco
2. Edite o `supabase/seed.sql` para desabilitar triggers temporariamente:

```sql
SET session_replication_role = replica;
-- ... INSERTs ...
SET session_replication_role = DEFAULT;
```

---

### Erro de JWT ao fazer requisições

**Causa**: O JWT secret local (`super-secret-jwt-token-with-at-least-32-characters-long`) não corresponde ao do cloud.

**Solução**: Isso é esperado. O ambiente local tem seu próprio JWT secret. Apenas certifique-se de que o `SUPABASE_JWT_SECRET` no `.env.local` corresponde ao que `pnpm supabase status` exibe.

---

### "email rate limit exceeded" no ambiente local

**Causa**: O Supabase local usa o Inbucket (email catch-all) em vez de enviar emails reais.

**Solução**: Acesse `http://127.0.0.1:54344` para ver todos os emails enviados localmente. Não há limite de taxa no ambiente local.

---

## Checklist de Verificação

- [ ] Docker Desktop instalado e rodando
- [ ] Supabase CLI instalado como dev dependency (`pnpm supabase --version`)
- [ ] `pnpm supabase init` executado na raiz do projeto
- [ ] Access token gerado no Supabase
- [ ] `pnpm supabase link --project-ref <id>` configurado
- [ ] `pnpm supabase db pull` executado com sucesso
- [ ] `pnpm supabase start` rodando sem erros
- [ ] `pnpm supabase migration up` aplicou todas as migrations
- [ ] `.env.local` configurado com credenciais locais
- [ ] `pnpm dev` funciona apontando para o Supabase local
- [ ] Studio local acessível em `http://127.0.0.1:54343`
- [ ] Inbucket acessível em `http://127.0.0.1:54344`

---

## Referências

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Local Development Overview](https://supabase.com/docs/guides/local-development)
- [Supabase db pull](https://supabase.com/docs/reference/cli/supabase-db-pull)
- [Supabase db dump](https://supabase.com/docs/reference/cli/supabase-db-dump)
- [Docker Desktop para Windows](https://docs.docker.com/desktop/install/windows-install/)

---

**Última atualização**: 2025-01-13
