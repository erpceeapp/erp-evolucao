# Relatório: Migração para React Big Calendar

## 1. Situação Atual

### 1.1 O que existe hoje

O sistema tem **três contextos de agenda/calendário**:

| Contexto | Tabela | CRUD | Páginas | Usuários |
|---|---|---|---|---|
| **Agenda Escolar** | `eventos` | Completo | `/agenda`, `/agenda/novo-evento`, `/agenda/[id]/editar` | Staff autenticado |
| **Agenda do Aluno** | `avisos_aluno` | Completo | `/agenda-aluno`, `/agenda-aluno/[alunoId]` | Staff autenticado |
| **Portal do Responsável** | `avisos_aluno` (leitura) | Read-only | `/responsavel/agenda` | Responsável (JWT próprio) |

### 1.2 Views implementadas atualmente

| View | Status | Componente |
|---|---|---|
| **Mês** | ✅ Funcional | `AgendaCalendar` (grid manual) |
| **Semana** | ❌ Placeholder (não implementada) | Esqueleto visual vazio |
| **Dia** | ⚠️ Parcial (slots de hora fixos 7h-18h) | Inline na página |
| **Lista** | ✅ Funcional | Abaixo do calendário |

### 1.3 Como o calendário é construído hoje

O componente `AgendaCalendar` em `components/agenda/agenda-calendar.tsx` (~157 linhas) é um grid **feito à mão** com CSS puro:

- Navegação manual (useState para mês/ano)
- Cálculo manual de dias (`firstDayOfMonth`, `daysInMonth`)
- Indicador de eventos: busca linear `eventos.some()` comparando strings
- **Sem drag-and-drop, sem redimensionamento**
- **Sem suporte a eventos multi-dia visuais no grid**
- A view "semana" é apenas um esqueleto visual

### 1.4 Gaps conhecidos no sistema atual

1. **View semanal não funciona** — esqueleto sem eventos
2. **Sem eventos multi-dia** — `data_fim` existe no banco mas não tem representação visual
3. **Sem drag-and-drop** para criar/editar eventos no calendário
4. **Sem eventos recorrentes**
5. **Sem timezone handling**
6. **Botão "Filtros" na UI não faz nada**
7. **View "dia" limitada** — horários fixos 7h-18h, sem rolagem
8. **Data model inconsistente**: duas CHECK constraints conflitantes em `tipo_evento`
9. **Coluna `local` não existe no banco** mas está na interface TypeScript

---

## 2. O que react-big-calendar entrega

| Funcionalidade | rbc | Impacto no sistema |
|---|---|---|
| **Month view** | Nativo, customizável | Substitui `AgendaCalendar` manual |
| **Week view** | Nativo | Preenche o placeholder atual |
| **Day view** | Nativo com scroll | Substitui slots fixos 7h-18h |
| **Agenda/List view** | Nativo | Substitui a lista manual abaixo do calendário |
| **Drag & Drop** | Plugin | Criar/editar eventos arrastando |
| **Multi-day events** | Suporte nativo | `data_fim` ganha representação visual |
| **Event resizing** | Plugin | Redimensionar duração do evento |
| **Tooltip/custom popup** | `components` prop | Adaptável ao design shadcn/ui atual |
| **Localization** | `date-fns` + `moment` | Já temos `date-fns` no projeto |
| **View switching** | Toolbar nativa | Substitui as Tabs shadcn atuais |

### 2.1 Trade-offs

| Prós | Contras |
|---|---|
| Elimina ~500 linhas de grid manual | + ~80kB no bundle (gzip ~25kB) |
| Week view de graça | Tema precisa de adaptação CSS |
| Drag & drop sem implementar do zero | Customização de popups/tooltips é complexa |
| Acessibilidade já inclusa | Responsivo não é nativo (precisa de workaround) |
| Testado em produção (10k+ stars) | Array de eventos precisa de formato específico |
| Suporte a `date-fns` nativamente (v2.x) | v2.x usa `moment` como padrão, v3.x (alpha) é modular |

### 2.2 Compatibilidade

- `react-big-calendar` requer eventos no formato `{ start: Date, end: Date, title: string, ... }`
- Atualmente os eventos têm `data_inicio`/`hora_inicio` (separados) e `data_fim`/`hora_fim`
- **Precisa de adapter** para converter o modelo atual para o formato do rbc
- Data-fns já está no projeto (v4.4.0) — rbc 2.x usa `moment` como locale default, mas suporta `date-fns` via `localizer` customizado ou usando o adapter. Na v3.x (alpha) o date-fns localizer é nativo. Como estamos em Next.js 16, usar a v2.x estável com date-fns adapter é o caminho mais seguro.

---

## 3. Plano de Ação

### Fase 1 — Preparação (não quebra nada)

1. **Instalar dependência**

   ```bash
   pnpm add react-big-calendar @types/react-big-calendar
   ```

   **OU** usar a v3 alpha (React 19):

   ```bash
   pnpm add react-big-calendar@next
   ```

2. **Corrigir inconsistências existentes** (antes de migrar)
   - Remover CHECK constraint conflitante em `tipo_evento`
   - Adicionar coluna `local` se fizer sentido, ou remover da interface
   - Decidir se `turma_id` e `professor_id` terão UI no formulário ou serão removidos do state

### Fase 2 — Adapter de dados

1. **Criar função de conversão `eventoToRbcEvent(evento): RbcEvent`**
   - Mapear `data_inicio + hora_inicio` → `start: Date`
   - Mapear `data_fim + hora_fim` → `end: Date`
   - Incluir metadados (tipo_evento, id, etc) em `resource` ou campo custom
   - Tratar eventos sem hora como "all day"

2. **Criar função reversa `rbcEventToEvento(rbcEvent): Partial<Evento>`**
   - Para quando o usuário criar/editar via drag no calendário
   - Extrair data e hora separadas para o banco

### Fase 3 — Substituir views na Agenda Escolar (`/agenda`)

1. **Substituir `AgendaCalendar` + tabs por `Calendar` do rbc**
   - Remover ~200 linhas de grid manual + tabs
   - Configurar `views={['month', 'week', 'day', 'agenda']}`
   - Customizar toolbar (cor cyan do sistema, português)
   - Configurar `localizer={dateFnsLocalizer}` com locale `ptBR`

2. **Customizar aparência dos eventos**
   - Usar a prop `eventPropGetter` para colorir pelo `tipo_evento` (aula=azul, prova=vermelho, etc)
   - Usar `components={{ event: EventComponent, toolbar: ToolbarComponent }}` para manter identidade visual

3. **Implementar drag & drop**
   - Envolver Calendar com `DragAndDropCalendar`
   - `onEventDrop` → atualizar data do evento no banco
   - `onEventResize` → atualizar duração

4. **Popups de detalhes**
   - Customizar `components={{ event: MyEvent }}` para abrir o Dialog shadcn atual
   - Ou usar a prop `popup` e `components={{ eventWrapper }}`

### Fase 4 — Substituir nas agendas de aluno e responsável

1. **Agenda do Aluno (`/agenda-aluno/[alunoId]`)**
   - Mesmo adapter, mesma lógica
   - Manter modal de criação/edição inline (já existe)
   - O click no dia do rbc pode abrir o modal (como hoje)

2. **Portal do Responsável (`/responsavel/agenda`)**
    - Mesmo adapter (read-only)
    - Desabilitar drag & drop via prop `draggableAccessor={() => false}`
    - Se necessário, remover toolbar de criação (ou esconder visualmente)

### Fase 5 — Remover código legado

1. **Remover `AgendaCalendar`** (componente manual)
2. **Remover view "semana" esqueleto** (substituída pelo rbc)
3. **Remover view "dia" inline** (substituída pelo rbc)
4. **Avaliar se `react-day-picker` ainda é necessário** (pode ser removido de `package.json` se não usado em nenhum outro lugar)

---

## 4. Riscos e Considerações

| Risco | Mitigação |
|---|---|
| **Responsividade** — rbc não é mobile-first nativamente | Envolver com wrapper responsivo, esconder toolbar em mobile, usar `view` state para forçar `day` em telas pequenas |
| **Bundle size** — rbc adiciona ~25kB gzipped | Aceitável para uma página de calendário; fazer lazy loading com `next/dynamic` |
| **CSS conflitante** — rbc usa seus próprios estilos | Importar `react-big-calendar/lib/css/react-big-calendar.css` e sobrescrever variáveis com Tailwind |
| **Server Components** — rbc é client-only | Envolver em `"use client"` (já é o caso de `agenda/page.tsx`) |
| **Locale pt-BR** — meses/dias em português | Já temos `date-fns` com locale pt-BR; o adapter cobre isso |
| **Eventos multi-dia sem hora** — podem quebrar visual | Tratar como `allDay: true` no rbc |
| **Eventos sem data_fim** — rbc exige `end` | Usar `data_inicio` como `end` quando `data_fim` for nulo, ou somar 1 hora |
| **Responsável usa RPCs SECURITY DEFINER** — adapter precisa funcionar com dados de RPC também | O adapter é puro JavaScript, independe da fonte dos dados |

---

## 5. Conclusão

**Recomendação: Sim, vale a migração.**

O sistema atual tem um calendário funcional mas limitado: view semanal não implementada, sem drag-and-drop, sem multi-day visual, e com ~500 linhas de grid manual que o rbc substituiria por uma config de ~50 linhas. O rbc é maduro (v2.x estável, 12k+ stars) e atende todos os requisitos que hoje precisam ser construídos do zero.

O custo principal não é técnico, mas sim o **design integration**: o rbc tem seu próprio ecossistema CSS que precisa ser adaptado ao tema cyan/shadcn. Isso é factível com `component overrides` e sobrescrita de variáveis.
