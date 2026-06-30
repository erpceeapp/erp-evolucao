"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function salvarAviso(params: {
  alunoId: string
  titulo: string
  descricao: string | null
  tipo_aviso: string
  data_aviso: string
  hora_aviso: string | null
  editingAvisoId?: string
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

  if (!profile || !["admin", "diretor", "coordenacao", "secretaria", "professor"].includes(profile.tipo_usuario)) {
    return { error: "Acesso negado" }
  }

  if (params.editingAvisoId) {
    const { error } = await supabase
      .from("avisos_aluno")
      .update({
        titulo: params.titulo,
        descricao: params.descricao,
        tipo_aviso: params.tipo_aviso,
        data_aviso: params.data_aviso,
        hora_aviso: params.hora_aviso,
      })
      .eq("id", params.editingAvisoId)

    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from("avisos_aluno").insert({
      aluno_id: params.alunoId,
      titulo: params.titulo,
      descricao: params.descricao,
      tipo_aviso: params.tipo_aviso,
      data_aviso: params.data_aviso,
      hora_aviso: params.hora_aviso,
      created_by: user.id,
    })

    if (error) return { error: error.message }
  }

  revalidatePath(`/agenda-aluno/${params.alunoId}`)
  return { success: true }
}

export async function deletarAviso(avisoId: string, alunoId: string) {
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

  if (!profile || !["admin", "diretor", "coordenacao", "secretaria", "professor"].includes(profile.tipo_usuario)) {
    return { error: "Acesso negado" }
  }

  const { error } = await supabase
    .from("avisos_aluno")
    .delete()
    .eq("id", avisoId)

  if (error) return { error: error.message }

  revalidatePath(`/agenda-aluno/${alunoId}`)
  return { success: true }
}
