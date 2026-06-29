"use server"

import crypto from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { IdMapping, ImportResult, ImportLogEntry, ExportUsuarioJson, ExportProfessorJson, ExportTurmaJson, ExportAlunoJson } from "@/lib/migration/types"
import { translateError } from "@/lib/error-messages"

const IMPORT_ROLES = ["admin", "diretor"]

async function checkAdminOrDirector(): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Nao autenticado" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tipo_usuario")
    .eq("id", user.id)
    .single()

  if (!profile || !IMPORT_ROLES.includes(profile.tipo_usuario)) {
    return { error: "Apenas administradores e diretores podem importar dados" }
  }

  return null
}

function makeResult(mapping: IdMapping, logs: ImportLogEntry[]): ImportResult {
  return {
    total: logs.length,
    importados: logs.filter((l) => l.status === "ok").length,
    pulados: logs.filter((l) => l.status === "pulado").length,
    erros: logs.filter((l) => l.status === "erro").length,
    logs,
    mapping,
  }
}

// ---- IMPORT USUARIOS ----

export async function importUsuarios(
  data: ExportUsuarioJson[],
  currentMapping: IdMapping | null,
): Promise<ImportResult> {
  const authError = await checkAdminOrDirector()
  if (authError) return { total: 0, importados: 0, pulados: 0, erros: 1, logs: [{ nome: "Sistema", identificador: "", status: "erro", mensagem: authError.error }], mapping: currentMapping || { profiles: {}, auth_users: {}, professores: {}, turmas: {} } }

  const admin = createAdminClient()
  const logs: ImportLogEntry[] = []
  const mapping: IdMapping = currentMapping || { profiles: {}, auth_users: {}, professores: {}, turmas: {} }

  for (const usuario of data) {
    try {
      const senha = usuario._auth.senha_temporaria || crypto.randomUUID().replace(/-/g, "").substring(0, 12)

      const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email: usuario.email,
        password: senha,
        email_confirm: true,
        user_metadata: {
          nome_completo: usuario.nome_completo,
          telefone: usuario.telefone || null,
          tipo_usuario: usuario.tipo_usuario,
        },
      })

      if (authError) {
        logs.push({ nome: usuario.nome_completo, identificador: usuario.email, status: "erro", mensagem: translateError(authError.message) })
        continue
      }

      const newUserId = authData.user?.id
      if (!newUserId) {
        logs.push({ nome: usuario.nome_completo, identificador: usuario.email, status: "erro", mensagem: "Falha ao obter ID do usuario criado" })
        continue
      }

      mapping.auth_users[usuario.auth_user_id] = newUserId
      mapping.profiles[usuario.id] = newUserId

      logs.push({ nome: usuario.nome_completo, identificador: usuario.email, status: "ok" })
    } catch (err: any) {
      logs.push({ nome: usuario.nome_completo, identificador: usuario.email, status: "erro", mensagem: translateError(err.message) })
    }
  }

  return makeResult(mapping, logs)
}

// ---- IMPORT PROFESSORES ----

export async function importProfessores(
  data: ExportProfessorJson[],
  currentMapping: IdMapping,
): Promise<ImportResult> {
  const authError = await checkAdminOrDirector()
  if (authError) return { total: 0, importados: 0, pulados: 0, erros: 1, logs: [{ nome: "Sistema", identificador: "", status: "erro", mensagem: authError.error }], mapping: currentMapping }

  const admin = createAdminClient()
  const logs: ImportLogEntry[] = []
  const mapping: IdMapping = { ...currentMapping }
  mapping.professores = { ...mapping.professores }

  for (const professor of data) {
    try {
      const newUserId = professor.user_id ? mapping.profiles[professor.user_id] : null

      const inserir: Record<string, any> = {
        id: professor.id,
        nome_completo: professor.nome_completo,
        email: professor.email,
        ativo: professor.ativo,
      }

      if (newUserId) inserir.user_id = newUserId
      if (professor.cpf) inserir.cpf = professor.cpf
      if (professor.rg) inserir.rg = professor.rg
      if (professor.data_nascimento) inserir.data_nascimento = professor.data_nascimento
      if (professor.endereco) inserir.endereco = professor.endereco
      if (professor.telefone) inserir.telefone = professor.telefone
      if (professor.formacao) inserir.formacao = professor.formacao
      if (professor.especializacao) inserir.especializacao = professor.especializacao
      if (professor.registro_profissional) inserir.registro_profissional = professor.registro_profissional
      if (professor.data_admissao) inserir.data_admissao = professor.data_admissao
      if (professor.salario !== null && professor.salario !== undefined) inserir.salario = professor.salario

      const { error } = await admin.from("professores").insert(inserir)

      if (error) {
        logs.push({ nome: professor.nome_completo, identificador: professor.cpf || professor.email, status: "erro", mensagem: translateError(error.message) })
        continue
      }

      mapping.professores[professor.id] = professor.id
      logs.push({ nome: professor.nome_completo, identificador: professor.cpf || professor.email, status: "ok" })
    } catch (err: any) {
      logs.push({ nome: professor.nome_completo, identificador: professor.cpf || professor.email, status: "erro", mensagem: translateError(err.message) })
    }
  }

  return makeResult(mapping, logs)
}

// ---- IMPORT TURMAS ----

export async function importTurmas(
  data: ExportTurmaJson[],
  currentMapping: IdMapping,
): Promise<ImportResult> {
  const authError = await checkAdminOrDirector()
  if (authError) return { total: 0, importados: 0, pulados: 0, erros: 1, logs: [{ nome: "Sistema", identificador: "", status: "erro", mensagem: authError.error }], mapping: currentMapping }

  const admin = createAdminClient()
  const logs: ImportLogEntry[] = []
  const mapping: IdMapping = { ...currentMapping }
  mapping.turmas = { ...mapping.turmas }

  for (const turma of data) {
    try {
      const profRespId = turma.professor_responsavel_id
        ? (mapping.professores[turma.professor_responsavel_id] || turma.professor_responsavel_id)
        : null

      const { error: turmaError } = await admin.from("turmas").insert({
        id: turma.id,
        nome: turma.nome,
        ano_letivo: turma.ano_letivo,
        serie: turma.serie,
        turno: turma.turno,
        capacidade_maxima: turma.capacidade_maxima,
        professor_responsavel_id: profRespId,
        ativo: turma.ativo,
      })

      if (turmaError) {
        logs.push({ nome: turma.nome, identificador: `${turma.nome} (${turma.ano_letivo})`, status: "erro", mensagem: translateError(turmaError.message) })
        continue
      }

      for (const disc of turma.disciplinas) {
        const profId = disc.professor_id
          ? (mapping.professores[disc.professor_id] || disc.professor_id)
          : null

        await admin.from("turma_disciplinas").insert({
          turma_id: turma.id,
          disciplina_id: disc.disciplina_id,
          professor_id: profId,
          carga_horaria_semanal: disc.carga_horaria_semanal,
        }).maybeSingle()
      }

      mapping.turmas[turma.id] = turma.id
      logs.push({ nome: turma.nome, identificador: `${turma.nome} (${turma.ano_letivo})`, status: "ok" })
    } catch (err: any) {
      logs.push({ nome: turma.nome, identificador: `${turma.nome} (${turma.ano_letivo})`, status: "erro", mensagem: translateError(err.message) })
    }
  }

  return makeResult(mapping, logs)
}

// ---- IMPORT ALUNOS ----

export async function importAlunos(
  data: ExportAlunoJson[],
  currentMapping: IdMapping,
): Promise<ImportResult> {
  const authError = await checkAdminOrDirector()
  if (authError) return { total: 0, importados: 0, pulados: 0, erros: 1, logs: [{ nome: "Sistema", identificador: "", status: "erro", mensagem: authError.error }], mapping: currentMapping }

  const admin = createAdminClient()
  const logs: ImportLogEntry[] = []
  const mapping: IdMapping = { ...currentMapping }

  for (const aluno of data) {
    try {
      const { error: alunoError } = await admin.from("alunos").insert({
        id: aluno.id,
        nome_completo: aluno.nome_completo,
        data_nascimento: aluno.data_nascimento,
        cpf: aluno.cpf,
        rg: aluno.rg,
        endereco: aluno.endereco,
        telefone: aluno.telefone,
        email: aluno.email,
        nome_responsavel: aluno.nome_responsavel,
        telefone_responsavel: aluno.telefone_responsavel,
        email_responsavel: aluno.email_responsavel,
        observacoes: aluno.observacoes,
        ativo: aluno.ativo,
        sexo: aluno.sexo,
        naturalidade: aluno.naturalidade,
      })

      if (alunoError) {
        logs.push({ nome: aluno.nome_completo, identificador: aluno.cpf || aluno.matricula || aluno.nome_completo, status: "erro", mensagem: translateError(alunoError.message) })
        continue
      }

      for (const mat of aluno.matriculas) {
        const turmaId = mapping.turmas[mat.turma_id] || mat.turma_id

        await admin.from("matriculas").insert({
          aluno_id: aluno.id,
          turma_id: turmaId,
          ano_letivo: mat.ano_letivo,
          data_matricula: mat.data_matricula,
          status: mat.status,
          observacoes: mat.observacoes,
        }).maybeSingle()
      }

      logs.push({ nome: aluno.nome_completo, identificador: aluno.cpf || aluno.matricula || aluno.nome_completo, status: "ok" })
    } catch (err: any) {
      logs.push({ nome: aluno.nome_completo, identificador: aluno.cpf || aluno.matricula || aluno.nome_completo, status: "erro", mensagem: translateError(err.message) })
    }
  }

  return makeResult(mapping, logs)
}
