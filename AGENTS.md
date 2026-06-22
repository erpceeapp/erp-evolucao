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

## Commit protocol

**Every single commit requires explicit user authorization. No exceptions.**

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
