# AGENTS.md — Guidelines for AI Agents

## Ground Rule

**No command shall be executed without explicit user permission.**

Before running any command — be it `pnpm`, `npx`, `git`, `docker`, `supabase`, or any other — the agent must:

1. Explain what it intends to run and why
2. Wait for the user's confirmation before proceeding
3. Only execute after receiving authorization

## Mandatory Checklist (fail if any item is "no")

1. **Is the command read-only** (ls, cat, grep, Select-String, dir, read, glob)?
   - YES → may execute without permission
   - NO → go to step 2

2. **Have you explained the command and waited for the user's response?**
   - NO → stop and explain what you want to run and why
   - YES → only execute after explicit confirmation

3. **Did the user respond "yes" or explicitly authorize it?**
   - NO → do not execute
   - YES → execute

### Exceptions

- Read-only commands (e.g.: `ls`, `cat`, `grep`, `Select-String`) do not need permission
- Any command that **creates, alters, or removes** resources (files, containers, data) **requires permission**

## Decision Ladder (adapted Ponytail)

Before writing any code, go through the steps in order, stopping at the first one that applies:

1. **Does this need to exist?** → If not, confirm before writing. (YAGNI)
2. **Does it already exist in code?** → Reuse. Don't rewrite.
3. **Does the standard library/framework do it?** → Use it. (Zod, Shadcn, Supabase filters, etc.)
4. **Does an already installed dependency solve it?** → Use it before installing a new one.
5. **Can it be done in one line?** → Do it in one line.
6. **Only then:** the minimum that works.

**Project-specific caveats (don't cut):**

- `space-y-6`, `space-y-2`, `truncate`, `overflow-hidden` — defined UI standard, keep
- Zod schemas with `transform` — mandatory for type safety
- Explicit typing in component props — mandatory (strict TypeScript project)
- Edge case handling (loading, empty, error) — mandatory in ERP
- No emojis in any output or file content — plain text only
- **Never edit existing migration files** — the database is in production and cannot be reset. Always create a new migration (`.sql` in `supabase/migrations/`) for any schema/function/policy change.

## Commit protocol

**Every single commit requires explicit user authorization. No exceptions.**

**Only warn the user about commits when there are more than 50 changed files.**

Given the identified project modifications (git status):

1. Analyze all changes.
2. List all changes by scope (front, back, infrastructure, architecture, etc.).
3. Present the user with file batches along with commit messages for each batch, following semantic commit conventions.
    - Each batch must contain: **batch number**, **commit message** (Portuguese, semantic format), and **list of files**.
    - Format example:

      ```text
      **Batch 1 — `feat: criar tabela de pacientes`**
      src/lib/actions/pacientes.ts
      src/app/(dashboard)/pacientes/client.tsx

      **Batch 2 — `fix: corrigir filtro por data`**
      src/app/(dashboard)/agenda/client.tsx
      ```

    - Each batch must depend on the previous batch.
    - When multiple commits are needed, show ALL batches upfront before the first commit.
4. **Wait for user to explicitly approve each batch before committing.**
5. **Only commit the approved batch, then repeat for the next.**
6. After all commits are executed, present a report with all commits made.
7. Ask the user if they want to perform a push action or if you can do it for them.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
