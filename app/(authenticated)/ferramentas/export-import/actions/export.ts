"use server"

import crypto from "crypto"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { ExportWrapper, ExportUsuarioJson, ExportProfessorJson, ExportTurmaJson, ExportAlunoJson } from "@/lib/migration/types"
import { translateError } from "@/lib/error-messages"

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

  const admin = createAdminClient()
  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("*")
    .order("nome_completo")

  if (profilesError) return { error: translateError(profilesError.message) }
  if (!profiles?.length) return { error: "Nenhum usuario encontrado" }

  const data: ExportUsuarioJson[] = profiles.map((p) => {
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

  const admin = createAdminClient()
  const { data: professores, error } = await admin
    .from("professores")
    .select("*")
    .order("nome_completo")

  if (error) return { error: translateError(error.message) }
  if (!professores?.length) return { error: "Nenhum professor encontrado" }

  const data: ExportProfessorJson[] = professores.map((p) => ({
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

export async function exportTurmas(): Promise<{ data?: string; error?: string }> {
  const authError = await checkAdminOrDirector()
  if (authError) return authError

  const admin = createAdminClient()
  const { data: turmas, error: turmasError } = await admin
    .from("turmas")
    .select("*")
    .order("nome")

  if (turmasError) return { error: translateError(turmasError.message) }
  if (!turmas?.length) return { error: "Nenhuma turma encontrada" }

  const { data: disciplinas } = await admin
    .from("turma_disciplinas")
    .select("*")

  const data: ExportTurmaJson[] = turmas.map((t) => ({
    id: t.id,
    nome: t.nome,
    ano_letivo: t.ano_letivo,
    serie: t.serie,
    turno: t.turno,
    capacidade_maxima: t.capacidade_maxima,
    professor_responsavel_id: t.professor_responsavel_id,
    ativo: t.ativo,
    disciplinas: (disciplinas || [])
      .filter((d) => d.turma_id === t.id)
      .map((d) => ({
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

  const admin = createAdminClient()
  const { data: alunos, error: alunosError } = await admin
    .from("alunos")
    .select("*")
    .order("nome_completo")

  if (alunosError) return { error: translateError(alunosError.message) }
  if (!alunos?.length) return { error: "Nenhum aluno encontrado" }

  const { data: matriculas } = await admin
    .from("matriculas")
    .select("*")

  const data: ExportAlunoJson[] = alunos.map((a) => ({
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
    matricula: a.matricula,
    matriculas: (matriculas || [])
      .filter((m) => m.aluno_id === a.id)
      .map((m) => ({
        turma_id: m.turma_id,
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
