"use server"

import crypto from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { IdMapping, ImportResult, ImportLogEntry, ExportUsuarioJson, ExportProfessorJson, ExportTurmaJson, ExportAlunoJson } from "@/lib/migration/types"
import {
  ExportUsuarioJsonSchema,
  ExportProfessorJsonSchema,
  ExportTurmaJsonSchema,
  ExportAlunoJsonSchema,
  validateData,
} from "@/lib/migration/schemas"
import { translateError } from "@/lib/error-messages"

const IMPORT_ROLES = ["admin", "diretor"]

type ConflictStrategy = "skip" | "overwrite"

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

function logSchemaErrors(
  entityLabel: string,
  errors: { index: number; errors: string[] }[],
  logs: ImportLogEntry[],
): void {
  for (const err of errors) {
    console.log(`[import${entityLabel}] Erro de schema no registro ${err.index}: ${err.errors.join(", ")}`)
    logs.push({
      nome: `Registro #${err.index + 1}`,
      identificador: `indice ${err.index}`,
      status: "erro" as const,
      mensagem: `Erro de validacao: ${err.errors.join("; ")}`,
    })
  }
}

// ---- IMPORT USUARIOS ----

export async function importUsuarios(
  data: ExportUsuarioJson[],
  currentMapping: IdMapping | null,
  conflictStrategy: ConflictStrategy = "skip",
): Promise<ImportResult> {
  const authError = await checkAdminOrDirector()
  if (authError) return { total: 0, importados: 0, pulados: 0, erros: 1, logs: [{ nome: "Sistema", identificador: "", status: "erro", mensagem: authError.error }], mapping: currentMapping || { profiles: {}, auth_users: {}, professores: {}, turmas: {} } }

  const admin = createAdminClient()
  const logs: ImportLogEntry[] = []
  const mapping: IdMapping = currentMapping || { profiles: {}, auth_users: {}, professores: {}, turmas: {} }

  const validation = validateData(data, ExportUsuarioJsonSchema)
  logSchemaErrors("Usuarios", validation.errors, logs)

  const existingEmails = validation.valid.length > 0
    ? (await admin.from("profiles").select("id, email")).data || []
    : []
  const existingByEmail = new Map<string, string>()
  for (const p of existingEmails) {
    existingByEmail.set(p.email.toLowerCase(), p.id)
  }

  for (const usuario of validation.valid) {
    try {
      const existingId = existingByEmail.get(usuario.email.toLowerCase())

      if (existingId) {
        if (conflictStrategy === "skip") {
          mapping.auth_users[usuario.auth_user_id] = existingId
          mapping.profiles[usuario.id] = existingId
          logs.push({ nome: usuario.nome_completo, identificador: usuario.email, status: "pulado", mensagem: "Ja existe" })
          continue
        }

        const { error: updateError } = await admin
          .from("profiles")
          .update({
            nome_completo: usuario.nome_completo,
            telefone: usuario.telefone || null,
            tipo_usuario: usuario.tipo_usuario,
            ativo: usuario.ativo,
          })
          .eq("id", existingId)

        if (updateError) {
          logs.push({ nome: usuario.nome_completo, identificador: usuario.email, status: "erro", mensagem: translateError(updateError.message) })
          continue
        }

        await admin.auth.admin.updateUserById(existingId, {
          user_metadata: {
            nome_completo: usuario.nome_completo,
            telefone: usuario.telefone || null,
            tipo_usuario: usuario.tipo_usuario,
          },
        })

        if (usuario.primeira_senha === false) {
          await admin.from("profiles").update({ primeira_senha: false }).eq("id", existingId)
        }

        mapping.auth_users[usuario.auth_user_id] = existingId
        mapping.profiles[usuario.id] = existingId

        logs.push({ nome: usuario.nome_completo, identificador: usuario.email, status: "ok", mensagem: "Sobrescrito" })
        continue
      }

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

      if (usuario.primeira_senha === false) {
        await admin.from("profiles").update({ primeira_senha: false }).eq("id", newUserId)
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
  conflictStrategy: ConflictStrategy = "skip",
): Promise<ImportResult> {
  const authError = await checkAdminOrDirector()
  if (authError) return { total: 0, importados: 0, pulados: 0, erros: 1, logs: [{ nome: "Sistema", identificador: "", status: "erro", mensagem: authError.error }], mapping: currentMapping }

  const admin = createAdminClient()
  const logs: ImportLogEntry[] = []
  const mapping: IdMapping = { ...currentMapping }
  mapping.professores = { ...mapping.professores }

  const validation = validateData(data, ExportProfessorJsonSchema)
  logSchemaErrors("Professores", validation.errors, logs)

  const existingProfessores = validation.valid.length > 0
    ? (await admin.from("professores").select("id, cpf, email")).data || []
    : []
  const existingByCpf = new Map<string, string>()
  const existingByEmail = new Map<string, string>()
  for (const p of existingProfessores) {
    if (p.cpf) existingByCpf.set(p.cpf, p.id)
    existingByEmail.set(p.email.toLowerCase(), p.id)
  }

  for (const professor of validation.valid) {
    try {
      const existingId = (professor.cpf && existingByCpf.get(professor.cpf))
        || existingByEmail.get(professor.email.toLowerCase())

      if (existingId) {
        if (conflictStrategy === "skip") {
          mapping.professores[professor.id] = professor.id
          logs.push({ nome: professor.nome_completo, identificador: professor.cpf || professor.email, status: "pulado", mensagem: "Ja existe" })
          continue
        }

        const updateData: Record<string, any> = {
          nome_completo: professor.nome_completo,
          email: professor.email,
          ativo: professor.ativo,
        }

        const newUserId = professor.user_id ? mapping.profiles[professor.user_id] : null
        if (newUserId) updateData.user_id = newUserId
        if (professor.cpf) updateData.cpf = professor.cpf
        if (professor.rg) updateData.rg = professor.rg
        if (professor.data_nascimento) updateData.data_nascimento = professor.data_nascimento
        if (professor.endereco) updateData.endereco = professor.endereco
        if (professor.telefone) updateData.telefone = professor.telefone
        if (professor.formacao) updateData.formacao = professor.formacao
        if (professor.especializacao) updateData.especializacao = professor.especializacao
        if (professor.registro_profissional) updateData.registro_profissional = professor.registro_profissional
        if (professor.data_admissao) updateData.data_admissao = professor.data_admissao
        if (professor.salario !== null && professor.salario !== undefined) updateData.salario = professor.salario

        const { error: updateError } = await admin.from("professores").update(updateData).eq("id", existingId)

        if (updateError) {
          logs.push({ nome: professor.nome_completo, identificador: professor.cpf || professor.email, status: "erro", mensagem: translateError(updateError.message) })
          continue
        }

        mapping.professores[professor.id] = existingId
        logs.push({ nome: professor.nome_completo, identificador: professor.cpf || professor.email, status: "ok", mensagem: "Sobrescrito" })
        continue
      }

      const inserir: Record<string, any> = {
        id: professor.id,
        nome_completo: professor.nome_completo,
        email: professor.email,
        ativo: professor.ativo,
      }

      const newUserId = professor.user_id ? mapping.profiles[professor.user_id] : null
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
  conflictStrategy: ConflictStrategy = "skip",
): Promise<ImportResult> {
  const authError = await checkAdminOrDirector()
  if (authError) return { total: 0, importados: 0, pulados: 0, erros: 1, logs: [{ nome: "Sistema", identificador: "", status: "erro", mensagem: authError.error }], mapping: currentMapping }

  const admin = createAdminClient()
  const logs: ImportLogEntry[] = []
  const mapping: IdMapping = { ...currentMapping }
  mapping.turmas = { ...mapping.turmas }

  const validation = validateData(data, ExportTurmaJsonSchema)
  logSchemaErrors("Turmas", validation.errors, logs)

  const existingTurmas = validation.valid.length > 0
    ? (await admin.from("turmas").select("id, nome, ano_letivo")).data || []
    : []
  const existingByNomeAno = new Map<string, string>()
  for (const t of existingTurmas) {
    existingByNomeAno.set(`${t.nome}|${t.ano_letivo}`, t.id)
  }

  for (const turma of validation.valid) {
    try {
      const chave = `${turma.nome}|${turma.ano_letivo}`
      const existingId = existingByNomeAno.get(chave)

      if (existingId) {
        if (conflictStrategy === "skip") {
          mapping.turmas[turma.id] = turma.id
          logs.push({ nome: turma.nome, identificador: `${turma.nome} (${turma.ano_letivo})`, status: "pulado", mensagem: "Ja existe" })
          continue
        }

        const profRespId = turma.professor_responsavel_id
          ? (mapping.professores[turma.professor_responsavel_id] || turma.professor_responsavel_id)
          : null

        const { error: updateError } = await admin
          .from("turmas")
          .update({
            nome: turma.nome,
            ano_letivo: turma.ano_letivo,
            serie: turma.serie,
            turno: turma.turno,
            capacidade_maxima: turma.capacidade_maxima,
            professor_responsavel_id: profRespId,
            ativo: turma.ativo,
          })
          .eq("id", existingId)

        if (updateError) {
          logs.push({ nome: turma.nome, identificador: `${turma.nome} (${turma.ano_letivo})`, status: "erro", mensagem: translateError(updateError.message) })
          continue
        }

        await admin.from("turma_disciplinas").delete().eq("turma_id", existingId)

        for (const disc of turma.disciplinas) {
          const profId = disc.professor_id
            ? (mapping.professores[disc.professor_id] || disc.professor_id)
            : null

          await admin.from("turma_disciplinas").insert({
            turma_id: existingId,
            disciplina_id: disc.disciplina_id,
            professor_id: profId,
            carga_horaria_semanal: disc.carga_horaria_semanal,
          }).maybeSingle()
        }

        mapping.turmas[turma.id] = existingId
        logs.push({ nome: turma.nome, identificador: `${turma.nome} (${turma.ano_letivo})`, status: "ok", mensagem: "Sobrescrito" })
        continue
      }

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
  conflictStrategy: ConflictStrategy = "skip",
): Promise<ImportResult> {
  const authError = await checkAdminOrDirector()
  if (authError) return { total: 0, importados: 0, pulados: 0, erros: 1, logs: [{ nome: "Sistema", identificador: "", status: "erro", mensagem: authError.error }], mapping: currentMapping }

  const admin = createAdminClient()
  const logs: ImportLogEntry[] = []
  const mapping: IdMapping = { ...currentMapping }

  const validation = validateData(data, ExportAlunoJsonSchema)
  logSchemaErrors("Alunos", validation.errors, logs)

  const existingAlunos = validation.valid.length > 0
    ? (await admin.from("alunos").select("id, cpf")).data || []
    : []
  const existingByCpf = new Map<string, string>()
  for (const a of existingAlunos) {
    if (a.cpf) existingByCpf.set(a.cpf, a.id)
  }

  for (const aluno of validation.valid) {
    try {
      const existingId = aluno.cpf ? existingByCpf.get(aluno.cpf) : undefined

      if (existingId) {
        if (conflictStrategy === "skip") {
          logs.push({ nome: aluno.nome_completo, identificador: aluno.cpf || aluno.matricula || aluno.nome_completo, status: "pulado", mensagem: "Ja existe" })
          continue
        }

        const { error: updateError } = await admin
          .from("alunos")
          .update({
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
            matricula: aluno.matricula,
            nivel: aluno.nivel,
            periodo_letivo: aluno.periodo_letivo,
            turno_preferencial: aluno.turno_preferencial,
          })
          .eq("id", existingId)

        if (updateError) {
          logs.push({ nome: aluno.nome_completo, identificador: aluno.cpf || aluno.matricula || aluno.nome_completo, status: "erro", mensagem: translateError(updateError.message) })
          continue
        }

        await admin.from("matriculas").delete().eq("aluno_id", existingId)

        for (const mat of aluno.matriculas) {
          const turmaId = mapping.turmas[mat.turma_id] || mat.turma_id

          await admin.from("matriculas").insert({
            aluno_id: existingId,
            turma_id: turmaId,
            numero_matricula: mat.numero_matricula,
            ano_letivo: mat.ano_letivo,
            data_matricula: mat.data_matricula,
            status: mat.status,
            observacoes: mat.observacoes,
          }).maybeSingle()
        }

        logs.push({ nome: aluno.nome_completo, identificador: aluno.cpf || aluno.matricula || aluno.nome_completo, status: "ok", mensagem: "Sobrescrito" })
        continue
      }

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
        matricula: aluno.matricula,
        nivel: aluno.nivel,
        periodo_letivo: aluno.periodo_letivo,
        turno_preferencial: aluno.turno_preferencial,
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
          numero_matricula: mat.numero_matricula,
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
