# Educational ERP

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/brunnolinkin-3640s-projects/v0-educational-erp-system)

## Deploy

**[https://cee-erp.vercel.app/](https://cee-erp.vercel.app/)**

## Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Editor**: TipTap (RichTextEditor)
- **Calendário**: react-big-calendar
- **Formulários**: Server Actions + Client Components
- **Pacotes**: pnpm

## Banco de Dados

### Gerenciamento de Schema

O schema do banco é versionado via **migrations** em `supabase/migrations/`.

| Comando | Descrição |
|---------|-----------|
| `supabase migration new <nome>` | Cria uma nova migration |
| `supabase db push --linked` | Aplica migrations pendentes no banco da nuvem |
| `supabase db diff --linked -f <nome>` | Gera migration com diff entre shadow db local e nuvem |
| `supabase db dump --linked --data-only -f <arquivo>` | Backup apenas dos dados |

### Workflow seguro

Antes de alterar o schema:

1. **Snapshots existentes**: a migration mais recente já reflete o schema atual (ex.: `20260619191517_remote_schema.sql`).
2. **Backup opcional de dados**: `supabase db dump --linked --data-only -f supabase/pre_change_dados.sql`
3. Faça as alterações (nova migration + `db push`).
4. Se algo der errado, drope o schema remoto e reaplique a migration anterior ou o snapshot.

> ⚠️ O banco local (docker) e o banco da nuvem (Supabase hosted) são independentes. Alterações em um **não** afetam o outro automaticamente. Use `supabase db push --linked` para sincronizar.
