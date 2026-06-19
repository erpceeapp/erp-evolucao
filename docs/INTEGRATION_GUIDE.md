# Guia de Integração - Usando os Novos Helpers

Este guia mostra como integrar os novos helpers e formatadores no seu código existente.

## 1. Importando Types Centralizados

Antes de importar types em todos os arquivos, use a centralização:

\`\`\`typescript
// ❌ Evitar - Definir interface em cada arquivo
interface Aluno {
  id: string
  nome_completo: string
}

// ✅ Fazer - Importar de types/entities.ts
import { Aluno } from '@/types/entities'

// Uso em componentes
export function AlunoCard({ aluno }: { aluno: Aluno }) {
  return <div>{aluno.nome_completo}</div>
}
\`\`\`

## 2. Usando Formatadores

### Exemplo: Formatar CPF e Telefone

\`\`\`typescript
import { formatCPF, formatTelefone, cleanCPF } from '@/lib/formatters'

export function AlunoDetails() {
  const aluno = {
    cpf: '12345678901',
    telefone: '11987654321'
  }

  return (
    <div>
      <p>CPF: {formatCPF(aluno.cpf)}</p> {/* 123.456.789-01 */}
      <p>Telefone: {formatTelefone(aluno.telefone)}</p> {/* (11) 98765-4321 */}
    </div>
  )
}
\`\`\`

### Exemplo: Formatar Datas

\`\`\`typescript
import { formatDateBR, formatDateTime, calcularIdade } from '@/lib/formatters'

export function StudentProfile({ dataNascimento, dataMatricula }: any) {
  return (
    <div>
      <p>Data de Nascimento: {formatDateBR(dataNascimento)}</p> {/* 15/03/2010 */}
      <p>Idade: {calcularIdade(dataNascimento)} anos</p> {/* 14 */}
      <p>Matriculado em: {formatDateTime(dataMatricula)}</p> {/* 15/03/2024 14:30 */}
    </div>
  )
}
\`\`\`

### Exemplo: Formatar Notas

\`\`\`typescript
import { formatNota, converterNotaEscala, isNotaValida } from '@/lib/formatters'

export function NotasTable({ notas }: any) {
  return (
    <table>
      <tbody>
        {notas.map(nota => (
          <tr key={nota.id}>
            <td>{nota.disciplina}</td>
            <td>
              {isNotaValida(nota.valor) ? (
                formatNota(nota.valor) // 7.5
              ) : (
                'Sem nota'
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
\`\`\`

## 3. Usando Cache Helpers

### Exemplo: Carregando Disciplinas

\`\`\`typescript
// ❌ Antes - Query a cada renderização
export async function DisciplinaSelect() {
  const supabase = await createClient()
  const { data: disciplinas } = await supabase
    .from("disciplinas")
    .select("*")
  
  return (
    <select>
      {disciplinas?.map(d => (
        <option key={d.id}>{d.nome}</option>
      ))}
    </select>
  )
}

// ✅ Depois - Com cache
import { getCachedDisciplinas } from '@/lib/cache-helpers'

export async function DisciplinaSelect() {
  const { data: disciplinas } = await getCachedDisciplinas()
  
  // Data é cacheada por 1 hora - muito mais rápido!
  return (
    <select>
      {disciplinas?.map(d => (
        <option key={d.id}>{d.nome}</option>
      ))}
    </select>
  )
}
\`\`\`

### Exemplo: Usando Múltiplos Caches

\`\`\`typescript
import { 
  getCachedTurmas, 
  getCachedDisciplinas,
  getCachedPeriodosLetivos 
} from '@/lib/cache-helpers'

export async function NovasMatriculasForm() {
  // Parallelizar múltiplos caches
  const [turmasRes, disciplinasRes, periodosRes] = await Promise.all([
    getCachedTurmas(),
    getCachedDisciplinas(),
    getCachedPeriodosLetivos()
  ])

  return (
    <form>
      <select>
        {turmasRes.data?.map(t => (
          <option key={t.id}>{t.nome}</option>
        ))}
      </select>
      
      <select>
        {disciplinasRes.data?.map(d => (
          <option key={d.id}>{d.nome}</option>
        ))}
      </select>
      
      <select>
        {periodosRes.data?.map(p => (
          <option key={p.id}>{p.nome}</option>
        ))}
      </select>
    </form>
  )
}
\`\`\`

## 4. Revalidando Cache Após Alterações

\`\`\`typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function criarDisciplina(formData: FormData) {
  const nome = formData.get('nome')
  
  const supabase = await createClient()
  
  // Criar disciplina
  await supabase.from('disciplinas').insert([
    {
      nome,
      ativo: true
    }
  ])
  
  // Revalidar a página para atualizar cache
  revalidatePath('/disciplinas')
}
\`\`\`

## 5. Otimizando Queries Existentes

### Antes - Select com *

\`\`\`typescript
export async function getAlunos() {
  const supabase = await createClient()
  
  // ❌ Transfere TODAS as 60+ colunas
  const { data: alunos } = await supabase
    .from("alunos")
    .select("*")
    .eq("ativo", true)
  
  return alunos
}
\`\`\`

### Depois - Select Específico

\`\`\`typescript
export async function getAlunos() {
  const supabase = await createClient()
  
  // ✅ Transfere apenas o necessário
  const { data: alunos } = await supabase
    .from("alunos")
    .select("id, nome_completo, cpf, email, turma_id")
    .eq("ativo", true)
    .order("nome_completo")
  
  return alunos
}
\`\`\`

### Impacto

- **Antes**: ~50KB por request
- **Depois**: ~5KB por request
- **Economia**: 90% de tráfego reduzido

## 6. Padrão de Server Actions com Validação

\`\`\`typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { formatCPF, cleanCPF } from '@/lib/formatters'
import type { Aluno } from '@/types/entities'

export async function criarAluno(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const nome = formData.get('nome')
  const cpf = cleanCPF(formData.get('cpf') as string)
  const email = formData.get('email')
  
  // Validações
  if (!nome || cpf.length !== 11 || !email) {
    return { success: false, error: 'Dados inválidos' }
  }
  
  try {
    const supabase = await createClient()
    
    // Criar aluno
    const { data, error } = await supabase
      .from('alunos')
      .insert([{
        nome_completo: nome,
        cpf,
        email,
        ativo: true
      }])
      .select('id, nome_completo, cpf, email')
      .single()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    // Revalidar lista de alunos
    revalidatePath('/alunos')
    
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Erro ao criar aluno' }
  }
}
\`\`\`

## 7. Componente com Type-Safety

\`\`\`typescript
import { Aluno } from '@/types/entities'
import { formatCPF, formatDateBR, calcularIdade } from '@/lib/formatters'

interface AlunoCardProps {
  aluno: Aluno
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export function AlunoCard({ aluno, onEdit, onDelete }: AlunoCardProps) {
  return (
    <div className="card p-4">
      <h3 className="font-bold">{aluno.nome_completo}</h3>
      <p className="text-sm text-gray-600">
        CPF: {formatCPF(aluno.cpf)}
      </p>
      <p className="text-sm text-gray-600">
        Idade: {calcularIdade(aluno.data_nascimento)} anos
      </p>
      <p className="text-sm text-gray-600">
        Email: {aluno.email}
      </p>
      
      <div className="mt-4 flex gap-2">
        {onEdit && (
          <button onClick={() => onEdit(aluno.id)}>
            Editar
          </button>
        )}
        {onDelete && (
          <button onClick={() => onDelete(aluno.id)}>
            Deletar
          </button>
        )}
      </div>
    </div>
  )
}
\`\`\`

## 8. Checklist de Migração

Ao migrar código existente para usar os novos helpers:

- [ ] Importar types de `types/entities.ts`
- [ ] Usar formatadores de `lib/formatters.ts`
- [ ] Usar caches de `lib/cache-helpers.ts`
- [ ] Atualizar queries para SELECT específico
- [ ] Adicionar revalidatePath em server actions
- [ ] Testar performance com DevTools
- [ ] Validar tipos com TypeScript

---

## Referências

- [Types Centralizados](../types/entities.ts)
- [Formatadores](../lib/formatters.ts)
- [Cache Helpers](../lib/cache-helpers.ts)
- [Query Optimization Guide](./QUERY_OPTIMIZATION.md)
- [Otimizações Aplicadas](./OPTIMIZATIONS_APPLIED.md)
