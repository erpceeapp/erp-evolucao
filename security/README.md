# Análise de Segurança — Educational ERP

Data: 2026-06-19
Versão do Projeto: 0.1.0
Framework: Next.js 16.2.9 | Supabase | Tailwind CSS

---

## Índice

1. [Resumo Executivo](#1-resumo-executivo)
2. [Vulnerabilidades Críticas](#2-vulnerabilidades-críticas)
3. [Vulnerabilidades Altas](#3-vulnerabilidades-altas)
4. [Vulnerabilidades Médias](#4-vulnerabilidades-médias)
5. [Vulnerabilidades Baixas](#5-vulnerabilidades-baixas)
6. [Problemas de Configuração e Dependências](#6-problemas-de-configuração-e-dependências)
7. [Tabela Resumo](#7-tabela-resumo)
8. [Recomendações Prioritárias](#8-recomendações-prioritárias)

---

## 1. Resumo Executivo

Esta análise identificou **29 vulnerabilidades** no projeto:

| Severidade | Quantidade |
|------------|-----------|
| CRÍTICA | 6 |
| ALTA | 10 |
| MÉDIA | 9 |
| BAIXA | 4 |

Os problemas mais graves envolvem:

- **Secrets de produção expostos** em arquivos locais (service_role key, JWT secret, senha do banco)
- **Server Actions sem autenticação** — qualquer pessoa pode criar usuários admin
- **Mutações diretas no banco pelo cliente** — authorization bypassável via DevTools
- **Chave de serviço (service_role) usada em queries voltadas ao usuário**, anulando RLS
- **Ausência total de security headers** (CSP, HSTS, XFO)
- **39 dependências usando `"latest"`** — risco de supply-chain attack

---

## 2. Vulnerabilidades Críticas

### C01. Secrets de Produção em Arquivos Locais

**Arquivos:** `.env`, `.env.production`
**Linhas:** 1-13

**Descrição:** Os arquivos contém em texto plano:

- `SUPABASE_SERVICE_ROLE_KEY` — chave que bypassa todas as RLS policies
- `SUPABASE_JWT_SECRET` — secreto de assinatura JWT
- `POSTGRES_PASSWORD` — senha direta do banco PostgreSQL
- Strings completas de conexão com senha embutida

**Risco:** Se a máquina do desenvolvedor for comprometida, o atacante tem acesso total ao banco de produção, pode criar usuários, forjar tokens JWT e ler/escrever qualquer dado.

**Remediação:** Rotacionar IMEDIATAMENTE todas as chaves. Nunca armazenar secrets de produção localmente. Usar gerenciador de secrets (Vercel Environment Variables, 1Password, etc.).

---

### C02. Server Action `createProfessorUser` Sem Autenticação

**Arquivo:** `app/(authenticated)/professores/novo/actions.ts`
**Linhas:** 1-98 (arquivo inteiro)

**Descrição:** Esta Server Action (`"use server"`) cria usuários no Supabase Auth via `supabaseAdmin.auth.admin.createUser()` usando a service_role key. **Não há nenhuma verificação de autenticação ou autorização.** Qualquer pessoa que consiga chamar esta action pode criar contas com qualquer email e definir a senha inicial como o CPF informado (linha 13).

**Risco:** Criação arbitrária de usuários com privilégios. A senha temporária é o próprio CPF (numérico, baixa entropia).

**Remediação:** Adicionar `const { data: { user } } = await supabase.auth.getUser()` no início e verificar se `tipo_usuario` é admin/diretor antes de prosseguir.

---

### C03. Server Action `updateEvento` Sem Autenticação

**Arquivo:** `app/(authenticated)/agenda/[id]/editar/page.tsx`
**Linhas:** 26-55

**Descrição:** A Server Action `updateEvento` (inline, linha 26) atualiza qualquer evento por ID sem verificar se o usuário está autenticado ou se é o dono do evento. O `id` vem do parâmetro da URL, criando uma vulnerabilidade IDOR.

**Risco:** Qualquer usuário autenticado pode modificar eventos de outros usuários.

**Remediação:** Adicionar `auth.getUser()` e verificar ownership (criador do evento) ou role admin.

---

### C04. Mutações no Banco Diretamente do Cliente

**Arquivo:** `app/(authenticated)/gerenciar-usuarios/page.tsx`
**Linhas:** 56-69, 107-114

**Descrição:** A verificação de autorização (linhas 56-69) é feita **apenas no cliente**, controlando somente o que é renderizado na UI. As operações de escrita (`supabase.from("profiles").update()` na linha 107) são executadas diretamente do navegador. Um usuário malicioso pode usar o DevTools para chamar a API do Supabase diretamente e alterar qualquer `tipo_usuario` para "admin".

**Mesmo padrão encontrado em:**

- `app/(authenticated)/usuarios/page.tsx:49-140` — criação/deleção de invites
- `app/(authenticated)/escola/page.tsx:46-90` — alteração de dados da escola
- `app/(authenticated)/agenda/page.tsx:70` — deleção de eventos
- `app/(authenticated)/presenca/[turmaId]/[disciplinaId]/page.tsx:191-220` — registro de presença
- `app/(authenticated)/diario/[...]/presencas/[aulaId]/page.tsx:145-177` — alteração de presenças
- `app/(authenticated)/agenda-aluno/[alunoId]/page.tsx:112-228` — CRUD de avisos por aluno

**Risco:** Elevação de privilégio em massa. Qualquer usuário logado pode se tornar admin manipulando o cliente.

**Remediação:** Mover TODAS as operações de escrita para Server Actions com verificação de role no servidor. Cliente só deve chamar `select` com RLS.

---

### C05. Chave Service Role Usada em Queries Voltadas ao Usuário

**Arquivos:**

- `app/api/auth/responsavel/route.ts:20-64`
- `app/api/responsavel/agenda/route.ts:11-27`
- `app/responsavel/dashboard/page.tsx:31-66`
- `app/responsavel/notas/page.tsx:10-96`
- `app/(authenticated)/professores/novo/actions.ts:17`

**Descrição:** O client admin (`createAdminClient()`) usa `SUPABASE_SERVICE_ROLE_KEY` que **bypassa todas as RLS policies**. Embora esses endpoints validem o JWT do responsável, eles consultam dados filtrados apenas pelo `session.aluno_id` contido no JWT. Se o `SUPABASE_JWT_SECRET` for comprometido (e está exposto no `.env` — veja C01), um atacante pode forjar JWTs e acessar dados de qualquer aluno sem restrições RLS.

**Risco:** Bypass completo de RLS. Dados de todos os alunos expostos se o JWT secret vazar.

**Remediação:** Usar o client anônimo (com RLS) para queries voltadas ao usuário sempre que possível. Reservar o client admin apenas para operações administrativas internas.

---

### C06. Geração de Token de Invite com `Math.random()`

**Arquivo:** `app/(authenticated)/usuarios/page.tsx`
**Linha:** 103

```typescript
const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
```

**Descrição:** O token de invite é gerado com `Math.random()`, que **não é criptograficamente seguro**. Um atacante que observe alguns tokens pode prever tokens futuros. Além disso, o token é logado no console do navegador (linha 123):

```typescript
console.log(`Email enviado para ${newInvite.email} com token: ${token}`)
```

**Risco:** Tokens previsíveis permitem criar contas sem ter recebido o convite. Extensões de navegador maliciosas podem capturar o token do console.

**Remediação:** Usar `crypto.randomUUID()`. Remover `console.log` de tokens sensíveis.

---

## 3. Vulnerabilidades Altas

### H01. Falta de Rate Limiting em Endpoints de Autenticação

**Arquivos:**

- `app/api/auth/responsavel/route.ts` (POST, login do responsável)
- `app/auth/cadastro/page.tsx` (registro de usuário)

**Descrição:** Nenhum dos endpoints de autenticação implementa rate limiting. Um atacante pode:

- Brutar force combinações de email/CPF no login do responsável
- Criar contas em massa até atingir limites globais do Supabase

**Remediação:** Adicionar rate limiting (ex: `@upstash/ratelimit` ou middleware de IP throttling).

---

### H02. JWT Secret Compartilhado Entre Supabase Auth e Auth Customizada

**Arquivo:** `lib/responsavel-auth.ts:7-11`

```typescript
function getSecret() {
  const secret = process.env.SUPABASE_JWT_SECRET
  return new TextEncoder().encode(secret)
}
```

**Descrição:** O mesmo `SUPABASE_JWT_SECRET` usado pelo Supabase para assinar tokens de autenticação é reutilizado para assinar os JWTs customizados do portal do responsável. Isso viola o princípio de chaves separadas por contexto.

**Risco:** Se o secret vazar, ambos os sistemas de auth são comprometidos simultaneamente. Um token Supabase legítimo poderia ser interpretado como token de responsável e vice-versa.

**Remediação:** Usar um secret dedicado para os JWTs do responsável (ex: `RESPONSAVEL_JWT_SECRET`).

---

### H03. Sessão do Responsável Sem Mecanismo de Revogação

**Arquivos:**

- `lib/responsavel-auth.ts:52-55`
- `app/api/auth/responsavel/logout/route.ts:1-7`

**Descrição:** O logout simplesmente deleta o cookie, mas o JWT continua válido por 8 horas (TTL definido no cookie). Não há mecanismo server-side para invalidar o token (blocklist/allowlist).

**Risco:** Um token roubado (via XSS, interceptação de rede) continua funcionando mesmo após o logout do usuário legítimo.

**Remediação:** Manter uma tabela de blocklist de tokens no banco ou usar Redis para invalidar sessões ativamente.

---

### H04. Middleware não Valida Sessão em Rotas de API do Responsável

**Arquivo:** `middleware.ts:9-11`

```typescript
if (pathname.startsWith("/api/auth/responsavel") || pathname.startsWith("/api/responsavel")) {
  return NextResponse.next()
}
```

**Descrição:** Todas as rotas de API do responsável passam pelo middleware **sem qualquer validação de sessão**. Cada rota é responsável pela própria autenticação. Se um novo endpoint for adicionado sem a devida validação, ficará completamente desprotegido.

**Remediação:** Mover a validação do JWT para o middleware em vez de deixar cada rota responsável.

---

### H05. Login do Responsável Permite Enumeração de Usuários

**Arquivo:** `app/api/auth/responsavel/route.ts:23-44`

**Descrição:** O endpoint primeiro busca por `email_responsavel` (linha 26), depois filtra por CPF (linha 37). Embora a mensagem de erro seja genérica, diferenças de tempo de resposta ou comportamento podem permitir que um atacante verifique se um email existe no sistema.

**Remediação:** Buscar por email E CPF simultaneamente em uma única query. Adicionar rate limiting e considerar CAPTCHA.

---

### H06. Server Action `cadastrarAluno` sem Role Check

**Arquivo:** `app/(authenticated)/alunos/novo/actions.ts:22-100`

**Descrição:** A action cria um client Supabase mas **nunca chama `auth.getUser()`** para verificar se o usuário está autenticado ou qual é sua role. Qualquer um que consiga chamar essa action pode cadastrar alunos.

**Remediação:** Adicionar verificação de role no servidor (`tipo_usuario IN ('admin', 'secretaria', 'diretor')`).

---

### H07. Server Action `atualizarAluno` sem Ownership Check

**Arquivo:** `app/(authenticated)/alunos/novo/actions.ts:112-198`

**Descrição:** A action `atualizarAluno(id, formData)` atualiza qualquer aluno pelo ID fornecido sem verificar se o usuário tem permissão para editar aquele registro específico.

**Remediação:** Adicionar role-based authorization check antes do update.

---

### H08. Sanitização de Input Apenas Remove Espaços

**Arquivo:** `app/(authenticated)/alunos/novo/actions.ts:7-10`

**Descrição:** A função `sanitizeFormData` apenas executa `trim()` nos campos e retorna `null` para strings vazias. Não há validação de tipos, limites de tamanho, ou escape de caracteres especiais/HTML.

**Risco:** Stored XSS se os dados forem renderizados sem escape em algum componente.

**Remediação:** Implementar validação com Zod, Joi ou similar. Escapar HTML no servidor.

---

### H09. Falta de Rota `/auth/callback`

**Arquivo:** `app/auth/cadastro/page.tsx:57`

```typescript
emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
```

**Descrição:** O fluxo de confirmação de email aponta para `/auth/callback`, mas esta rota **não existe** no projeto. Links de confirmação de email e reset de senha resultarão em erro 404.

**Remediação:** Criar `app/auth/callback/route.ts` conforme a [documentação do Supabase SSR](https://supabase.com/docs/guides/auth/quickstarts/nextjs).

---

### H10. Ausência Total de Security Headers

**Arquivo:** `next.config.mjs:1-11`

**Descrição:** O `next.config.mjs` não implementa a função `headers()`. Nenhum dos seguintes headers de segurança é enviado:

| Header | Função |
|--------|--------|
| `Content-Security-Policy` | Previne XSS e data injection |
| `X-Content-Type-Options: nosniff` | Previne MIME sniffing |
| `X-Frame-Options: DENY` | Previne clickjacking |
| `Strict-Transport-Security` | Força HTTPS |
| `Referrer-Policy` | Controla vazamento de referrer |
| `Permissions-Policy` | Restringe APIs do navegador |

**Remediação:** Adicionar função `headers()` no `next.config.mjs` com todos os headers de segurança.

---

## 4. Vulnerabilidades Médias

### M01. Cookie `Secure` Flag Desabilitado em Desenvolvimento

**Arquivo:** `app/api/auth/responsavel/route.ts:83-88`

```typescript
response.cookies.set("responsavel-session", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  // ...
})
```

**Descrição:** O flag `secure` só é ativado em produção. Em desenvolvimento, o cookie é transmitido sem criptografia.

**Remediação:** Detectar HTTPS dinamicamente ou sempre usar `secure: true`.

---

### M02. Senha Temporária Fraca para Professores

**Arquivo:** `app/(authenticated)/professores/novo/actions.ts:13`

```typescript
const senhaTemporaria = professorData.cpf.replace(/[^0-9]/g, "")
```

**Descrição:** A senha temporária é o CPF do professor (somente números, baixa entropia). Embora o primeiro acesso force a troca de senha, o CPF é um dado semi-público e fácil de adivinhar. A action também expõe os 3 primeiros dígitos na resposta (linha 65).

**Remediação:** Gerar senha temporária aleatória com `crypto.randomUUID()`.

---

### M03. Console.log de Dados Sensíveis

**Arquivos com `console.log` de PII/dados sensíveis:**

- `app/(authenticated)/alunos/novo/actions.ts:28,98,103` — logs dados do aluno
- `app/(authenticated)/professores/novo/actions.ts:15,26,56,60,83,87,96` — logs criação de usuário
- `app/(authenticated)/agenda/[id]/editar/page.tsx:50` — logs erros
- `app/(authenticated)/agenda/page.tsx:68` — logs ID do evento
- `app/(authenticated)/presenca/[turmaId]/[disciplinaId]/page.tsx:183-189` — logs dados de aula
- `app/(authenticated)/usuarios/page.tsx:123` — logs token de invite
- `lib/supabase/client.ts:7-9` — logs status das env vars

**Remediação:** Remover `console.log` de produção ou proteger com `process.env.NODE_ENV !== "production"`.

---

### M04. Typescript `ignoreBuildErrors: true`

**Arquivo:** `next.config.mjs:3-5`

```javascript
typescript: {
    ignoreBuildErrors: true,
}
```

**Descrição:** Erros de tipo TypeScript são ignorados no build. Isso anula o `strict: true` do `tsconfig.json` e esconde problemas que poderiam ser pegos em tempo de compilação (null checks, tipos incorretos).

**Remediação:** Remover esta opção e corrigir todos os erros de tipo.

---

### M05. Uso de `"latest"` em 39 Dependências

**Arquivo:** `package.json` (múltiplas linhas)

**Descrição:** 39 dependências usam `"latest"` como versão. Isso impede builds reproduzíveis e pode introduzir mudanças quebradas ou vulnerabilidades silenciosamente.

**Destaques de risco:**

- `@supabase/ssr`, `@supabase/supabase-js` — bibliotecas de auth
- `jspdf` — histórico de CVEs
- `yaml` — última publicação em 2021 (potencialmente sem manutenção)

**Remediação:** Pin para versões específicas com `^` semver ranges.

---

### M06. Dependências de Frameworks Não Utilizados

**Arquivo:** `package.json` (dependencies, não devDependencies)

**Descrição:** As seguintes dependências são de frameworks **não utilizados** neste projeto Next.js/React:

| Pacote | Linha |
|--------|-------|
| `@sveltejs/kit` | 52 |
| `@sveltejs/vite-plugin-svelte` | 53 |
| `@vue/compiler-sfc` | 55 |
| `pinia` | 73 |
| `vue` | 92 |
| `vue-router` | 93 |
| `vite` | 91 |

**Risco:** Aumento desnecessário da superfície de ataque. Cada pacote adicional pode conter vulnerabilidades.

**Remediação:** Remover todas as dependências não utilizadas.

---

### M07. Client Supabase Criado Diretamente com Env Vars

**Arquivo:** `app/(authenticated)/configuracoes/campos-obrigatorios/page.tsx:103-106`

```typescript
createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

**Descrição:** Em vez de usar o `createClient()` padronizado de `@/lib/supabase/client`, este componente cria o client diretamente, abrindo mão de centralização e consistência.

**Remediação:** Usar `import { createClient } from "@/lib/supabase/client"`.

---

### M08. Non-null Assertions em Environment Variables

**Arquivo:** `lib/supabase/server.ts:12`

```typescript
process.env.NEXT_PUBLIC_SUPABASE_URL!
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
```

**Descrição:** O operador `!` força TypeScript a ignorar `undefined`. Se as variáveis estiverem faltando em runtime, o erro será genérico e difícil de diagnosticar.

**Remediação:** Adicionar validação explícita com mensagens de erro claras.

---

### M09. Parâmetro de Busca sem Sanitização

**Arquivo:** `app/(authenticated)/alunos/page.tsx:39-42`

```typescript
query = query.or(
  `nome_completo.ilike.%${busca}%,cpf.ilike.%${busca}%`,
)
```

**Descrição:** O parâmetro `busca` da URL é interpolado diretamente em um pattern `ilike`. Embora o Supabase SDK parametrize os valores, patterns maliciosos podem causar negação de serviço ou exposição indevida de dados.

**Remediação:** Validar tamanho e caracteres permitidos no termo de busca.

---

## 5. Vulnerabilidades Baixas

### L01. Logout sem CSRF

**Arquivo:** `app/api/auth/responsavel/logout/route.ts:1-7`

**Descrição:** O endpoint de logout aceita POST sem token CSRF. Um atacante poderia forçar o logout de um usuário (ataque de negação de serviço localizado).

**Remediação:** Adicionar verificação CSRF ou exigir o token de sessão no corpo da requisição.

---

### L02. IDOR em Páginas de Visualização

**Arquivos:**

- `app/(authenticated)/alunos/[id]/page.tsx:21-31`
- `app/(authenticated)/professores/[id]/page.tsx:18-28`
- `app/(authenticated)/matriculas/[id]/page.tsx:19-26`

**Descrição:** As páginas verificam `auth.getUser()` mas não verificam se o usuário tem permissão para ver o recurso específico. Um professor pode ver dados de outro professor apenas alterando o ID na URL.

**Remediação:** Adicionar role checks no servidor para acesso a dados.

---

### L03. Política de Senha Fraca

**Arquivo:** `app/(authenticated)/perfil/page.tsx:114`

**Descrição:** O Supabase está configurado com `minimum_password_length = 6` e sem exigência de complexidade (maiúsculas, números, símbolos).

**Remediação:** Aumentar para mínimo 8 caracteres com requisitos de complexidade.

---

### L04. Imagens Sem Otimização

**Arquivo:** `next.config.mjs:6-8`

```javascript
images: {
    unoptimized: true,
}
```

**Descrição:** A otimização de imagens do Next.js está desabilitada. Isso permite upload de SVGs sem sanitização e arquivos muito grandes.

**Remediação:** Habilitar otimização e configurar domínios permitidos.

---

## 6. Problemas de Configuração e Dependências

### D01. Duplicação de Env Vars

**Arquivo:** `.env` (linhas 1 e 10, 2 e 13)

`SUPABASE_ANON_KEY` e `SUPABASE_URL` aparecem duas vezes no arquivo. A última definição prevalece, o que pode causar confusão se os valores divergirem.

**Severidade:** BAIXA

---

### D02. `lang="en"` em Aplicação em Português

**Arquivo:** `app/layout.tsx:31`

O atributo `lang="en"` está incorreto para uma aplicação brasileira. Deveria ser `lang="pt-BR"`.

**Severidade:** BAIXA (não é segurança, mas merece correção)

---

### D03. `skipLibCheck: true` + `ignoreBuildErrors` Anulam TypeScript Strict

**Arquivos:** `tsconfig.json:9`, `next.config.mjs:3-5`

A combinação de `skipLibCheck: true` e `typescript.ignoreBuildErrors: true` anula completamente a segurança de tipos do TypeScript, mesmo com `strict: true` declarado.

**Severidade:** MÉDIA

---

### D04. Falta de `vercel.json` para Headers de Segurança

Não há arquivo `vercel.json`. Se deployado na Vercel, security headers poderiam ser configurados também via `vercel.json`, mas não estão.

**Severidade:** BAIXA

---

## 7. Tabela Resumo

| ID | Vulnerabilidade | Arquivo(s) | Linhas | Severidade |
|----|----------------|------------|--------|------------|
| C01 | Secrets de produção em arquivos locais | `.env`, `.env.production` | 1-13 | **CRÍTICA** |
| C02 | `createProfessorUser` sem auth | `professores/novo/actions.ts` | 1-98 | **CRÍTICA** |
| C03 | `updateEvento` sem auth + IDOR | `agenda/[id]/editar/page.tsx` | 26-55 | **CRÍTICA** |
| C04 | Mutações via cliente (6 arquivos) | Múltiplos | Variadas | **CRÍTICA** |
| C05 | Service role key em queries de usuário | Múltiplos (responsavel, professores) | Variadas | **CRÍTICA** |
| C06 | Token de invite com `Math.random()` | `usuarios/page.tsx` | 103, 123 | **CRÍTICA** |
| H01 | Sem rate limiting em auth | `api/auth/responsavel/route.ts`, `auth/cadastro/page.tsx` | — | **ALTA** |
| H02 | JWT secret compartilhado | `lib/responsavel-auth.ts` | 7-11 | **ALTA** |
| H03 | Sessão sem revogação | `lib/responsavel-auth.ts`, `logout/route.ts` | 52-55 | **ALTA** |
| H04 | Middleware não valida API de responsável | `middleware.ts` | 9-11 | **ALTA** |
| H05 | Enumeração de usuários no login | `api/auth/responsavel/route.ts` | 23-44 | **ALTA** |
| H06 | `cadastrarAluno` sem role check | `alunos/novo/actions.ts` | 22-100 | **ALTA** |
| H07 | `atualizarAluno` sem ownership check | `alunos/novo/actions.ts` | 112-198 | **ALTA** |
| H08 | Sanitização só faz trim | `alunos/novo/actions.ts` | 7-10 | **ALTA** |
| H09 | Rota `/auth/callback` ausente | `auth/cadastro/page.tsx` | 57 | **ALTA** |
| H10 | Security headers ausentes | `next.config.mjs` | — | **ALTA** |
| M01 | Cookie sem `secure` em dev | `api/auth/responsavel/route.ts` | 83-88 | **MÉDIA** |
| M02 | Senha temporária = CPF | `professores/novo/actions.ts` | 13 | **MÉDIA** |
| M03 | Console.log de dados sensíveis | Múltiplos arquivos | Variadas | **MÉDIA** |
| M04 | `ignoreBuildErrors: true` | `next.config.mjs` | 3-5 | **MÉDIA** |
| M05 | 39 dependências com `"latest"` | `package.json` | Variadas | **MÉDIA** |
| M06 | Dependências não utilizadas | `package.json` | 52-55, 73, 91-93 | **MÉDIA** |
| M07 | Client criado direto (sem wrapper) | `configuracoes/campos-obrigatorios/page.tsx` | 103-106 | **MÉDIA** |
| M08 | Non-null assertion em env vars | `lib/supabase/server.ts` | 12 | **MÉDIA** |
| M09 | Parâmetro de busca sem sanitização | `alunos/page.tsx` | 39-42 | **MÉDIA** |
| L01 | Logout sem CSRF | `api/auth/responsavel/logout/route.ts` | 1-7 | **BAIXA** |
| L02 | IDOR em páginas de visualização | `alunos/[id]`, `professores/[id]`, `matriculas/[id]` | Variadas | **BAIXA** |
| L03 | Política de senha fraca | `perfil/page.tsx`, `supabase/config.toml` | 114, 183 | **BAIXA** |
| L04 | Imagens sem otimização | `next.config.mjs` | 6-8 | **BAIXA** |

---

## 8. Recomendações Prioritárias

### Imediatas (Críticas)

1. **Rotacionar todas as chaves expostas** — `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `POSTGRES_PASSWORD` no dashboard do Supabase. As chaves atuais devem ser consideradas comprometidas.

2. **Adicionar autenticação em todas as Server Actions** — Toda `"use server"` function deve começar com `await supabase.auth.getUser()` e verificar a role.

3. **Eliminar mutações client-side** — Mover todos os `insert`, `update`, `delete` para Server Actions com verificação de autorização no servidor.

4. **Adicionar security headers** — Implementar função `headers()` no `next.config.mjs` com CSP, HSTS, XFO, X-Content-Type-Options.

5. **Remover secrets de produção dos arquivos `.env`** — Manter apenas credenciais de desenvolvimento local.

### Curtíssimo Prazo (Altas)

1. **Criar rota `/auth/callback`** para o fluxo de confirmação de email.

2. **Adicionar rate limiting** nos endpoints de autenticação.

3. **Separar JWT secret do responsável** do `SUPABASE_JWT_SECRET`.

4. **Adicionar validação de input com Zod** — substituir o `sanitizeFormData` atual.

5. **Remover dependências não utilizadas** (Svelte, Vue, Vite, etc.).

### Médio Prazo

1. **Pin versões das dependências** — substituir `"latest"` por ranges semver.

2. **Remover `typescript.ignoreBuildErrors`** e corrigir erros de tipo.

3. **Adicionar CSRF protection** para endpoints POST.

4. **Implementar revogação de sessão** para JWTs do responsável.

5. **Remover `console.log` de produção** que expose PII ou dados sensíveis.

---

*Documento gerado automaticamente em 2026-06-19. As vulnerabilidades identificadas devem ser reavaliadas após cada mudança significativa no código.*
