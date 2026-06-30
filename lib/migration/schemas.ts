import { z } from "zod"

export const ExportUsuarioJsonSchema = z.object({
  id: z.string(),
  auth_user_id: z.string(),
  nome_completo: z.string(),
  email: z.string(),
  telefone: z.string().nullable().optional(),
  tipo_usuario: z.string(),
  ativo: z.boolean(),
  primeira_senha: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  _auth: z.object({
    email: z.string(),
    senha_temporaria: z.string(),
  }),
})

export const ExportDisciplinaJsonSchema = z.object({
  id: z.string(),
  nome: z.string(),
  codigo: z.string().nullable().optional(),
  descricao: z.string().nullable().optional(),
  carga_horaria: z.number().nullable().optional(),
  ativo: z.boolean(),
  professor_id: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const ExportTurmaDisciplinaJsonSchema = z.object({
  disciplina_id: z.string(),
  professor_id: z.string().nullable().optional(),
  carga_horaria_semanal: z.number().nullable().optional(),
})

export const ExportProfessorJsonSchema = z.object({
  id: z.string(),
  user_id: z.string().nullable().optional(),
  nome_completo: z.string(),
  cpf: z.string().nullable().optional(),
  rg: z.string().nullable().optional(),
  data_nascimento: z.string().nullable().optional(),
  endereco: z.string().nullable().optional(),
  telefone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  formacao: z.string().nullable().optional(),
  especializacao: z.string().nullable().optional(),
  registro_profissional: z.string().nullable().optional(),
  data_admissao: z.string().nullable().optional(),
  salario: z.number().nullable().optional(),
  ativo: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const ExportTurmaJsonSchema = z.object({
  id: z.string(),
  nome: z.string(),
  ano_letivo: z.number(),
  serie: z.string(),
  turno: z.string().nullable().optional(),
  capacidade_maxima: z.number().nullable().optional(),
  professor_responsavel_id: z.string().nullable().optional(),
  ativo: z.boolean(),
  disciplinas: z.array(ExportTurmaDisciplinaJsonSchema),
  created_at: z.string(),
  updated_at: z.string(),
})

export const ExportMatriculaJsonSchema = z.object({
  id: z.string(),
  aluno_id: z.string(),
  turma_id: z.string(),
  numero_matricula: z.string(),
  ano_letivo: z.number(),
  data_matricula: z.string(),
  status: z.string(),
  observacoes: z.string().nullable().optional(),
})

export const ExportMatriculaRowJsonSchema = z.object({
  id: z.string(),
  aluno_id: z.string(),
  turma_id: z.string(),
  numero_matricula: z.string(),
  ano_letivo: z.number(),
  data_matricula: z.string(),
  status: z.string(),
  observacoes: z.string().nullable().optional(),
})

export const ExportAlunoJsonSchema = z.object({
  id: z.string(),
  nome_completo: z.string(),
  data_nascimento: z.string(),
  cpf: z.string().nullable().optional(),
  rg: z.string().nullable().optional(),
  endereco: z.string().nullable().optional(),
  telefone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  nome_responsavel: z.string().nullable().optional(),
  telefone_responsavel: z.string().nullable().optional(),
  email_responsavel: z.string().nullable().optional(),
  observacoes: z.string().nullable().optional(),
  ativo: z.boolean(),
  sexo: z.string().nullable().optional(),
  naturalidade: z.string().nullable().optional(),
  nivel: z.string().nullable().optional(),
  periodo_letivo: z.string().nullable().optional(),
  turno_preferencial: z.string().nullable().optional(),
  matricula: z.string().nullable().optional(),
  matriculas: z.array(ExportMatriculaJsonSchema),
  created_at: z.string(),
  updated_at: z.string(),
})

export interface ValidationResult<T> {
  valid: T[]
  errors: { index: number; errors: string[] }[]
}

export function validateData<T>(
  items: unknown[],
  schema: z.ZodType<T>,
): ValidationResult<T> {
  const valid: T[] = []
  const errors: { index: number; errors: string[] }[] = []

  for (let i = 0; i < items.length; i++) {
    const result = schema.safeParse(items[i])
    if (result.success) {
      valid.push(result.data)
    } else {
      errors.push({
        index: i,
        errors: result.error.issues.map((issue) => issue.message),
      })
    }
  }

  return { valid, errors }
}
