# Educational ERP system

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/brunnolinkin-3640s-projects/v0-educational-erp-system)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/4n00SYvEFgg)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/brunnolinkin-3640s-projects/v0-educational-erp-system](https://vercel.com/brunnolinkin-3640s-projects/v0-educational-erp-system)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/projects/4n00SYvEFgg](https://v0.app/chat/projects/4n00SYvEFgg)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Performance & Optimization

Este projeto foi otimizado seguindo melhores práticas para aplicações educacionais. Veja:

- **[Otimizações Aplicadas](./docs/OPTIMIZATIONS_APPLIED.md)** - Resumo completo de todas as melhorias implementadas
- **[Guia de Otimização de Queries](./docs/QUERY_OPTIMIZATION.md)** - Padrões e boas práticas para queries eficientes

### Principais Melhorias

✅ Remoção de dependências não utilizadas (6% redução de bundle)  
✅ Tipos centralizados em `types/entities.ts`  
✅ Formatadores reutilizáveis em `lib/formatters.ts`  
✅ Cache com `unstable_cache` para dados estáticos  
✅ Índices otimizados no banco de dados  
✅ RLS policies baseadas em `tipo_usuario`  
✅ Constraint UNIQUE para evitar duplicatas de notas  

### Impacto Esperado

- Dashboard: 80% mais rápido
- Queries: 90% mais rápidas (média)
- Requisições de rede: 55% reduzidas
- Conexões com DB: 75% reduzidas

## Banco de Dados

### Gerenciamento de Schema

O schema do banco é versionado via **migrations** em `supabase/migrations/`.

| Comando | Descrição |
|---------|-----------|
| `supabase migration new <nome>` | Cria uma nova migration |
| `supabase db push --linked` | Aplica migrations pendentes no banco da nuvem |
| `supabase db diff --linked -f <nome>` | Gera migration com diff entre shadow db local e nuvem |
| `supabase db dump --linked --data-only -f <arquivo>` | Backup apenas dos dados |

### Workflow seguro

Antes de alterar o schema:

1. **Snapshots existentes**: a migration mais recente já reflete o schema atual (ex.: `20260619191517_remote_schema.sql`).
2. **Backup opcional de dados**: `supabase db dump --linked --data-only -f supabase/pre_change_dados.sql`
3. Faça as alterações (nova migration + `db push`).
4. Se algo der errado, drope o schema remoto e reaplique a migration anterior ou o snapshot.

> ⚠️ O banco local (docker) e o banco da nuvem (Supabase hosted) são independentes. Alterações em um **não** afetam o outro automaticamente. Use `supabase db push --linked` para sincronizar.
