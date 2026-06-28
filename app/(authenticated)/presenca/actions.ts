"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { translateError } from "@/lib/error-messages"

export async function salvarAulaPresenca(params: {
  turmaDisciplinaId: string
  dataAula: string
  horaInicio: string
  horaFim: string
  conteudo: string
  presencas: Record<string, string>
  turmaId: string
  disciplinaId: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Usuário nao autenticado" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tipo_usuario")
    .eq("id", user.id)
    .single()

  if (!profile || !["admin", "diretor", "coordenacao", "professor"].includes(profile.tipo_usuario)) {
    return { error: "Acesso negado" }
  }

  const { data: aula, error: aulaError } = await supabase
    .from("aulas")
    .insert({
      turma_disciplina_id: params.turmaDisciplinaId,
      data_aula: params.dataAula,
      hora_inicio: params.horaInicio,
      hora_fim: params.horaFim,
      conteudo: params.conteudo,
    })
    .select()
    .single()

  if (aulaError) {
    return { error: translateError(aulaError.message) }
  }

  const presencasData = Object.entries(params.presencas).map(([alunoId, status]) => ({
    aula_id: aula.id,
    aluno_id: alunoId,
    presente: status === "presente",
    justificativa: status === "justificado" ? "Justificado" : null,
  }))

  const { error: presencaError } = await supabase.from("presencas").insert(presencasData)

  if (presencaError) {
    return { error: translateError(presencaError.message) }
  }

  revalidatePath(`/diario/${params.turmaId}/${params.disciplinaId}`)
  return { success: true }
}
