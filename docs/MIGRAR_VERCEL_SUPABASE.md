# Migrar Projeto para Nova Conta Vercel + Supabase

## Visão Geral

Este tutorial cobre a migração completa de um projeto Next.js + Supabase:

- Conta **Vercel** antiga → nova
- Conta **Supabase** antiga → nova

---

## 1. Supabase — Criar Projeto na Conta Nova

1. Acesse [supabase.com](https://supabase.com) com a nova conta
2. Clique em **New project**
3. Escolha uma organização (ou crie uma)
4. Defina:
   - **Name**: mesmo nome ou nome novo
   - **Database Password**: guarde com seguranca
   - **Region**: mesma regiao do projeto antigo (ideal)
5. Anote o **Project Ref** (hash de ~20 caracteres na URL: `https://supabase.com/dashboard/project/<ref>`)

---

## 2. Migrar o Banco de Dados

### Opcao A — pg_dump + psql (terminal)

```bash
# Dump do banco antigo (use a connection string do pooler)
pg_dump "postgresql://postgres.<ref_antigo>:<senha>@aws-1-sa-east-1.pooler.supabase.com:6543/postgres" \
  --schema=public \
  --no-owner \
  --no-acl \
  > dump_educational_erp.sql

# Restaurar no banco novo
psql "postgresql://postgres.<ref_novo>:<senha_nova>@aws-1-sa-east-1.pooler.supabase.com:6543/postgres" \
  < dump_educational_erp.sql
```

### Opcao B — Supabase Dashboard (manual)

1. Projeto antigo → **SQL Editor** → rode `SELECT tablename FROM pg_tables WHERE schemaname = 'public'` para listar as tabelas
2. Para cada tabela, use **Export** (ou rode `COPY` manualmente)
3. Projeto novo → **SQL Editor** → cole e execute as migrations (arquivos em `supabase/migrations/`)
4. Se precisar dos dados, use `pg_dump` mesmo

### Pos-migracao

No dashboard do novo projeto, verifique:

- [ ] **Authentication > Settings**: Site URL, Redirect URLs, providers (Google, etc.)
- [ ] **Authentication > Templates**: templates de email (confirmacao, reset de senha)
- [ ] **Storage**: recrie os buckets e suas policies RLS
- [ ] **SQL Editor**: rode `SELECT * FROM pg_catalog.pg_tables WHERE schemaname='public'` para confirmar dados

---

## 3. Supabase CLI — Vincular ao Novo Projeto

```bash
# 1. Desvincular do antigo
supabase unlink

# 2. Vincular ao novo (substitua <NOVO_REF>)
supabase link --project-ref <NOVO_REF>

# 3. Puxar schema do novo projeto
supabase db pull

# 4. (opcional) Resetar banco local com as migrations
supabase db reset
```

---

## 4. Atualizar Variaveis de Ambiente (.env)

### `.env` e `.env.production`

Substitua **todos os valores** pelas credenciais do novo Supabase:

| Variavel | Origem no novo dashboard |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Settings > API > Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Settings > API > anon public** |
| `SUPABASE_URL` | Mesmo da Project URL |
| `SUPABASE_ANON_KEY` | Mesmo do anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | **Settings > API > service_role (secret)** — cuidado, nao expor |
| `SUPABASE_JWT_SECRET` | **Settings > API > JWT Secret** |
| `POSTGRES_HOST` | `db.<NOVO_REF>.supabase.co` |
| `POSTGRES_PRISMA_URL` | Connection string do pooler (porta 6543) |
| `POSTGRES_URL` | Connection string do pooler (porta 6543) |
| `POSTGRES_URL_NON_POOLING` | Connection string direta (porta 5432) |

### `supabase/.temp/`

- **`project-ref`**: substitua pelo novo ref
- **`linked-project.json`**: sera recriado ao rodar `supabase link`
- **`pooler-url`**: atualize com a nova URL do pooler

---

## 5. Vercel — Deploy na Conta Nova

### Via Dashboard (recomendado)

1. Faca login na **nova conta Vercel**
2. Clique em **Add New > Project**
3. Importe o **mesmo repositorio Git**
4. Framework preset: **Next.js** (deve detectar automaticamente)
5. Em **Environment Variables**, adicione **todas** as variaveis do novo Supabase (mesmas do passo 4)
6. Clique em **Deploy**

### Remover da Conta Antiga (opcional)

Projeto antigo na Vercel: **Settings > Danger Zone > Delete Project**

---

## 6. Verificacao Final

- [ ] Rodar `supabase status` localmente — deve mostrar o novo ref
- [ ] `npm run dev` — app funciona localmente
- [ ] Login/cadastro funcionam
- [ ] Consultas ao banco retornam dados
- [ ] Deploy na nova Vercel completo (visitar URL)
- [ ] Storage (uploads) funcionando
- [ ] Providers de auth (Google, etc.) configurados

---

## Comandos Rapidos

```bash
# Supabase CLI
supabase unlink
supabase link --project-ref <ref>
supabase db pull
supabase db reset

# Dev local
npm run dev:local
```
