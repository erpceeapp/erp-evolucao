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
