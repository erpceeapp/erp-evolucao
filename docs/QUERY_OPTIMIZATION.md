# Query Optimization Guide

## Princípios Fundamentais

### 1. SELECT com Campos Específicos
**❌ RUIM - Transfere dados desnecessários**
\`\`\`typescript
const { data: alunos } = await supabase
  .from("alunos")
  .select("*")
\`\`\`

**✅ BOM - Especifica apenas campos necessários**
\`\`\`typescript
const { data: alunos } = await supabase
  .from("alunos")
  .select("id, nome_completo, cpf, email")
\`\`\`

### 2. Filtros no Banco de Dados
**❌ RUIM - Filtra no client-side**
\`\`\`typescript
const { data: todos } = await supabase.from("alunos").select("*")
const ativos = todos.filter(a => a.ativo === true)
\`\`\`

**✅ BOM - Filtra no servidor**
\`\`\`typescript
const { data: alunos } = await supabase
  .from("alunos")
  .select("id, nome_completo, email")
  .eq("ativo", true)
\`\`\`

### 3. Paginação
**❌ RUIM - Busca tudo**
\`\`\`typescript
const { data: alunos } = await supabase
  .from("alunos")
  .select("*")
\`\`\`

**✅ BOM - Pagina resultado**
\`\`\`typescript
const page = 1
const pageSize = 20
const { data: alunos } = await supabase
  .from("alunos")
  .select("id, nome_completo, email")
  .range((page - 1) * pageSize, page * pageSize - 1)
\`\`\`

### 4. Busca de Texto
**❌ RUIM - Busca aproximada (lenta)**
\`\`\`typescript
.like("nome_completo", "%maria%")
\`\`\`

**✅ BOM - Busca com ILIKE (case-insensitive) ou índice full-text**
\`\`\`typescript
.ilike("nome_completo", "%maria%") // Melhor com índice
\`\`\`

### 5. Joins Desnecessários
**❌ RUIM - Join que não precisa**
\`\`\`typescript
.select("alunos(id, nome), turmas(*), matriculas(*)")
\`\`\`

**✅ BOM - Seleciona apenas o necessário**
\`\`\`typescript
.select("id, nome_completo, turma_id") // Se só precisa do ID, não join
\`\`\`

### 6. Múltiplas Queries
**❌ RUIM - Queries sequenciais**
\`\`\`typescript
const { data: turma } = await supabase.from("turmas").select("*").eq("id", id)
const { data: alunos } = await supabase.from("alunos").select("*").eq("turma_id", id)
\`\`\`

**✅ BOM - Promise.all para parallelizar**
\`\`\`typescript
const [turmaRes, alunosRes] = await Promise.all([
  supabase.from("turmas").select("id, nome").eq("id", id),
  supabase.from("alunos").select("id, nome_completo").eq("turma_id", id)
])
\`\`\`

## Índices Criados

Esses índices foram criados para otimizar queries comuns:

| Campo | Tabela | Tipo | Uso |
|-------|--------|------|-----|
| nome_completo | alunos | B-tree | Buscas por nome |
| cpf | alunos, professores | B-tree | Validação e busca |
| email | alunos, professores | B-tree | Login e busca |
| email_responsavel | alunos | B-tree | Login de responsáveis |
| status | matriculas | Partial | Buscar matrículas ativas |
| bimestre | notas | B-tree | Notas por período |
| matricula_id, bimestre | notas | Composite | Notas de um aluno |
| ativo | turmas, disciplinas | Partial | Listar ativos |

## Caching com unstable_cache

O caching deve ser implementado para dados que mudam pouco:

\`\`\`typescript
import { unstable_cache } from 'next/cache'

// Cache dados por 1 hora (3600 segundos)
const getDisciplinas = unstable_cache(
  async () => {
    const supabase = await createClient()
    return supabase
      .from("disciplinas")
      .select("id, nome")
      .eq("ativo", true)
  },
  ['disciplinas-ativas'],
  { revalidate: 3600 }
)

// Usar no componente
const disciplinas = await getDisciplinas()
\`\`\`

## Revalidação de Cache

Após criar/editar dados, revalidar o cache:

\`\`\`typescript
'use server'

import { revalidatePath } from 'next/cache'

export async function criarDisciplina(nome: string) {
  // ... criar disciplina
  
  // Invalidar cache
  revalidatePath('/disciplinas')
}
\`\`\`

## Monitoramento

Para identificar queries lentas no Supabase Dashboard:
1. Acessar projeto Supabase
2. Ir em "SQL Editor" → "Performance"
3. Verificar queries lentas
4. Adicionar índices conforme necessário

## Regras de Ouro

1. ✅ Sempre especifique campos em `.select()`
2. ✅ Use filtros no servidor, não no client
3. ✅ Paralelize múltiplas queries com `Promise.all()`
4. ✅ Implemente paginação para listagens grandes
5. ✅ Use cache para dados que mudam pouco
6. ✅ Crie índices para campos em WHERE/JOIN
7. ❌ Nunca use `select("*")` em produção
8. ❌ Nunca busque tudo e filtre no client
9. ❌ Não faça queries sequenciais quando puder paralelizar
10. ❌ Não cache dados que mudam frequentemente
