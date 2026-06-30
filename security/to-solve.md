# Check List de Resolucao de Vulnerabilidades

## Instrucao

Conforme resolver cada item, troque `[ ]` por `[x]` e adicione a data.

---

## Resolvidas (24)

- [x] **C02** — Adicionar `auth.getUser()` + role check em `createProfessorUser` (professores/novo/actions.ts).
- [x] **C03** — Adicionar `auth.getUser()` + ownership check em `updateEvento` (agenda/[id]/editar/page.tsx).
- [x] **C04** — Mover todas as mutacoes client-side para Server Actions com verificacao de role.
- [x] **C06** — Trocar `Math.random()` por `crypto.randomUUID()` no token de invite. Remover console.log do token.
- [x] **H06** — Adicionar role check em `cadastrarAluno` (alunos/novo/actions.ts).
- [x] **H07** — Adicionar role/ownership check em `atualizarAluno` (alunos/novo/actions.ts).
- [x] **H10** — Implementar security headers (CSP, HSTS, XFO) em `next.config.mjs`.
- [x] **H09** — Criar rota `/auth/callback/route.ts` para confirmacao de email.
- [x] **H02** — Separar JWT secret do responsavel do `SUPABASE_JWT_SECRET` (usa `RESPONSAVEL_JWT_SECRET`).
- [x] **H05** — Corrigir enumeracao de usuarios no login (busca unificada por email + CPF na mesma query).
- [x] **H08** — Implementar validacao com Zod no formulario de alunos (`lib/schemas/aluno.ts`).
- [x] **M08** — Substituir `!` por validacao explicita de env vars (`lib/supabase/server.ts`, `campos-obrigatorios/page.tsx`).
- [x] **M02** — Gerar numero de matricula com `crypto.randomUUID()` em vez de `Math.random()`.
- [x] **M07** — Usar `createClient()` em vez de `createBrowserClient` direto (9 arquivos).
- [x] **M01** — Usar `secure: true` sempre no cookie do responsavel.
- [x] **M04** — Remover `typescript.ignoreBuildErrors` e corrigir todos os 25 erros TS.
- [x] **M06** — Verificar e confirmar: sem dependencias ou arquivos Svelte/Vue/Vite no projeto.
- [x] **M03** — Remover `console.log` de dados sensiveis (formData, IDs de usuario, presencas).
- [x] **M09** — Validar tamanho/caracteres do parametro de busca em 5 paginas.
- [x] **M05** — Pin versoes de todas as dependencias para versoes exatas (remove `^`).
- [x] **L04** — Habilitar otimizacao de imagens (`unoptimized: false`, `remotePatterns` para Supabase).
- [x] **L03** — Aumentar `minimum_password_length` para 8 com `password_requirements`.
- [x] **L01** — Converter logout para Server Action via POST com confirmacao.
- [x] **L02** — Adicionar role check em 3 paginas de visualizacao (alunos/professores/matriculas/[id]).

## Vulnerabilidades Restantes (5)

### Criticas (2)

- [ ] **C01** — Rotacionar secrets expostos. *Requer acesso manual ao dashboard Supabase.*
- [ ] **C05** — Substituir `createAdminClient()` por client com RLS. *Requer RLS policies + secret separado.*

### Altas (3)

- [ ] **H03** — Revogacao de sessao (blocklist). *Requer tabela no banco ou Redis.*
- [ ] **H04** — Validacao JWT no middleware. *Requer refatoracao do middleware.*
- [ ] **H01** — Rate limiting nos endpoints de auth. *Requer Upstash ou banco.*
