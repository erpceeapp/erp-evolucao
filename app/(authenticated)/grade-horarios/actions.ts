"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { TurmaDisciplinaInfo, GradeSlot } from "@/types/entities"

interface SalvarSlotInput {
  turma_disciplina_id: string
  dia_semana: number
  hora_inicio: string
  hora_fim: string
}

export async function listarTurmaDisciplinas(turmaId: string): Promise<TurmaDisciplinaInfo[]> {
  const supabase = await createClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData?.user) throw new Error("Não autenticado")

  const { data, error } = await supabase
    .from("turma_disciplinas")
    .select(`
      id, turma_id, disciplina_id, professor_id,
      turmas!turma_disciplinas_turma_id_fkey!inner(id, nome, serie),
      disciplinas!turma_disciplinas_disciplina_id_fkey!inner(id, nome, codigo),
      professores!turma_disciplinas_professor_id_fkey(id, nome_completo)
    `)
    .eq("turma_id", turmaId)

  if (error) throw new Error(`Erro ao carregar disciplinas da turma: ${error.message}`)

  return (data || []).map((td: any) => ({
    id: td.id,
    turma_id: td.turma_id,
    disciplina_id: td.disciplina_id,
    professor_id: td.professor_id,
    turma_nome: td.turmas?.nome || "",
    turma_serie: td.turmas?.serie || "",
    disciplina_nome: td.disciplinas?.nome || "",
    disciplina_codigo: td.disciplinas?.codigo || "",
    professor_nome: td.professores?.nome_completo || null,
    tem_professor: !!td.professor_id,
  }))
}

export async function listarGrade(
  filtroTipo: "turma" | "professor",
  filtroId: string,
): Promise<GradeSlot[]> {
  const supabase = await createClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData?.user) throw new Error("Não autenticado")

  let query = supabase
    .from("grade_horarios")
    .select(`
      id, turma_disciplina_id, dia_semana, hora_inicio, hora_fim,
      turma_disciplinas!inner(
        turma_id,
        disciplina_id,
        professor_id,
        turmas!turma_disciplinas_turma_id_fkey!inner(id, nome, serie),
        disciplinas!turma_disciplinas_disciplina_id_fkey!inner(id, nome, codigo),
        professores!turma_disciplinas_professor_id_fkey(id, nome_completo)
      )
    `)

  if (filtroTipo === "turma") {
    query = query.eq("turma_disciplinas.turma_id", filtroId)
  } else {
    query = query
      .not("turma_disciplinas.professor_id", "is", null)
      .eq("turma_disciplinas.professor_id", filtroId)
  }

  const { data, error } = await query.order("dia_semana").order("hora_inicio")
  if (error) throw new Error(`Erro ao carregar grade horária: ${error.message}`)

  return (data || []).map((item: any) => ({
    id: item.id,
    turma_disciplina_id: item.turma_disciplina_id,
    dia_semana: item.dia_semana,
    hora_inicio: item.hora_inicio,
    hora_fim: item.hora_fim,
    turma_nome: item.turma_disciplinas?.turmas?.nome || "",
    turma_serie: item.turma_disciplinas?.turmas?.serie || "",
    disciplina_nome: item.turma_disciplinas?.disciplinas?.nome || "",
    disciplina_codigo: item.turma_disciplinas?.disciplinas?.codigo || "",
    professor_id: item.turma_disciplinas?.professor_id,
    professor_nome: item.turma_disciplinas?.professores?.nome_completo || null,
  }))
}

export async function salvarSlot(input: SalvarSlotInput): Promise<void> {
  const supabase = await createClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData?.user) throw new Error("Não autenticado")

  const { data: td, error: tdError } = await supabase
    .from("turma_disciplinas")
    .select("professor_id")
    .eq("id", input.turma_disciplina_id)
    .single()

  if (tdError || !td) throw new Error("Disciplina não encontrada")
  if (!td.professor_id) throw new Error("Disciplina sem professor associado")
  if (input.hora_fim <= input.hora_inicio) throw new Error("Hora fim deve ser maior que hora início")

  const { data: professorTds } = await supabase
    .from("turma_disciplinas")
    .select("id")
    .eq("professor_id", td.professor_id)

  const tdIds = professorTds?.map((t) => t.id) || []
  if (tdIds.length > 0) {
    const { data: conflicts } = await supabase
      .from("grade_horarios")
      .select("id")
      .eq("dia_semana", input.dia_semana)
      .in("turma_disciplina_id", tdIds)
      .lt("hora_inicio", input.hora_fim)
      .gt("hora_fim", input.hora_inicio)

    if (conflicts && conflicts.length > 0) {
      throw new Error("Professor já possui aula neste horário")
    }
  }

  const { error } = await supabase.from("grade_horarios").insert({
    turma_disciplina_id: input.turma_disciplina_id,
    dia_semana: input.dia_semana,
    hora_inicio: input.hora_inicio,
    hora_fim: input.hora_fim,
  })

  if (error) throw new Error(`Erro ao salvar horário: ${error.message}`)
  revalidatePath("/grade-horarios")
}

export async function removerSlot(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData?.user) throw new Error("Não autenticado")

  const { error } = await supabase.from("grade_horarios").delete().eq("id", id)
  if (error) throw new Error(`Erro ao remover horário: ${error.message}`)
  revalidatePath("/grade-horarios")
}
