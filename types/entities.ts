// Entidades principais do sistema ERP

export interface Aluno {
  id: string
  nome_completo: string
  cpf: string
  data_nascimento: string
  sexo: string
  email: string
  telefone: string | null
  celular: string | null
  ativo: boolean
  email_responsavel: string | null
  nome_responsavel: string | null
  telefone_responsavel: string | null
  created_at: string
  updated_at: string
}

export interface Professor {
  id: string
  nome_completo: string
  cpf: string
  email: string
  telefone: string | null
  celular: string | null
  formacao: string | null
  numero_registro: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Turma {
  id: string
  nome: string
  ano_letivo: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Disciplina {
  id: string
  nome: string
  descricao: string | null
  carga_horaria: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Matricula {
  id: string
  aluno_id: string
  turma_id: string
  data_matricula: string
  status: "ativa" | "cancelada" | "trancada" | "concluida"
  numero_matricula: string
  created_at: string
  updated_at: string
}

export interface Nota {
  id: string
  matricula_id: string
  disciplina_id: string
  bimestre: number
  valor: number
  created_at: string
  updated_at: string
}

export interface Presenca {
  id: string
  matricula_id: string
  aula_id: string
  presente: boolean
  created_at: string
  updated_at: string
}

export interface Aula {
  id: string
  professor_id: string
  turma_id: string
  disciplina_id: string
  data_aula: string
  conteudo: string | null
  created_at: string
  updated_at: string
}

export interface PeriodoLetivo {
  id: string
  nome: string
  data_inicio: string
  data_fim: string
  bimestre: number
  ano_letivo: number
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  user_id: string
  primeira_senha: boolean
  tipo_usuario: "admin" | "professor" | "secretaria" | "coordenacao" | "diretor"
  created_at: string
  updated_at: string
}

export interface ConfigCamposObrigatorios {
  id: string
  campo: string
  obrigatorio: boolean
  created_at: string
  updated_at: string
}

export interface LinksDocumentos {
  id: string
  titulo: string
  url: string
  ordem: number
  created_at: string
  updated_at: string
}

export interface Escola {
  id: string
  nome: string
  cnpj: string
  telefone: string | null
  email: string | null
  endereco: string | null
  cidade: string | null
  estado: string | null
  cep: string | null
  created_at: string
  updated_at: string
}
