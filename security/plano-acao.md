# Plano de Acao — Vulnerabilidades Restantes (5)

## Prioridade de Execucao

| Ordem | ID | Severidade | Item | Esforco | Dependente de |
|-------|----|-----------|------|---------|---------------|
| 1 | H04 | Alta | Middleware nao executa (proxy.ts → middleware.ts) | Pequeno | Nenhum |
| 2 | C05 | Critica | Substituir `createAdminClient()` por client com RLS | Medio | H04 (validação no middleware) |
| 3 | C01 | Critica | Rotacionar secrets expostos | Pequeno | C05 (garantir que o novo secret esteja em uso) |
| 4 | H01 | Alta | Rate limiting nos endpoints de auth | Medio | Nenhum |
| 5 | H03 | Alta | Revogacao de sessao (blocklist) | Grande | C05 (usar client com RLS para queries de auditoria) |

---

## 1. H04 — Middleware nao executa (`proxy.ts` → `middleware.ts`)

**Severidade:** Alta | **Esforco:** Pequeno | **Dependente:** Nenhum

### Problema

O arquivo de middleware esta nomeado como `proxy.ts`, mas o Next.js so carrega `middleware.ts` (ou `src/middleware.ts`). Como resultado:

- `updateSession()` nunca e chamado — sessoes Supabase nunca sao renovadas no edge
- `verifyResponsavelToken()` nunca e chamado — middleware de responsavel nao executa
- Nao ha redirecionamento para login para rotas protegidas

### Plano

1. **Renomear `proxy.ts` para `middleware.ts`**
2. **Refatorar o codigo existente:**
   - Manter a logica de matching de rotas (responsavel vs autenticado vs publico)
   - Corrigir imports para refletir o novo nome de arquivo
   - Garantir que `updateSession()` seja chamado para rotas do dashboard
   - Garantir que `verifyResponsavelToken()` seja chamado para rotas `/responsavel/*`
3. **Rodar build e testar** todas as rotas protegidas

### Detalhes Tecnicos

```typescript
// middleware.ts (estrutura esperada)
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Rotas do responsavel
  if (pathname.startsWith("/responsavel")) {
    const token = request.cookies.get("responsavel_token")?.value
    if (!token) return NextResponse.redirect(new URL("/", request.url))
    const session = await verifyResponsavelToken(token)
    if (!session) {
      const res = NextResponse.redirect(new URL("/", request.url))
      res.cookies.delete("responsavel_token")
      return res
    }
    return NextResponse.next()
  }

  // Rotas autenticadas (dashboard)
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/alunos") ...) {
    return await updateSession(request)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)"],
}
```

### Riscos

- `middleware.ts` executa em ambiente Edge — nao pode usar Node.js APIs (fs, crypto, etc.)
- `jwtVerify` do `jose` funciona no Edge — verificar se a implementacao atual e compativel
- `updateSession()` do Supabase SSR ja e compatível com Edge

---

## 2. C05 — Substituir `createAdminClient()` por client com RLS

**Severidade:** Critica | **Esforco:** Medio | **Dependente:** H04

### Problema

`createAdminClient()` usa a `SUPABASE_SERVICE_ROLE_KEY` que ignora RLS. Qualquer query via este client tem acesso irrestrito a todas as tabelas. Usado em 6 locais.

### Plano

1. **Criar RLS policies no banco** que permitam as queries necessarias:
   - Responsavel pode ler dados do proprio aluno (via `responsavel_cpf` na tabela `alunos`)
   - Responsavel pode ler matriculas e turmas relacionadas ao seu aluno
   - Responsavel pode ler notas, disciplinas, avisos relacionados
2. **Criar um `createResponsavelClient()`** que usa `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon key) e depende das RLS policies para escopar acesso
3. **Substituir `createAdminClient()` por `createClient()`** nos 4 locais do responsavel:
   - `app/api/auth/responsavel/route.ts` — login (busca por CPF/email do aluno)
   - `app/api/responsavel/agenda/route.ts` — dados da agenda
   - `app/responsavel/dashboard/page.tsx` — dashboard
   - `app/responsavel/notas/page.tsx` — notas
4. **Criar um `createAdminUserClient()` para `admin.createUser()`** (unico caso que realmente precisa de service role):
   - Manter somente em `app/(authenticated)/professores/novo/actions.ts`
   - Documentar que este e o unico caso legitimo

### RLS Policies Necessarias

```sql
-- Responsavel pode ler alunos onde responsavel_cpf = seu CPF
CREATE POLICY "responsavel_select_alunos" ON alunos
  FOR SELECT USING (
    responsavel_cpf IN (
      SELECT cpf FROM responsavel_tokens WHERE token = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Responsavel pode ler matriculas dos seus alunos
CREATE POLICY "responsavel_select_matriculas" ON matriculas
  FOR SELECT USING (
    aluno_id IN (SELECT id FROM alunos WHERE responsavel_cpf = ...)
  );

-- (similar para turmas, notas, disciplinas, avisos)
```

### Riscos

- RLS policies precisam ser testadas exaustivamente para nao vazar dados entre responsaveis
- A query de login (`/api/auth/responsavel`) precisa encontrar o aluno por CPF/email — sem RLS, o anon key nao tem acesso a `alunos`. Solucao: criar uma `function` SQL com `SECURITY DEFINER` para essa verificacao
- `createAdminClient()` para `admin.createUser()` e de fato necessario — service role e a unica forma de criar usuarios no auth.users

---

## 3. C01 — Rotacionar Secrets Expostos

**Severidade:** Critica | **Esforco:** Pequeno | **Dependente:** C05

### Problema

`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` e `POSTGRES_PASSWORD` estao em plaintext nos arquivos `.env` e `.env.production`, que estao commitados no git.

### Plano

1. **Antes de rotacionar**, garantir que o novo esquema de acesso esteja pronto (C05):
   - Service role removida de todos os lugares que nao precisam dela
   - RLS policies criadas e testadas
2. **Remover secrets dos arquivos versionados:**
   - Adicionar `.env` e `.env.production` ao `.gitignore`
   - Remover `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `POSTGRES_PASSWORD` e `POSTGRES_PRISMA_URL` dos arquivos `.env` e `.env.production`
3. **Rotacionar secrets no Supabase Dashboard:**
   - Acessar <https://supabase.com/dashboard/project/oelazawqodszxjubjgxk>
   - Settings → API → Service Role Key → Regenerate
   - Settings → Auth → JWT Secret → Regenerate
   - Database → Connection string → Reset password
4. **Atualizar apenas `.env.local`** (ja no `.gitignore`) com os novos valores
5. **Configurar GitHub Secrets / Vercel Secrets** para CI/CD e deploy
6. **Remover arquivos antigos do git** (opcional, mas recomendado):

   ```bash
   git rm --cached .env .env.production
   ```

   → **Nao fazer sem autorizacao**

### Riscos

- Rotacionar o JWT secret invalida **todas as sessoes ativas** de todos os usuarios
- Rotacionar a senha do banco derruba conexoes ativas (Prisma, pooling)
- Coordenar com janela de manutencao se o sistema estiver em producao
- Apos rotacionar, atualizar imediatamente as env vars na Vercel

---

## 4. H01 — Rate Limiting nos Endpoints de Auth

**Severidade:** Alta | **Esforco:** Medio | **Dependente:** Nenhum

### Problema

Nao ha rate limiting em nenhum endpoint. O endpoint `POST /api/auth/responsavel` (login com email+CPF) e particularmente vulneravel a bruteforce.

### Plano

**Opcao A (recomendada): Upstash Ratelimit (serverless)**

1. Instalar `@upstash/ratelimit` e `@upstash/redis`
2. Configurar Redis Upstash (plano gratis: 10k requests/dia)
3. Aplicar rate limit nos endpoints:
   - `POST /api/auth/responsavel` — 5 tentativas/minuto por IP
   - `POST /auth/logout` — 10 requests/minuto por IP
   - `POST /api/responsavel/agenda` — 30 requests/minuto por IP

```typescript
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
})

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous"
  const { success, limit, remaining } = await ratelimit.limit(ip)

  if (!success) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente em 1 minuto." }, { status: 429 })
  }
  // ... continue
}
```

**Opcao B (leve, sem dependencias): In-memory com Map**

```typescript
const rateMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= maxRequests) return false
  entry.count++
  return true
}
```

⚠️ **Problema da Opcao B**: O estado e em memoria — nao persiste entre restartos do servidor e nao funciona em serverless (Vercel) pois cada requisicao pode ir para uma instancia diferente.

### Riscos

- Upstash adiciona dependencia externa e latencia de ~5-10ms por request
- Falsos positivos se varios usuarios compartilharem o mesmo IP (NAT, proxy corporativo)
- Rate limit no middleware (H04) e mais eficaz que em cada endpoint, mas requer incluir o Redis no edge runtime

---

## 5. H03 — Revogacao de Sessao (Blocklist)

**Severidade:** Alta | **Esforco:** Grande | **Dependente:** C05 (idealmente)

### Problema

Logout apenas limpa cookie local. O token JWT do responsavel e a sessao do Supabase continuam validos ate expirar. Um atacante com token roubado mantem acesso mesmo apos logout.

### Plano

1. **Criar tabela `session_blocklist` no banco:**

   ```sql
   CREATE TABLE session_blocklist (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     token_hash TEXT NOT NULL,        -- hash SHA256 do token (nao o token em si)
     expires_at TIMESTAMPTZ NOT NULL, -- mesma expiracao do token original
     revoked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     revoked_by UUID REFERENCES auth.users(id) -- opcional
   );

   CREATE INDEX idx_blocklist_hash ON session_blocklist(token_hash);
   CREATE INDEX idx_blocklist_expires ON session_blocklist(expires_at);
   ```

2. **Implementar cleanup periodico:**
   - Remover entradas expiradas (podem ser deletadas apos `expires_at`)
   - Pode ser feito via cron (pg_cron) ou em cada verificacao

3. **Modificar `verifyResponsavelToken()` para checar blocklist:**

   ```typescript
   export async function verifyResponsavelToken(token: string) {
     try {
       const { payload } = await jwtVerify(token, getSecret())
       const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))
       const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("")

       const { data: blocked } = await supabase
         .from("session_blocklist")
         .select("id")
         .eq("token_hash", hashHex)
         .single()

       if (blocked) return null  // token revoked

       return { ... }
     } catch {
       return null
     }
   }
   ```

   ⚠️ Nota: `crypto.subtle` funciona no Edge runtime.

4. **Modificar `destroyResponsavelSession()` para inserir na blocklist:**

   ```typescript
   export async function destroyResponsavelSession() {
     const cookieStore = await cookies()
     const token = cookieStore.get(COOKIE_NAME)?.value
     if (token) {
       const { payload } = await jwtVerify(token, getSecret())
       const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))
       const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("")

       await supabase.from("session_blocklist").insert({  // usar service role aqui? ou RLS?
         token_hash: hashHex,
         expires_at: new Date((payload.exp as number) * 1000).toISOString(),
       })
     }
     cookieStore.delete(COOKIE_NAME)
   }
   ```

5. **Para Supabase Auth sessions**, considerar:
   - `supabase.auth.signOut()` ja invalida a sessao no servidor do Supabase (se o projeto estiver usando o servico gerenciado)
   - Para auto-hosted: implementar blocklist similar ou usar `auth.invalidateSession()` do admin API (requer service role)

### Riscos

- Adiciona latencia a cada verificacao de token (leitura no banco + hash SHA-256)
- A tabela `session_blocklist` pode crescer — cleanup e essencial
- Se o banco cair, nenhum token pode ser verificado (dependencia do Supabase para a validacao)
- `crypto.subtle` nao esta disponivel em todos os runtimes — verificar compatibilidade

---

## Resumo de Dependencias

```
H04 (middleware.ts) ──→ C05 (RLS) ──→ C01 (rotacao secrets)
                                       │
                                       └──→ H03 (blocklist)

H01 (rate limiting) ──→ independente
H03 (blocklist) ──────→ idealmente apos C05, mas pode ser independente
```

**Ordem recomendada:** H04 → C05 → C01 → H03, com H01 em paralelo a qualquer momento.
