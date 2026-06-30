"use server"

import crypto from "crypto"
import { createClient } from "@/lib/supabase/server"
import { adminFetch } from "@/lib/supabase/admin"
import type { ExportWrapper, ExportUsuarioJson, ExportDisciplinaJson, ExportProfessorJson, ExportTurmaJson, ExportAlunoJson, ExportMatriculaRowJson } from "@/lib/migration/types"

async function checkAdminOrDirector(): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Nao autenticado" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tipo_usuario")
    .eq("id", user.id)
    .single()

  if (!profile || !["admin", "diretor"].includes(profile.tipo_usuario)) {
    return { error: "Apenas administradores e diretores podem exportar dados" }
  }

  return null
}

export async function exportUsuarios(): Promise<{ data?: string; error?: string }> {
  const authError = await checkAdminOrDirector()
  if (authError) return authError

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  console.log("[debug] URL:", supabaseUrl)
  console.log("[debug] ENV key prefix:", supabaseKey?.substring(0, 10))
  console.log("[debug] ENV key length:", supabaseKey?.length)

  const { data: profiles, error: profilesError } = await adminFetch<any[]>(
    "profiles?order=nome_completo"
  )
  if (profilesError) return { error: profilesError }
  if (!profiles?.length) return { error: "Nenhum usuario encontrado" }

  const data: ExportUsuarioJson[] = profiles.map((p: any) => {
    const senhaTemporaria = crypto.randomUUID().replace(/-/g, "").substring(0, 12)
    return {
      id: p.id,
      auth_user_id: p.id,
      nome_completo: p.nome_completo,
      email: p.email,
      telefone: p.telefone,
      tipo_usuario: p.tipo_usuario,
      ativo: p.ativo,
      primeira_senha: p.primeira_senha,
      created_at: p.created_at,
      updated_at: p.updated_at,
      _auth: {
        email: p.email,
        senha_temporaria: senhaTemporaria,
      },
    }
  })

  const wrapper: ExportWrapper<ExportUsuarioJson> = {
    entity: "usuarios",
    version: 1,
    exported_at: new Date().toISOString(),
    data,
  }

  return { data: JSON.stringify(wrapper, null, 2) }
}

export async function exportProfessores(): Promise<{ data?: string; error?: string }> {
  const authError = await checkAdminOrDirector()
  if (authError) return authError

  const { data: professores, error } = await adminFetch<any[]>(
    "professores?order=nome_completo"
  )
  if (error) return { error }
  if (!professores?.length) return { error: "Nenhum professor encontrado" }

  const data: ExportProfessorJson[] = professores.map((p: any) => ({
    id: p.id,
    user_id: p.user_id,
    nome_completo: p.nome_completo,
    cpf: p.cpf,
    rg: p.rg,
    data_nascimento: p.data_nascimento,
    endereco: p.endereco,
    telefone: p.telefone,
    email: p.email,
    formacao: p.formacao,
    especializacao: p.especializacao,
    registro_profissional: p.registro_profissional,
    data_admissao: p.data_admissao,
    salario: p.salario !== null && p.salario !== undefined ? Number(p.salario) : null,
    ativo: p.ativo,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }))

  const wrapper: ExportWrapper<ExportProfessorJson> = {
    entity: "professores",
    version: 1,
    exported_at: new Date().toISOString(),
    data,
  }

  return { data: JSON.stringify(wrapper, null, 2) }
}

export async function exportDisciplinas(): Promise<{ data?: string; error?: string }> {
  const authError = await checkAdminOrDirector()
  if (authError) return authError

  const { data: rows, error } = await adminFetch<any[]>(
    "disciplinas?order=nome"
  )
  if (error) return { error }
  if (!rows?.length) return { error: "Nenhuma disciplina encontrada" }

  const data: ExportDisciplinaJson[] = rows.map((d: any) => ({
    id: d.id,
    nome: d.nome,
    codigo: d.codigo || null,
    descricao: d.descricao || null,
    carga_horaria: d.carga_horaria !== null && d.carga_horaria !== undefined ? Number(d.carga_horaria) : null,
    ativo: d.ativo,
    professor_id: d.professor_id || null,
    created_at: d.created_at,
    updated_at: d.updated_at,
  }))

  const wrapper: ExportWrapper<ExportDisciplinaJson> = {
    entity: "disciplinas",
    version: 1,
    exported_at: new Date().toISOString(),
    data,
  }

  return { data: JSON.stringify(wrapper, null, 2) }
}

export async function exportTurmas(): Promise<{ data?: string; error?: string }> {
  const authError = await checkAdminOrDirector()
  if (authError) return authError

  const { data: turmas, error: turmasError } = await adminFetch<any[]>(
    "turmas?order=nome"
  )
  if (turmasError) return { error: turmasError }
  if (!turmas?.length) return { error: "Nenhuma turma encontrada" }

  const { data: disciplinas } = await adminFetch<any[]>("turma_disciplinas")

  const data: ExportTurmaJson[] = turmas.map((t: any) => ({
    id: t.id,
    nome: t.nome,
    ano_letivo: t.ano_letivo,
    serie: t.serie,
    turno: t.turno,
    capacidade_maxima: t.capacidade_maxima,
    professor_responsavel_id: t.professor_responsavel_id,
    ativo: t.ativo,
    disciplinas: (disciplinas || [])
      .filter((d: any) => d.turma_id === t.id)
      .map((d: any) => ({
        disciplina_id: d.disciplina_id,
        professor_id: d.professor_id,
        carga_horaria_semanal: d.carga_horaria_semanal,
      })),
    created_at: t.created_at,
    updated_at: t.updated_at,
  }))

  const wrapper: ExportWrapper<ExportTurmaJson> = {
    entity: "turmas",
    version: 1,
    exported_at: new Date().toISOString(),
    data,
  }

  return { data: JSON.stringify(wrapper, null, 2) }
}

export async function exportAlunos(): Promise<{ data?: string; error?: string }> {
  const authError = await checkAdminOrDirector()
  if (authError) return authError

  const { data: alunos, error: alunosError } = await adminFetch<any[]>(
    "alunos?order=nome_completo"
  )
  if (alunosError) return { error: alunosError }
  if (!alunos?.length) return { error: "Nenhum aluno encontrado" }

  const { data: matriculas } = await adminFetch<any[]>("matriculas")

  const data: ExportAlunoJson[] = alunos.map((a: any) => ({
    id: a.id,
    nome_completo: a.nome_completo,
    data_nascimento: a.data_nascimento,
    cpf: a.cpf,
    rg: a.rg,
    endereco: a.endereco,
    telefone: a.telefone,
    email: a.email,
    nome_responsavel: a.nome_responsavel,
    telefone_responsavel: a.telefone_responsavel,
    email_responsavel: a.email_responsavel,
    observacoes: a.observacoes,
    ativo: a.ativo,
    sexo: a.sexo,
    naturalidade: a.naturalidade,
    nivel: a.nivel,
    periodo_letivo: a.periodo_letivo,
    turno_preferencial: a.turno_preferencial,
    matricula: a.matricula,
    matriculas: (matriculas || [])
      .filter((m: any) => m.aluno_id === a.id)
      .map((m: any) => ({
        id: m.id,
        aluno_id: a.id,
        turma_id: m.turma_id,
        numero_matricula: m.numero_matricula,
        ano_letivo: m.ano_letivo,
        data_matricula: m.data_matricula,
        status: m.status,
        observacoes: m.observacoes,
      })),
    created_at: a.created_at,
    updated_at: a.updated_at,
  }))

  const wrapper: ExportWrapper<ExportAlunoJson> = {
    entity: "alunos",
    version: 1,
    exported_at: new Date().toISOString(),
    data,
  }

  return { data: JSON.stringify(wrapper, null, 2) }
}

export async function exportMatriculas(): Promise<{ data?: string; error?: string }> {
  const authError = await checkAdminOrDirector()
  if (authError) return authError

  const { data: rows, error } = await adminFetch<any[]>("matriculas")
  if (error) return { error }
  if (!rows?.length) return { error: "Nenhuma matricula encontrada" }

  const data: ExportMatriculaRowJson[] = rows.map((m: any) => ({
    id: m.id,
    aluno_id: m.aluno_id,
    turma_id: m.turma_id,
    numero_matricula: m.numero_matricula,
    ano_letivo: m.ano_letivo,
    data_matricula: m.data_matricula,
    status: m.status,
    observacoes: m.observacoes,
  }))

  const wrapper: ExportWrapper<ExportMatriculaRowJson> = {
    entity: "matriculas",
    version: 1,
    exported_at: new Date().toISOString(),
    data,
  }

  return { data: JSON.stringify(wrapper, null, 2) }
}
