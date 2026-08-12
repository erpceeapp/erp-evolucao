# Migração do Banco Supabase para Outro Projeto

## Backups necessários

Os backups ficam em `.backup-data/`. Para migrar para um projeto Supabase novo (outra conta), são necessários 3 arquivos:

| Arquivo | Comando | Conteúdo |
|---------|---------|----------|
| `backup-YYYYMMDD.sql` | `supabase db dump --linked -f .backup-data/backup-YYYYMMDD.sql` | Schema/DDL do `public` |
| `backup-YYYYMMDD-auth.sql` | `supabase db dump --linked --data-only --schema auth -f .backup-data/backup-YYYYMMDD-auth.sql` | Dados de `auth` (users, identities) |
| `backup-YYYYMMDD-data.sql` | `supabase db dump --linked --data-only -f .backup-data/backup-YYYYMMDD-data.sql` | Dados de aplicação (`public`) |

> Os backups de `auth` e `data` preservam os mesmos UUIDs, permitindo que as FKs
> (`profiles.id -> auth.users.id`) continuem válidas no projeto novo.

## Passo a passo

1. **Criar o projeto Supabase novo** na outra conta (dashboard do Supabase).

2. **Obter a connection string** do banco de produção (Settings > Database > Connection string / URI) do projeto novo.

3. **Restaurar o schema** (tabelas, funções, triggers e RLS policies):
   ```
   psql "$DATABASE_URL" < backup-YYYYMMDD.sql
   ```

4. **Restaurar o auth** (contas de usuário e identidades, preservando IDs):
   ```
   psql "$DATABASE_URL" < backup-YYYYMMDD-auth.sql
   ```

5. **Restaurar os dados da aplicação**:
   ```
   psql "$DATABASE_URL" < backup-YYYYMMDD-data.sql
   ```

## O que NÃO é migrado automaticamente

- **Storage (arquivos)** — buckets/objetos ficam no S3, não no banco. Migrar manualmente via dashboard ou API.
- **Configurações de projeto** — auth providers, domínios customizados, Edge Functions, secrets. Reconfigurar no dashboard.

## Notas

- A ordem importa: schema → auth → data (o `profiles` referencia `auth.users`, que precisa existir antes do restore dos dados).
- Em produção, `psql` pode estar disponível via `npx supabase` ou qualquer cliente PostgreSQL.
