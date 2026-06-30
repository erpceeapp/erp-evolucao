export interface IdMapping {
  profiles: Record<string, string>
  auth_users: Record<string, string>
  disciplinas: Record<string, string>
  professores: Record<string, string>
  turmas: Record<string, string>
  matriculas: Record<string, string>
}

export interface ImportLogEntry {
  nome: string
  identificador: string
  status: "ok" | "pulado" | "erro"
  mensagem?: string
}

export interface ImportResult {
  total: number
  importados: number
  pulados: number
  erros: number
  logs: ImportLogEntry[]
  mapping: IdMapping
}

export interface ExportUsuarioJson {
  id: string
  auth_user_id: string
  nome_completo: string
  email: string
  telefone: string | null
  tipo_usuario: string
  ativo: boolean
  primeira_senha: boolean
  created_at: string
  updated_at: string
  _auth: {
    email: string
    senha_temporaria: string
  }
}

export interface ExportProfessorJson {
  id: string
  user_id: string
  nome_completo: string
  cpf: string | null
  rg: string | null
  data_nascimento: string | null
  endereco: string | null
  telefone: string | null
  email: string
  formacao: string | null
  especializacao: string | null
  registro_profissional: string | null
  data_admissao: string | null
  salario: number | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface ExportMatriculaRowJson {
  id: string
  aluno_id: string
  turma_id: string
  numero_matricula: string
  ano_letivo: number
  data_matricula: string
  status: string
  observacoes: string | null
}

export interface ExportDisciplinaJson {
  id: string
  nome: string
  codigo: string | null
  descricao: string | null
  carga_horaria: number | null
  ativo: boolean
  professor_id: string | null
  created_at: string
  updated_at: string
}

export interface ExportTurmaDisciplinaJson {
  disciplina_id: string
  professor_id: string | null
  carga_horaria_semanal: number | null
}

export interface ExportTurmaJson {
  id: string
  nome: string
  ano_letivo: number
  serie: string
  turno: string | null
  capacidade_maxima: number | null
  professor_responsavel_id: string | null
  ativo: boolean
  disciplinas: ExportTurmaDisciplinaJson[]
  created_at: string
  updated_at: string
}

export interface ExportMatriculaJson {
  id: string
  aluno_id: string
  turma_id: string
  numero_matricula: string
  ano_letivo: number
  data_matricula: string
  status: string
  observacoes: string | null
}

export interface ExportAlunoJson {
  id: string
  nome_completo: string
  data_nascimento: string
  cpf: string | null
  rg: string | null
  endereco: string | null
  telefone: string | null
  email: string | null
  nome_responsavel: string | null
  telefone_responsavel: string | null
  email_responsavel: string | null
  observacoes: string | null
  ativo: boolean
  sexo: string | null
  naturalidade: string | null
  nivel: string | null
  periodo_letivo: string | null
  turno_preferencial: string | null
  matricula: string | null
  matriculas: ExportMatriculaJson[]
  created_at: string
  updated_at: string
}

export type EntityType = "usuarios" | "disciplinas" | "professores" | "turmas" | "alunos" | "matriculas"

export interface ExportWrapper<T> {
  entity: string
  version: number
  exported_at: string
  data: T[]
}
