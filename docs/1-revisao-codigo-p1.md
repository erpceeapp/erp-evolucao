# Revisao de Codigo - Parte 1

Analise completa do projeto em busca de codigo nao usado, funcoes repetidas, componentes duplicados e padroes inconsistentes.

---

## 1. Arquivos Nao Usados (7 componentes, 2 libs)

### Componentes nunca importados

| Arquivo | Motivo |
|---------|--------|
| `components/theme-provider.tsx` | Nunca importado por nenhum arquivo |
| `components/layout/sidebar.tsx` | Substituido por `components/app-sidebar.tsx` |
| `components/presenca/registrar-presenca-form.tsx` | Nunca importado |
| `components/dashboard/dashboard-stats.tsx` | Placeholder vazio — renderiza `<div>` com comentario `{/* Stats cards would go here */}` |
| `components/dashboard/matriculas-chart.tsx` | Nunca importado |
| `components/migration/conflict-strategy-dialog.tsx` | Nunca importado |

### Libs nunca importadas

| Arquivo | Motivo |
|---------|--------|
| `lib/formatters.ts` | 19 funcoes (formatCPF, formatDateBR, calcularIdade, etc.) — nenhuma importada |
| `lib/cache-helpers.ts` | 6 funcoes de cache (`getCachedDisciplinas`, etc.) — nenhuma importada. `revalidateCaches()` tem corpo inteiramente comentado |

### Types subutilizados

`types/entities.ts` — 14 de 16 interfaces exportadas nunca sao importadas:
`Aluno`, `Professor`, `Turma`, `Disciplina`, `Matricula`, `Nota`, `Presenca`, `Aula`, `PeriodoLetivo`, `Profile`, `ConfigCamposObrigatorios`, `LinksDocumentos`, `GradeHorario`, `Escola`

Apenas `TurmaDisciplinaInfo` e `GradeSlot` sao usadas.

---

## 2. Tres Server Actions de Delete Identicas

`app/(authenticated)/turmas/actions.ts`, `disciplinas/actions.ts`, `alunos/actions.ts`

Bloco de ~32 linhas identico em cada, diferindo apenas no nome da entidade:

```typescript
"use server"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function delete{Entity}({entity}Id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Usuario nao autenticado" }
  const { data: profile } = await supabase
    .from("profiles").select("tipo_usuario").eq("id", user.id).single()
  if (!profile || !["admin", "diretor"].includes(profile.tipo_usuario))
    return { error: "Apenas administradores e diretores podem excluir" }
  const { error } = await supabase.from("{entities}").delete().eq("id", {entity}Id)
  if (error) return { error: error.message }
  revalidatePath("/{entities}")
  return { success: true }
}
```

**Sugestao:** Extrair para uma funcao generica `deleteEntity()`.

---

## 3. Padrao de Auth Repetido 15+ Vezes

O mesmo bloco de 5-6 linhas aparece em TODAS as server actions e em varias list pages:

```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return { error: "..." }
const { data: profile } = await supabase
  .from("profiles").select("tipo_usuario").eq("id", user.id).single()
if (!profile || !["admin", "diretor"].includes(profile.tipo_usuario))
  return { error: "..." }
```

**Presente em:** `turmas/actions`, `disciplinas/actions`, `alunos/actions`, `professores/novo/actions` (2x), `alunos/novo/actions` (2x), `escola/actions`, `presenca/actions`, `agenda/actions` (3x), `agenda-aluno/actions` (2x), `grade-horarios/actions` (2x), `usuarios/actions`, e nas pages `{alunos,professores,turmas,disciplinas,matriculas,usuarios}/page.tsx`.

**Sugestao:** Criar helper `requireRole(...roles)`.

### Arrays de role definidos inconsistentemente

Cada arquivo define sua propria lista de roles permitidas de forma diferente:

| Arquivo | Roles permitidas |
|---------|-----------------|
| `turmas/actions.ts` | `["admin", "diretor"]` |
| `disciplinas/actions.ts` | `["admin", "diretor"]` |
| `alunos/actions.ts` | `["admin", "diretor"]` |
| `professores/novo/actions.ts` | `["admin", "diretor"]` |
| `alunos/novo/actions.ts` | `["admin", "secretaria", "diretor"]` |
| `escola/actions.ts` | `["admin", "coordenacao", "secretaria", "diretor"]` |
| `presenca/actions.ts` | `["admin", "diretor", "coordenacao", "professor"]` |
| `agenda/actions.ts` | Bloqueia apenas `professor` |
| `grade-horarios/actions.ts` | `["admin", "diretor", "coordenacao", "secretaria"]` |
| `agenda-aluno/actions.ts` | `["admin", "diretor", "coordenacao", "secretaria", "professor"]` |

**Sugestao:** Centralizar em constantes como `ROLES.ADMIN`, `ROLES.SECRETARIA`, etc.

---

## 4. 18 Loading Files Identicos

Todos contem apenas:

```tsx
export default function Loading() {
  return null
}
```

**Arquivos:**
`disciplinas/loading`, `alunos/loading`, `notas/loading`, `diario/loading`, `presenca/loading`, `notas/[turmaId]/[disciplinaId]/loading`, `notas/aluno/[alunoId]/loading`, `relatorios/loading`, `relatorios/{alunos,professores,turmas,matriculas,notas,frequencia}/loading`, `agenda-aluno/loading`, `agenda-aluno/[alunoId]/loading`, `agenda/novo-evento/loading`, `agenda/[id]/editar/loading`.

---

## 5. Dois Sistemas de Toast Coexistindo

| Sistema | Uso |
|---------|-----|
| **Sonner** (`toast` de `sonner`) | ~30 arquivos — padrao do projeto |
| **Shadcn** (`useToast` de `@/hooks/use-toast`) | `export-aluno-pdf-button.tsx`, `links-documentos-manager.tsx`, `presenca/[turmaId]/[disciplinaId]/page.tsx` (1 dos 3 e de arquivo nao usado) |

**Sugestao:** Migrar os 3 callers do shadcn toast para sonner e remover `components/ui/toast.tsx` + `hooks/use-toast.ts`.

---

## 6. Tabelas com Filtro/Paginacao Repetidas

6 tabelas implementam o mesmo padrao de `handleSearch`, `handleClearFilters`, `handlePageChange` com `URLSearchParams`:

`alunos-table`, `professores-table`, `turmas-table`, `disciplinas-table`, `matriculas-table`, `usuarios-table`

**Trecho identico:**
```typescript
const handleSearch = () => {
  const params = new URLSearchParams(searchParams)
  if (searchTerm) params.set("busca", searchTerm)
  else params.delete("busca")
  params.set("page", "1")
  router.push(`/{entity}?${params.toString()}`)
}
```

**Sugestao:** Extrair hook `useTableFilters`.

---

## 7. AlertDialog de Delete Repetido

4 tabelas tem o mesmo AlertDialog inline (~20 linhas), diferindo apenas no nome da entidade e texto de alerta:

`alunos-table`, `professores-table`, `disciplinas-table`, `turmas-table`

Apenas `components/matriculas/delete-matricula-button.tsx` foi extraido como componente autonomo, mas usado uma unica vez.

---

## 8. Tres Formas de Confirmar Exclusao

| Metodo | Onde |
|--------|------|
| AlertDialog inline | 4 tabelas (padrao do projeto) |
| `confirm()` nativa | `gerenciar-alunos-turma.tsx`, `gerenciar-disciplinas-turma.tsx`, `links-documentos-manager.tsx`, `matriculas-table.tsx` |
| Componente extraido | `delete-matricula-button.tsx` (usado 1x) |

**Sugestao:** Criar componente `<ConfirmDeleteDialog>` reutilizavel e substituir todos os `confirm()`.

---

## 9. Inconsistencia no translateError

8 arquivos de action usam `translateError()` para mensagens de erro, 7 retornam `error.message` diretamente.

**Usam translateError:**
`usuarios/actions`, `grade-horarios/actions`, `agenda/actions`, `presenca/actions`, `alunos/novo/actions`

**Nao usam (retornam raw error.message):**
`escola/actions`, `turmas/actions`, `disciplinas/actions`, `alunos/actions`, `professores/novo/actions`, `agenda-aluno/actions`, `diario/*/actions`

---

## 10. PageHeader com Export Duplo

`components/page-header.tsx` exporta tanto como `export function PageHeader` quanto `export default PageHeader`.

- 42 paginas importam como `import { PageHeader } from "@/components/page-header"`
- 9 paginas importam como `import PageHeader from "@/components/page-header"`

**Sugestao:** Padronizar para named export apenas.

---

## 11. Componentes em Sobreposicao

| Grupo | Arquivos | Observacao |
|-------|----------|------------|
| Sidebar | `app-sidebar.tsx` (usado) vs `layout/sidebar.tsx` (nao usado) | Remover o nao usado |
| Nova aula | `nova-aula-form.tsx` vs `nova-aula-form-v2.tsx` | 90% identicos, poderiam ser unificados |
| Agenda calendar | `agenda-calendar.tsx` (responsavel) vs `agenda-rbc.tsx` (authenticated) | Setup identico (localizer, messages, eventPropGetter) |
| Dashboard stats | `dashboard-stats.tsx` (nao usado) vs `stats-cards.tsx` (usado) | Remover o nao usado |

---

## 12. Componente em Diretorio Errado

`app/(authenticated)/diario/diario-turmas-view.tsx` — componente reutilizavel com hooks e props, deveria estar em `components/diario/`.

---

## 13. Dialogos Inline em usuarios-table

`usuarios-table.tsx` define `DeleteUserDialog` (~50 linhas) e `EditUserDialog` (~60 linhas) internamente. Deveriam ser arquivos separados.

---

## Prioridade de Acao

| Prioridade | Item | Impacto |
|------------|------|---------|
| Alta | Remover 6 arquivos nao usados | - | 
| Alta | Unificar 3 delete actions identicas | Elimina 60 linhas duplicadas |
| Alta | Criar `requireRole()` helper | Elimina ~100 linhas repetidas |
| Media | Unificar loading files | 18 arquivos -> 1 |
| Media | Migrar shadcn toast para sonner | Remove dependencia nao usada |
| Media | Criar `<ConfirmDeleteDialog>` | Padroniza UX de exclusao |
| Media | Centralizar constantes de role | Evita inconsistencia |
| Baixa | Extrair `useTableFilters` hook | ~30 linhas/tabela -> 1 hook |
| Baixa | Unificar `nova-aula-form` | Elimina duplicacao |
| Baixa | Padronizar `PageHeader` import | Consistencia |
