# Análise de Segurança e Plano de Ação

> Data: 2026-06-21
> Projeto: Centro Educacional Evolução (educational-erp)

---

## Sumário Executivo

O projeto passou por uma auditoria de segurança completa que identificou **29 vulnerabilidades**, das quais **25 estão resolvidas** e **4 permanecem pendentes** (1 crítica, 3 altas). As vulnerabilidades pendentes têm um plano de ação detalhado com dependências mapeadas.

**Resumo por severidade:**

| Severidade | Total | Resolvidas | Pendentes |
|------------|-------|------------|-----------|
| Crítica    | 1     | 0          | 1 (C05) |
| Alta       | 5     | 2          | 3 (H01, H03, H04) |
| Média      | 10    | 10         | 0 |
| Baixa      | 4     | 4          | 0 |

---

## Classificação por Severidade — Pendentes

| ID | Severidade | Título | Esforço | Dependente de |
|----|-----------|--------|---------|---------------|
| C05 | **Crítica** | Substituir `createAdminClient()` por cliente com RLS | Médio | H04 |
| H04 | **Alta** | Middleware não executa (`proxy.ts` → `middleware.ts`) | Pequeno | Nenhum |
| H01 | **Alta** | Rate limiting nos endpoints de auth | Médio | Nenhum |
| H03 | **Alta** | Revogação de sessão (blocklist) | Grande | C05 |

**Ordem recomendada de execução:** H04 → C05 → H03, com H01 em paralelo.

---

## Análise Detalhada

### 1. H04 — Middleware não executa

**Severidade:** Alta | **Esforço:** Pequeno | **Dependente:** Nenhum

**Problema:**
O arquivo de middleware está nomeado como `proxy.ts`, mas o Next.js **só carrega** arquivos chamados `middleware.ts` (ou `src/middleware.ts`). Impacto:

- `updateSession()` nunca é chamado — sessões Supabase nunca são renovadas no edge
- `verifyResponsavelToken()` nunca é chamado — rota de responsável sem proteção
- Nenhum redirecionamento para login em rotas protegidas

**Solução:**
Renomear `proxy.ts` para `middleware.ts` e refatorar os imports. O Next.js detecta automaticamente o arquivo e passa a executá-lo em todas as requisições.

**Código esperado:**

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

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

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/alunos") /* ... */) {
    return await updateSession(request)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)"],
}
```

**Riscos:** `jwtVerify` do `jose` funciona no Edge; `updateSession()` do Supabase SSR já é compatível.

---

### 2. C05 — Substituir `createAdminClient()` por cliente com RLS

**Severidade:** Crítica | **Esforço:** Médio | **Dependente:** H04

**Problema:**
`createAdminClient()` usa `SUPABASE_SERVICE_ROLE_KEY` que ignora RLS. Qualquer query via este client tem **acesso irrestrito** a todas as tabelas. Usado em 6 locais:

- `app/api/auth/responsavel/route.ts` — login (busca por CPF/email)
- `app/api/responsavel/agenda/route.ts` — agenda do responsável
- `app/responsavel/dashboard/page.tsx` — dashboard do responsável
- `app/responsavel/notas/page.tsx` — notas do responsável
- `lib/responsavel-auth.ts` — verificação de token
- `app/(authenticated)/professores/novo/actions.ts` — criação de usuário (único caso legítimo)

**Solução:**

1. Criar RLS policies no banco que escopem acesso do responsável aos seus próprios dados
2. Criar `createResponsavelClient()` usando `NEXT_PUBLIC_SUPABASE_ANON_KEY` + RLS
3. Substituir `createAdminClient()` nos 4 locais do responsável
4. Manter `createAdminClient()` **apenas** para `admin.createUser()` (único caso que realmente precisa de service role)

**RLS policies necessárias:**

```sql
CREATE POLICY "responsavel_select_alunos" ON alunos
  FOR SELECT USING (
    responsavel_cpf = current_setting('request.jwt.claims', true)::json->>'cpf'
  );

CREATE POLICY "responsavel_select_matriculas" ON matriculas
  FOR SELECT USING (
    aluno_id IN (SELECT id FROM alunos WHERE responsavel_cpf = ...)
  );
```

**Riscos:** RLS policies precisam ser testadas para não vazar dados entre responsáveis. A query de login (`/api/auth/responsavel`) precisa de uma function `SECURITY DEFINER` para encontrar o aluno por CPF/email sem RLS.

---

### 3. C01 — Rotação de secrets
- **Status:** Resolvido
- **Severidade:** Media
- **Como:** Investigação confirmou que `.env` nunca foi commitado ao repositório (git log confirma). Secrets (SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, RESPONSAVEL_JWT_SECRET) nunca vazaram por este meio. Recomendação de boas práticas documentada no playbook.
- **Playbook:** Caso haja suspeita de vazamento, executar:
  1. `supabase secrets list` para listar secrets atuais na nuvem
  2. `supabase secrets set --env-file .env.production` para rotacionar
  3. Atualizar `RESPONSAVEL_JWT_SECRET` no Vercel/cloud provider
  4. Invalidar todas as sessões responsavel via `SELECT revogar_sessoes_responsavel(p_aluno_id)` para cada aluno ativo

---

### 4. H01 — Rate Limiting nos Endpoints de Auth

**Severidade:** Alta | **Esforço:** Médio | **Dependente:** Nenhum

**Problema:**
Não há rate limiting. O endpoint `POST /api/auth/responsavel` (login email+CPF) é vulnerável a brute-force.

**Solução (recomendada — Upstash Ratelimit):**

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
  const { success } = await ratelimit.limit(ip)
  if (!success) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em 1 minuto." },
      { status: 429 }
    )
  }
  // ...
}
```

**Limites sugeridos:**

- `POST /api/auth/responsavel` — 5 tentativas/minuto/IP
- `POST /auth/logout` — 10 requests/minuto/IP
- `GET /api/responsavel/agenda` — 30 requests/minuto/IP

**Alternativa leve (não recomendada para Vercel):** `Map<string, { count, resetAt }>` in-memory. Não persiste entre instâncias serverless.

---

### 5. H03 — Revogação de Sessão (Blocklist)

**Severidade:** Alta | **Esforço:** Grande | **Dependente:** C05 (idealmente)

**Problema:**
Logout apenas limpa cookie local. O token JWT do responsável continua válido até expirar (8h). Um atacante com token roubado mantém acesso mesmo após logout.

**Solução:**

1. Criar tabela `session_blocklist` no banco
2. Implementar cleanup periódico de entradas expiradas
3. Modificar `verifyResponsavelToken()` para verificar blocklist antes de validar o JWT
4. Modificar `destroyResponsavelSession()` para inserir hash do token na blocklist

```sql
CREATE TABLE session_blocklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_blocklist_hash ON session_blocklist(token_hash);
CREATE INDEX idx_blocklist_expires ON session_blocklist(expires_at);
```

**Riscos:** Adiciona latência a cada verificação (hash SHA-256 + query no banco). Tabela pode crescer — cleanup é essencial. `crypto.subtle` precisa funcionar no Edge runtime.

---

## Grafo de Dependências

```
H04 (middleware.ts) ──→ C05 (RLS) ──→ ~~C01 (rotacionar secrets)~~ ✅
                                       │
                                       └──→ H03 (blocklist)

H01 (rate limiting) ──→ independente (pode ser feito a qualquer momento)
```

---

## Roteiro de Execução

| Ordem | ID | Ação | Esforço | Entrega |
|-------|----|------|---------|---------|
| 1 | H04 | Renomear `proxy.ts` → `middleware.ts` + refatorar | ~30 min | Imediato |
| 2 | H01 | Implementar rate limiting (Upstash ou alternativo) | ~2h | Paralelo |
| 3 | C05 | Criar RLS policies + `createResponsavelClient()` + migrar | ~4h | Após H04 |
| 4 | H03 | Criar tabela blocklist + modificar verify/destroy session | ~3h | Após C05 |

---

## Checklist de Vulnerabilidades Resolvidas (25)

### Críticas (0/1 resolvidas — ver pendentes acima)

### Altas (2/5 resolvidas)

- [x] **H02** — Separar JWT secret do responsável do `SUPABASE_JWT_SECRET`
- [x] **H05** — Corrigir enumeração de usuários no login
- [x] **H06** — Role check em `cadastrarAluno` (alunos/novo/actions.ts)
- [x] **H07** — Role/ownership check em `atualizarAluno`
- [x] **H08** — Validação Zod no formulário de alunos
- [x] **H09** — Rota `/auth/callback` para confirmação de email
- [x] **H10** — Security headers (CSP, HSTS, XFO) em `next.config.mjs`

### Médias (10/10 resolvidas)

- [x] **C01** — Rotação de secrets (reclassificado para Média — investigação confirmou que `.env` nunca foi commitado)
- [x] **M01** — `secure: true` no cookie do responsável
- [x] **M02** — `crypto.randomUUID()` para matrícula em vez de `Math.random()`
- [x] **M03** — Remover `console.log` de dados sensíveis
- [x] **M04** — Remover `typescript.ignoreBuildErrors` + corrigir erros TS
- [x] **M05** — Pin versões exatas de dependências
- [x] **M06** — Verificar ausência de dependências Svelte/Vue/Vite
- [x] **M07** — Usar `createClient()` em vez de `createBrowserClient`
- [x] **M08** — Validação explícita de env vars
- [x] **M09** — Validação de parâmetros de busca em 5 páginas

### Baixas (4/4 resolvidas)

- [x] **L01** — Logout via POST Server Action com confirmação
- [x] **L02** — Role check em páginas de visualização (alunos/professores/matriculas/[id])
- [x] **L03** — `minimum_password_length: 8` com `password_requirements`
- [x] **L04** — `unoptimized: false` + `remotePatterns` para imagens

---

## Referências

- `security/to-solve.md` — Checklist original de vulnerabilidades
- `security/plano-acao.md` — Plano de ação detalhado com código
- `proxy.ts` — Arquivo que deveria ser `middleware.ts`
- `lib/supabase/admin.ts` — `createAdminClient()` (service role, alvo do C05)
- `lib/responsavel-auth.ts` — Autenticação custom JWT do responsável
