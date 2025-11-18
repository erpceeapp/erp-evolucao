# Variáveis de Ambiente - Educational ERP System

Este documento lista todas as variáveis de ambiente necessárias para o projeto e explica o propósito de cada uma.

## 📋 Variáveis Obrigatórias

### Supabase - Autenticação e API

#### `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`
- **Tipo**: String (URL)
- **Exemplo**: `https://xyzcompany.supabase.co`
- **Onde obter**: Supabase Dashboard → Settings → API → Project URL
- **Uso**: URL base da API do Supabase
- **Exposta ao cliente**: Sim (NEXT_PUBLIC)
- **Obrigatória**: ✅ Sim

#### `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Tipo**: String (JWT)
- **Exemplo**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Onde obter**: Supabase Dashboard → Settings → API → anon public
- **Uso**: Chave pública para autenticação no cliente
- **Exposta ao cliente**: Sim (NEXT_PUBLIC)
- **Segurança**: Segura para usar no browser (respeita RLS)
- **Obrigatória**: ✅ Sim

#### `SUPABASE_SERVICE_ROLE_KEY`
- **Tipo**: String (JWT)
- **Exemplo**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Onde obter**: Supabase Dashboard → Settings → API → service_role secret
- **Uso**: Chave privada para operações administrativas no servidor
- **Exposta ao cliente**: ❌ NÃO (apenas server-side)
- **Segurança**: ⚠️ NUNCA exponha no cliente - bypassa RLS
- **Obrigatória**: ✅ Sim (apenas para operações admin)

#### `SUPABASE_JWT_SECRET`
- **Tipo**: String
- **Exemplo**: `your-super-secret-jwt-token-with-at-least-32-characters-long`
- **Onde obter**: Supabase Dashboard → Settings → API → JWT Secret
- **Uso**: Verificar e assinar tokens JWT
- **Exposta ao cliente**: ❌ NÃO (apenas server-side)
- **Obrigatória**: ✅ Sim

---

### PostgreSQL - Conexão com Banco de Dados

#### `POSTGRES_URL`
- **Tipo**: String (Connection String)
- **Exemplo**: `postgres://postgres.[ref]:[password]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
- **Onde obter**: Supabase Dashboard → Settings → Database → Connection String (Transaction)
- **Uso**: Conexão com pooling para transações curtas
- **Modo**: Transaction pooling
- **Obrigatória**: ✅ Sim

#### `POSTGRES_PRISMA_URL`
- **Tipo**: String (Connection String)
- **Exemplo**: `postgres://postgres.[ref]:[password]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
- **Onde obter**: Supabase Dashboard → Settings → Database → Connection String (Session)
- **Uso**: Conexão com pooling para sessões longas (usado pelo Prisma ORM se aplicável)
- **Modo**: Session pooling
- **Obrigatória**: ✅ Sim (se usar Prisma)

#### `POSTGRES_URL_NON_POOLING`
- **Tipo**: String (Connection String)
- **Exemplo**: `postgres://postgres.[ref]:[password]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`
- **Onde obter**: Supabase Dashboard → Settings → Database → Connection String (Direct)
- **Uso**: Conexão direta sem pooling (migrations, scripts administrativos)
- **Modo**: Direct connection
- **Obrigatória**: ✅ Sim (para migrations)

#### `POSTGRES_USER`
- **Tipo**: String
- **Exemplo**: `postgres.xyzcompany`
- **Onde obter**: Extrair da connection string
- **Formato**: `postgres.[PROJECT_REF]`
- **Uso**: Username para conexão PostgreSQL
- **Obrigatória**: ✅ Sim

#### `POSTGRES_HOST`
- **Tipo**: String (hostname)
- **Exemplo**: `aws-0-sa-east-1.pooler.supabase.com`
- **Onde obter**: Extrair da connection string
- **Uso**: Host do servidor PostgreSQL
- **Obrigatória**: ✅ Sim

#### `POSTGRES_PASSWORD`
- **Tipo**: String
- **Exemplo**: `your-database-password-here`
- **Onde obter**: Senha definida na criação do projeto Supabase
- **Uso**: Senha para autenticação no banco
- **Segurança**: ⚠️ Mantenha segura, nunca exponha
- **Obrigatória**: ✅ Sim

#### `POSTGRES_DATABASE`
- **Tipo**: String
- **Exemplo**: `postgres`
- **Valor padrão**: `postgres` (para Supabase)
- **Uso**: Nome do database PostgreSQL
- **Obrigatória**: ✅ Sim

---

### Desenvolvimento

#### `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`
- **Tipo**: String (URL)
- **Exemplo**: `http://localhost:3000/auth/callback`
- **Uso**: URL de callback para autenticação em desenvolvimento local
- **Ambiente**: Apenas desenvolvimento
- **Exposta ao cliente**: Sim (NEXT_PUBLIC)
- **Obrigatória**: ⚠️ Apenas em desenvolvimento

---

## 🔧 Configuração por Ambiente

### Desenvolvimento Local (.env.local)

\`\`\`env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-super-secret-jwt-token

# PostgreSQL
POSTGRES_URL=postgres://postgres.[ref]:[password]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
POSTGRES_PRISMA_URL=postgres://postgres.[ref]:[password]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
POSTGRES_URL_NON_POOLING=postgres://postgres.[ref]:[password]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
POSTGRES_USER=postgres.[ref]
POSTGRES_HOST=aws-0-sa-east-1.pooler.supabase.com
POSTGRES_PASSWORD=your-password
POSTGRES_DATABASE=postgres

# Desenvolvimento
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
\`\`\`

### Produção (Vercel)

Configure todas as variáveis acima no Vercel Dashboard, EXCETO:
- ❌ `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` (apenas para dev)

Adicione também:
- ✅ Configure a URL de produção no Supabase (Settings → Auth → URL Configuration)

---

## 🔒 Segurança

### ✅ Seguro Expor no Cliente (NEXT_PUBLIC)

Estas variáveis podem ser incluídas no bundle JavaScript do cliente:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`

### ❌ NUNCA Expor no Cliente

Estas variáveis devem estar disponíveis APENAS no servidor:

- `SUPABASE_SERVICE_ROLE_KEY` ⚠️ CRÍTICO
- `SUPABASE_JWT_SECRET` ⚠️ CRÍTICO
- `POSTGRES_PASSWORD` ⚠️ CRÍTICO
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

### 🛡️ Boas Práticas

1. **Nunca commite arquivos .env no Git**
   - Adicione `.env*` no `.gitignore`
   - Use `.env.example` com valores fictícios

2. **Use diferentes credenciais por ambiente**
   - Desenvolvimento: Projeto Supabase de dev
   - Produção: Projeto Supabase separado

3. **Rotacione secrets periodicamente**
   - Troque `SUPABASE_SERVICE_ROLE_KEY` a cada 90 dias
   - Gere novas keys em caso de exposição acidental

4. **Monitore uso de APIs**
   - Configure alertas no Supabase para uso anormal
   - Revise logs regularmente

---

## 🧪 Validação

### Script de Teste

Crie um arquivo `scripts/test-env.js` para validar as variáveis:

\`\`\`javascript
const requiredEnvVars = [
  'SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWT_SECRET',
  'POSTGRES_URL',
  'POSTGRES_USER',
  'POSTGRES_HOST',
  'POSTGRES_PASSWORD',
  'POSTGRES_DATABASE',
];

const missingVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingVars.length > 0) {
  console.error('❌ Missing environment variables:');
  missingVars.forEach((varName) => console.error(`  - ${varName}`));
  process.exit(1);
}

console.log('✅ All required environment variables are set!');
\`\`\`

Execute: `node scripts/test-env.js`

---

## 📚 Referências

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Última atualização**: 2025-01-13
