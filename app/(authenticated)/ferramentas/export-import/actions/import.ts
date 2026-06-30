"use server"

import crypto from "crypto"
import { adminFetch, adminAuthFetch } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { IdMapping, ImportResult, ImportLogEntry, ExportUsuarioJson, ExportDisciplinaJson, ExportProfessorJson, ExportTurmaJson, ExportAlunoJson, ExportMatriculaRowJson } from "@/lib/migration/types"
import {
  ExportUsuarioJsonSchema,
  ExportDisciplinaJsonSchema,
  ExportProfessorJsonSchema,
  ExportTurmaJsonSchema,
  ExportAlunoJsonSchema,
  ExportMatriculaRowJsonSchema,
  validateData,
} from "@/lib/migration/schemas"

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
  if (authError) return { total: 0, importados: 0, pulados: 0, erros: 1, logs: [{ nome: "Sistema", identificador: "", status: "erro", mensagem: authError.error }], mapping: currentMapping || { profiles: {}, auth_users: {}, disciplinas: {}, professores: {}, turmas: {}, matriculas: {} } }

  const logs: ImportLogEntry[] = []
  const mapping: IdMapping = currentMapping || { profiles: {}, auth_users: {}, disciplinas: {}, professores: {}, turmas: {}, matriculas: {} }

  const validation = validateData(data, ExportUsuarioJsonSchema)
  logSchemaErrors("Usuarios", validation.errors, logs)

  const { data: existingEmails } = validation.valid.length > 0
    ? await adminFetch<any[]>("profiles?select=id,email")
    : { data: null }
  const existingByEmail = new Map<string, string>()
  for (const p of existingEmails || []) {
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

        const { error: updateError } = await adminFetch<any>(
          `profiles?id=eq.${existingId}`,
          {
            method: "PATCH",
            body: {
              nome_completo: usuario.nome_completo,
              telefone: usuario.telefone || null,
              tipo_usuario: usuario.tipo_usuario,
              ativo: usuario.ativo,
            },
          }
        )

        if (updateError) {
          logs.push({ nome: usuario.nome_completo, identificador: usuario.email, status: "erro", mensagem: updateError })
          continue
        }

        await adminAuthFetch(`admin/users/${existingId}`, {
          method: "PUT",
          body: {
            user_metadata: {
              nome_completo: usuario.nome_completo,
              telefone: usuario.telefone || null,
              tipo_usuario: usuario.tipo_usuario,
            },
          },
        })

        if (usuario.primeira_senha === false) {
          await adminFetch(`profiles?id=eq.${existingId}`, {
            method: "PATCH",
            body: { primeira_senha: false },
          })
        }

        mapping.auth_users[usuario.auth_user_id] = existingId
        mapping.profiles[usuario.id] = existingId

        logs.push({ nome: usuario.nome_completo, identificador: usuario.email, status: "ok", mensagem: "Sobrescrito" })
        continue
      }

      const senha = usuario._auth.senha_temporaria || crypto.randomUUID().replace(/-/g, "").substring(0, 12)

      const { data: authData, error: authError } = await adminAuthFetch<any>(
        "admin/users",
        {
          method: "POST",
          body: {
            email: usuario.email,
            password: senha,
            email_confirm: true,
            user_metadata: {
              nome_completo: usuario.nome_completo,
              telefone: usuario.telefone || null,
              tipo_usuario: usuario.tipo_usuario,
            },
          },
        }
      )

      if (authError) {
        logs.push({ nome: usuario.nome_completo, identificador: usuario.email, status: "erro", mensagem: authError })
        continue
      }

      const newUserId = authData?.id || authData?.user?.id
      if (!newUserId) {
        logs.push({ nome: usuario.nome_completo, identificador: usuario.email, status: "erro", mensagem: "Falha ao obter ID do usuario criado" })
        continue
      }

      if (usuario.primeira_senha === false) {
        await adminFetch(`profiles?id=eq.${newUserId}`, {
          method: "PATCH",
          body: { primeira_senha: false },
        })
      }

      mapping.auth_users[usuario.auth_user_id] = newUserId
      mapping.profiles[usuario.id] = newUserId

      logs.push({ nome: usuario.nome_completo, identificador: usuario.email, status: "ok" })
    } catch (err: any) {
      logs.push({ nome: usuario.nome_completo, identificador: usuario.email, status: "erro", mensagem: err.message })
    }
  }

  return makeResult(mapping, logs)
}

// ---- IMPORT DISCIPLINAS ----

export async function importDisciplinas(
  data: ExportDisciplinaJson[],
  currentMapping: IdMapping,
  conflictStrategy: ConflictStrategy = "skip",
): Promise<ImportResult> {
  const authError = await checkAdminOrDirector()
  if (authError) return { total: 0, importados: 0, pulados: 0, erros: 1, logs: [{ nome: "Sistema", identificador: "", status: "erro", mensagem: authError.error }], mapping: currentMapping }

  const logs: ImportLogEntry[] = []
  const mapping: IdMapping = { ...currentMapping }
  mapping.disciplinas = { ...(mapping.disciplinas || {}) }

  const validation = validateData(data, ExportDisciplinaJsonSchema)
  logSchemaErrors("Disciplinas", validation.errors, logs)

  const { data: existingRows } = validation.valid.length > 0
    ? await adminFetch<any[]>("disciplinas?select=id,nome,codigo")
    : { data: null }
  const existingByNome = new Map<string, string>()
  const existingByCodigo = new Map<string, string>()
  for (const d of existingRows || []) {
    existingByNome.set(d.nome.toLowerCase(), d.id)
    if (d.codigo) existingByCodigo.set(d.codigo.toLowerCase(), d.id)
  }

  for (const disciplina of validation.valid) {
    try {
      const existingId = existingByCodigo.get(disciplina.codigo?.toLowerCase() || "")
        || existingByNome.get(disciplina.nome.toLowerCase())

      const mappedProfessorId = disciplina.professor_id
        ? (mapping.professores[disciplina.professor_id] || null)
        : null

      if (existingId) {
        if (conflictStrategy === "skip") {
          mapping.disciplinas[disciplina.id] = disciplina.id
          logs.push({ nome: disciplina.nome, identificador: disciplina.codigo || disciplina.nome, status: "pulado", mensagem: "Ja existe" })
          continue
        }

        const { error: updateError } = await adminFetch<any>(
          `disciplinas?id=eq.${existingId}`,
          {
            method: "PATCH",
            body: {
              nome: disciplina.nome,
              codigo: disciplina.codigo || null,
              descricao: disciplina.descricao || null,
              carga_horaria: disciplina.carga_horaria,
              ativo: disciplina.ativo,
              professor_id: mappedProfessorId,
            },
          }
        )

        if (updateError) {
          logs.push({ nome: disciplina.nome, identificador: disciplina.codigo || disciplina.nome, status: "erro", mensagem: updateError })
          continue
        }

        mapping.disciplinas[disciplina.id] = existingId
        logs.push({ nome: disciplina.nome, identificador: disciplina.codigo || disciplina.nome, status: "ok", mensagem: "Sobrescrito" })
        continue
      }

      const { error: insertError } = await adminFetch<any>("disciplinas", {
        method: "POST",
        body: {
          id: disciplina.id,
          nome: disciplina.nome,
          codigo: disciplina.codigo || null,
          descricao: disciplina.descricao || null,
          carga_horaria: disciplina.carga_horaria,
          ativo: disciplina.ativo,
          professor_id: mappedProfessorId,
        },
      })

      if (insertError) {
        logs.push({ nome: disciplina.nome, identificador: disciplina.codigo || disciplina.nome, status: "erro", mensagem: insertError })
        continue
      }

      mapping.disciplinas[disciplina.id] = disciplina.id
      logs.push({ nome: disciplina.nome, identificador: disciplina.codigo || disciplina.nome, status: "ok" })
    } catch (err: any) {
      logs.push({ nome: disciplina.nome, identificador: disciplina.codigo || disciplina.nome, status: "erro", mensagem: err.message })
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

  const logs: ImportLogEntry[] = []
  const mapping: IdMapping = { ...currentMapping }
  mapping.professores = { ...mapping.professores }

  const validation = validateData(data, ExportProfessorJsonSchema)
  logSchemaErrors("Professores", validation.errors, logs)

  const { data: existingProfessores } = validation.valid.length > 0
    ? await adminFetch<any[]>("professores?select=id,cpf,email")
    : { data: null }
  const existingByCpf = new Map<string, string>()
  const existingByEmail = new Map<string, string>()
  for (const p of existingProfessores || []) {
    if (p.cpf) existingByCpf.set(p.cpf, p.id)
    if (p.email) existingByEmail.set(p.email.toLowerCase(), p.id)
  }

  for (const professor of validation.valid) {
    try {
      const ident = professor.cpf || professor.email || professor.nome_completo || "-"
      const existingId = (professor.cpf && existingByCpf.get(professor.cpf))
        || (professor.email && existingByEmail.get(professor.email.toLowerCase()))

      if (existingId) {
        if (conflictStrategy === "skip") {
          mapping.professores[professor.id] = professor.id
          logs.push({ nome: professor.nome_completo, identificador: ident, status: "pulado", mensagem: "Ja existe" })
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

        const { error: updateError } = await adminFetch<any>(
          `professores?id=eq.${existingId}`,
          { method: "PATCH", body: updateData }
        )

        if (updateError) {
          logs.push({ nome: professor.nome_completo, identificador: ident, status: "erro", mensagem: updateError })
          continue
        }

        mapping.professores[professor.id] = existingId
        logs.push({ nome: professor.nome_completo, identificador: ident, status: "ok", mensagem: "Sobrescrito" })
        continue
      }

      const inserir: Record<string, any> = {
        nome_completo: professor.nome_completo,
        email: professor.email,
        ativo: professor.ativo,
      }

      const newUserId = professor.user_id ? mapping.profiles[professor.user_id] : null
      if (newUserId) {
        inserir.id = professor.id
        inserir.user_id = newUserId
      }
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

      const { error } = await adminFetch<any>("professores", {
        method: "POST",
        body: inserir,
      })

      if (error) {
        const msg = error.includes("profiles_id_fkey")
          ? `Este professor nao possui uma conta de usuario vinculada (user_id ausente ou nao encontrado no mapping). Crie um usuario manualmente no sistema e tente novamente.`
          : error
        logs.push({ nome: professor.nome_completo, identificador: ident, status: "erro", mensagem: msg })
        continue
      }

      mapping.professores[professor.id] = professor.id
      logs.push({ nome: professor.nome_completo, identificador: ident, status: "ok" })
    } catch (err: any) {
      logs.push({ nome: professor.nome_completo, identificador: professor.cpf || professor.email || professor.nome_completo || "-", status: "erro", mensagem: err.message })
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

  const logs: ImportLogEntry[] = []
  const mapping: IdMapping = { ...currentMapping }
  mapping.turmas = { ...mapping.turmas }

  const validation = validateData(data, ExportTurmaJsonSchema)
  logSchemaErrors("Turmas", validation.errors, logs)

  const { data: existingTurmas } = validation.valid.length > 0
    ? await adminFetch<any[]>("turmas?select=id,nome,ano_letivo")
    : { data: null }
  const existingByNomeAno = new Map<string, string>()
  for (const t of existingTurmas || []) {
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

        const { error: updateError } = await adminFetch<any>(
          `turmas?id=eq.${existingId}`,
          {
            method: "PATCH",
            body: {
              nome: turma.nome,
              ano_letivo: turma.ano_letivo,
              serie: turma.serie,
              turno: turma.turno,
              capacidade_maxima: turma.capacidade_maxima,
              professor_responsavel_id: profRespId,
              ativo: turma.ativo,
            },
          }
        )

        if (updateError) {
          logs.push({ nome: turma.nome, identificador: `${turma.nome} (${turma.ano_letivo})`, status: "erro", mensagem: updateError })
          continue
        }

        await adminFetch(`turma_disciplinas?turma_id=eq.${existingId}`, { method: "DELETE" })

        for (const disc of turma.disciplinas) {
          const profId = disc.professor_id
            ? (mapping.professores[disc.professor_id] || disc.professor_id)
            : null

          await adminFetch("turma_disciplinas", {
            method: "POST",
            body: {
              turma_id: existingId,
              disciplina_id: disc.disciplina_id,
              professor_id: profId,
              carga_horaria_semanal: disc.carga_horaria_semanal,
            },
          })
        }

        mapping.turmas[turma.id] = existingId
        logs.push({ nome: turma.nome, identificador: `${turma.nome} (${turma.ano_letivo})`, status: "ok", mensagem: "Sobrescrito" })
        continue
      }

      const profRespId = turma.professor_responsavel_id
        ? (mapping.professores[turma.professor_responsavel_id] || turma.professor_responsavel_id)
        : null

      const { error: turmaError } = await adminFetch<any>("turmas", {
        method: "POST",
        body: {
          id: turma.id,
          nome: turma.nome,
          ano_letivo: turma.ano_letivo,
          serie: turma.serie,
          turno: turma.turno,
          capacidade_maxima: turma.capacidade_maxima,
          professor_responsavel_id: profRespId,
          ativo: turma.ativo,
        },
      })

      if (turmaError) {
        logs.push({ nome: turma.nome, identificador: `${turma.nome} (${turma.ano_letivo})`, status: "erro", mensagem: turmaError })
        continue
      }

      for (const disc of turma.disciplinas) {
        const profId = disc.professor_id
          ? (mapping.professores[disc.professor_id] || disc.professor_id)
          : null

        await adminFetch("turma_disciplinas", {
          method: "POST",
          body: {
            turma_id: turma.id,
            disciplina_id: disc.disciplina_id,
            professor_id: profId,
            carga_horaria_semanal: disc.carga_horaria_semanal,
          },
        })
      }

      mapping.turmas[turma.id] = turma.id
      logs.push({ nome: turma.nome, identificador: `${turma.nome} (${turma.ano_letivo})`, status: "ok" })
    } catch (err: any) {
      logs.push({ nome: turma.nome, identificador: `${turma.nome} (${turma.ano_letivo})`, status: "erro", mensagem: err.message })
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

  const logs: ImportLogEntry[] = []
  const mapping: IdMapping = { ...currentMapping }

  const validation = validateData(data, ExportAlunoJsonSchema)
  logSchemaErrors("Alunos", validation.errors, logs)

  const { data: existingAlunos } = validation.valid.length > 0
    ? await adminFetch<any[]>("alunos?select=id,cpf,matricula")
    : { data: null }
  const existingByCpf = new Map<string, string>()
  const existingByMatricula = new Map<string, string>()
  for (const a of existingAlunos || []) {
    if (a.cpf) existingByCpf.set(a.cpf, a.id)
    if (a.matricula) existingByMatricula.set(a.matricula, a.id)
  }

  for (const aluno of validation.valid) {
    try {
      const existingId = (aluno.cpf && existingByCpf.get(aluno.cpf))
        || (aluno.matricula && existingByMatricula.get(aluno.matricula))

      if (existingId) {
        if (conflictStrategy === "skip") {
          logs.push({ nome: aluno.nome_completo, identificador: aluno.cpf || aluno.matricula || aluno.nome_completo, status: "pulado", mensagem: "Ja existe" })
          continue
        }

        const { error: updateError } = await adminFetch<any>(
          `alunos?id=eq.${existingId}`,
          {
            method: "PATCH",
            body: {
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
            },
          }
        )

        if (updateError) {
          logs.push({ nome: aluno.nome_completo, identificador: aluno.cpf || aluno.matricula || aluno.nome_completo, status: "erro", mensagem: updateError })
          continue
        }

        await adminFetch(`matriculas?aluno_id=eq.${existingId}`, { method: "DELETE" })

        for (const mat of aluno.matriculas) {
          const turmaId = mapping.turmas[mat.turma_id] || mat.turma_id

          await adminFetch("matriculas", {
            method: "POST",
            body: {
              id: mat.id,
              aluno_id: existingId,
              turma_id: turmaId,
              numero_matricula: mat.numero_matricula,
              ano_letivo: mat.ano_letivo,
              data_matricula: mat.data_matricula,
              status: mat.status,
              observacoes: mat.observacoes,
            },
          })
        }

        logs.push({ nome: aluno.nome_completo, identificador: aluno.cpf || aluno.matricula || aluno.nome_completo, status: "ok", mensagem: "Sobrescrito" })
        continue
      }

      const { error: alunoError } = await adminFetch<any>("alunos", {
        method: "POST",
        body: {
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
        },
      })

      if (alunoError) {
        logs.push({ nome: aluno.nome_completo, identificador: aluno.cpf || aluno.matricula || aluno.nome_completo, status: "erro", mensagem: alunoError })
        continue
      }

      for (const mat of aluno.matriculas) {
        const turmaId = mapping.turmas[mat.turma_id] || mat.turma_id

        await adminFetch("matriculas", {
          method: "POST",
          body: {
            id: mat.id,
            aluno_id: aluno.id,
            turma_id: turmaId,
            numero_matricula: mat.numero_matricula,
            ano_letivo: mat.ano_letivo,
            data_matricula: mat.data_matricula,
            status: mat.status,
            observacoes: mat.observacoes,
          },
        })
      }

      logs.push({ nome: aluno.nome_completo, identificador: aluno.cpf || aluno.matricula || aluno.nome_completo, status: "ok" })
    } catch (err: any) {
      logs.push({ nome: aluno.nome_completo, identificador: aluno.cpf || aluno.matricula || aluno.nome_completo, status: "erro", mensagem: err.message })
    }
  }

  return makeResult(mapping, logs)
}

// ---- IMPORT MATRICULAS ----

export async function importMatriculas(
  data: ExportMatriculaRowJson[],
  currentMapping: IdMapping,
  conflictStrategy: ConflictStrategy = "skip",
): Promise<ImportResult> {
  const authError = await checkAdminOrDirector()
  if (authError) return { total: 0, importados: 0, pulados: 0, erros: 1, logs: [{ nome: "Sistema", identificador: "", status: "erro", mensagem: authError.error }], mapping: currentMapping }

  const logs: ImportLogEntry[] = []
  const mapping: IdMapping = { ...currentMapping }
  mapping.matriculas = { ...(mapping.matriculas || {}) }

  const validation = validateData(data, ExportMatriculaRowJsonSchema)
  logSchemaErrors("Matriculas", validation.errors, logs)

  const { data: existingRows } = validation.valid.length > 0
    ? await adminFetch<any[]>("matriculas?select=id,numero_matricula")
    : { data: null }
  const existingIds = new Set(existingRows?.map((m: any) => m.id) || [])
  const existingByNumero = new Map<string, string>()
  for (const m of existingRows || []) {
    existingByNumero.set(String(m.numero_matricula), m.id)
  }

  for (const matricula of validation.valid) {
    try {
      const alunoId = mapping.profiles[matricula.aluno_id] || matricula.aluno_id
      const turmaId = mapping.turmas[matricula.turma_id] || matricula.turma_id
      const existing = existingIds.has(matricula.id)
        || existingByNumero.has(String(matricula.numero_matricula))

      if (existing) {
        if (conflictStrategy === "skip") {
          mapping.matriculas[matricula.id] = matricula.id
          logs.push({ nome: `Matricula #${matricula.numero_matricula}`, identificador: matricula.id, status: "pulado", mensagem: "Ja existe" })
          continue
        }

        const { error: deleteError } = await adminFetch(
          `matriculas?id=eq.${matricula.id}`,
          { method: "DELETE" }
        )

        if (deleteError) {
          logs.push({ nome: `Matricula #${matricula.numero_matricula}`, identificador: matricula.id, status: "erro", mensagem: deleteError })
          continue
        }
      }

      const { error: insertError } = await adminFetch<any>("matriculas", {
        method: "POST",
        body: {
          id: matricula.id,
          aluno_id: alunoId,
          turma_id: turmaId,
          numero_matricula: matricula.numero_matricula,
          ano_letivo: matricula.ano_letivo,
          data_matricula: matricula.data_matricula,
          status: matricula.status,
          observacoes: matricula.observacoes,
        },
      })

      if (insertError) {
        logs.push({ nome: `Matricula #${matricula.numero_matricula}`, identificador: matricula.id, status: "erro", mensagem: insertError })
        continue
      }

      mapping.matriculas[matricula.id] = matricula.id
      logs.push({ nome: `Matricula #${matricula.numero_matricula}`, identificador: matricula.id, status: "ok", mensagem: existing ? "Sobrescrito" : undefined })
    } catch (err: any) {
      logs.push({ nome: `Matricula #${matricula.numero_matricula}`, identificador: matricula.id, status: "erro", mensagem: err.message })
    }
  }

  return makeResult(mapping, logs)
}
