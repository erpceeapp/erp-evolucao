# Guia de Boas Práticas - Mantendo as Otimizações

Este documento fornece guidelines para manter e expandir as otimizações implementadas.

## 1. Ao Criar Nova Query

### Checklist

```
[ ] Especificar campos em SELECT (nunca usar *)
[ ] Adicionar índice se filtrar por novo campo
[ ] Paralelizar com Promise.all() se múltiplas queries
[ ] Adicionar cache se dados mudam pouco
[ ] Testar performance com DevTools
```

### Template de Query Otimizada

```typescript
// ✅ BOM - Otimizado
export async function getAlunosByTurma(turmaId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("alunos")
    .select("id, nome_completo, cpf, email") // Específico
    .eq("turma_id", turmaId)
    .eq("ativo", true)
    .order("nome_completo")
    .limit(100)
  
  return { data, error }
}
```

## 2. Ao Adicionar Novo Campo Buscável

### Checklist

```
[ ] Campo vai ser filtrado/buscado frequentemente?
  [ ] SIM → Adicionar índice B-tree
  [ ] NÃO → Pular

[ ] Campo será filtrado com igualdade e status?
  [ ] SIM → Adicionar índice Partial (WHERE campo = valor)
  [ ] NÃO → Pular

[ ] Campo será combinado com outro em WHERE/JOIN?
  [ ] SIM → Considerar índice composto
  [ ] NÃO → Pular
```

### Script de Índice

```sql
-- Para campo simples
CREATE INDEX IF NOT EXISTS idx_tabela_campo ON tabela(campo);

-- Para campo de status (partial)
CREATE INDEX IF NOT EXISTS idx_tabela_status ON tabela(status) 
WHERE status = 'ativa';

-- Para múltiplos campos (composto)
CREATE INDEX IF NOT EXISTS idx_tabela_campo1_campo2 
ON tabela(campo1, campo2);
```

## 3. Ao Criar Novo Tipo/Interface

### Checklist

```
[ ] Tipo é reutilizado em múltiplos arquivos?
  [ ] SIM → Adicionar em types/entities.ts
  [ ] NÃO → OK deixar local

[ ] Tipo representa uma entidade do BD?
  [ ] SIM → Adicionar em types/entities.ts
  [ ] NÃO → OK deixar local
```

### Template

```typescript
// Em types/entities.ts
export interface NovaEntidade {
  id: string
  campo_obrigatorio: string
  campo_opcional?: string | null
  data_criacao: string
  data_atualizacao: string
}
```

## 4. Ao Usar Dados Repetitivos

### Checklist

```
[ ] Estes dados mudam frequentemente (a cada minuto)?
  [ ] SIM → Não cache, query normal
  [ ] NÃO → Continuar

[ ] Estes dados mudam ocasionalmente (horas/dias)?
  [ ] SIM → Usar unstable_cache com TTL apropriado
  [ ] NÃO → Continuar

[ ] Estes dados quase nunca mudam?
  [ ] SIM → Usar unstable_cache com TTL longo (24h)
```

### Implementar Cache

```typescript
// Em lib/cache-helpers.ts
export const getCachedMinhaEntidade = unstable_cache(
  async () => {
    const supabase = await createClient()
    return supabase
      .from("minha_tabela")
      .select("id, nome")
      .eq("ativo", true)
  },
  ["minha-entidade"],
  { 
    revalidate: 3600, // 1 hora
    tags: ["minha-entidade"] 
  }
)

// Usar no componente
import { getCachedMinhaEntidade } from '@/lib/cache-helpers'

export async function MeuComponente() {
  const { data } = await getCachedMinhaEntidade()
  return <div>{/* ... */}</div>
}
```

## 5. Ao Formatar Dados

### Checklist

```
[ ] Preciso formatar CPF/Telefone/CEP?
  [ ] SIM → Importar de lib/formatters.ts
  [ ] NÃO → Continuar

[ ] Preciso formatar Data/Hora?
  [ ] SIM → Importar de lib/formatters.ts
  [ ] NÃO → Continuar

[ ] Preciso validar Nota/Idade?
  [ ] SIM → Importar de lib/formatters.ts
```

### Usando Formatadores

```typescript
import { 
  formatCPF, 
  formatDateBR, 
  formatNota,
  calcularIdade 
} from '@/lib/formatters'

export function StudentCard({ aluno }: { aluno: Aluno }) {
  return (
    <div>
      <p>CPF: {formatCPF(aluno.cpf)}</p>
      <p>Data Nasc: {formatDateBR(aluno.data_nascimento)}</p>
      <p>Idade: {calcularIdade(aluno.data_nascimento)}</p>
    </div>
  )
}
```

## 6. Após Criar/Editar Dados

### Checklist

```
[ ] Usuário criou/editou novo registro?
  [ ] SIM → Revalidar a página/componente
  [ ] NÃO → Pular

[ ] O registro afeta componentes em cache?
  [ ] SIM → Revalidar cache também
  [ ] NÃO → OK
```

### Revalidar Cache

```typescript
'use server'

import { revalidatePath } from 'next/cache'

export async function criarAluno(formData: FormData) {
  const supabase = await createClient()
  
  // ... criar aluno ...
  
  // Revalidar página inteira
  revalidatePath('/alunos')
}
```

## 7. Monitorando Performance

### Verificações Diárias

```
[ ] Dashboard carrega em < 1s?
[ ] Pagina de alunos carrega em < 2s?
[ ] Buscas retornam em < 500ms?
[ ] Nenhum console.error de queries?
```

### Verificações Semanais

```
[ ] Verificar índices não utilizados em Supabase
[ ] Revisar slow queries no Supabase > Performance
[ ] Verificar cache hit rate
[ ] Revisar logs de erro
```

### Verificações Mensais

```
[ ] Analisar tendências de performance
[ ] Revisar ROI de otimizações
[ ] Planejar próximas otimizações
[ ] Atualizar documentação se necessário
```

## 8. Red Flags - Sinais de Performance Ruim

### Vermelhos Críticos

🔴 **Query > 1 segundo**
- Verificar em Supabase > Performance
- Adicionar índice para campos no WHERE
- Reducir SELECT para campos necessários

🔴 **20+ requisições por página**
- Parallelizar com Promise.all()
- Implementar cache
- Considerar GraphQL ou RPC

🔴 **Bundle > 10MB**
- Verificar dependências não utilizadas
- Usar code splitting
- Remover bibliotecas obsoletas

### Amarelos - Monitorar

🟡 **Query entre 500ms-1s**
- Indicativo de índice faltando
- Verificar query plan
- Considerar cache

🟡 **5+ requisições sequenciais**
- Parallelizar com Promise.all()
- Implementar cache
- Considerar batch

## 9. Adicionando Nova Métrica

### Monitoramento com Web Vitals

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

export function initWebVitals() {
  getCLS(console.log)
  getFID(console.log)
  getFCP(console.log)
  getLCP(console.log)
  getTTFB(console.log)
}
```

### Sentry para Erros

```typescript
import * as Sentry from '@sentry/nextjs'

// Em layout.tsx
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
})
```

## 10. Roadmap de Manutenção

### Primeira Semana
- [ ] Verificar performance inicial
- [ ] Validar que tudo funciona
- [ ] Treinar time sobre novas ferramentas

### Primeiro Mês
- [ ] Implementar queries otimizadas em componentes principais
- [ ] Monitorar e ajustar caches
- [ ] Coletar feedback do time

### Primeiro Trimestre
- [ ] Integrar Sentry
- [ ] Ativar analytics
- [ ] Planejar próximas otimizações

---

## 📚 Referências Rápidas

### Importações Comuns

```typescript
// Types
import type { Aluno, Professor, Turma } from '@/types/entities'

// Formatadores
import { formatCPF, formatDateBR, formatNota } from '@/lib/formatters'

// Cache
import { getCachedDisciplinas, getCachedTurmas } from '@/lib/cache-helpers'

// Revalidate
import { revalidatePath } from 'next/cache'

// Supabase
import { createClient } from '@/lib/supabase/server'
```

### Padrões Comuns

```typescript
// Query otimizada
const { data } = await supabase
  .from("tabela")
  .select("id, campo1, campo2")
  .eq("status", "ativa")
  .order("criado", { ascending: false })
  .limit(10)

// Múltiplas queries
const [res1, res2] = await Promise.all([
  query1(),
  query2()
])

// Com cache
const { data } = await getCachedEntidade()

// Revalidar após criar
revalidatePath('/pagina')
```

---

**Versão**: v1.0  
**Última Atualização**: 2024-04-22  
**Próxima Revisão**: 2024-05-22

---

**Dúvidas? Veja a documentação completa em [docs/INDEX.md](./INDEX.md)**
