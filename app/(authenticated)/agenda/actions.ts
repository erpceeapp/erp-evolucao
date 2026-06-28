"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createEvento(formData: {
  titulo: string
  descricao: string | null
  data_inicio: string
  data_fim: string | null
  hora_inicio: string | null
  hora_fim: string | null
  tipo_evento: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Usuário não autenticado" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tipo_usuario")
    .eq("id", user.id)
    .single()

  if (profile?.tipo_usuario === "professor") {
    return { error: "Professores não podem criar eventos" }
  }

  const { error } = await supabase.from("eventos").insert([
    {
      titulo: formData.titulo,
      descricao: formData.descricao,
      data_inicio: formData.data_inicio,
      data_fim: formData.data_fim || formData.data_inicio,
      hora_inicio: formData.hora_inicio || null,
      hora_fim: formData.hora_fim || null,
      tipo_evento: formData.tipo_evento,
      created_by: user.id,
    },
  ])

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/agenda")
  return { success: true }
}

export async function updateEvento(
  eventoId: string,
  formData: {
    titulo: string
    descricao: string | null
    data_inicio: string
    data_fim: string | null
    hora_inicio: string | null
    hora_fim: string | null
    tipo_evento: string
  },
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Usuário não autenticado" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tipo_usuario")
    .eq("id", user.id)
    .single()

  if (profile?.tipo_usuario === "professor") {
    return { error: "Professores não podem editar eventos" }
  }

  const { data: evento } = await supabase
    .from("eventos")
    .select("created_by")
    .eq("id", eventoId)
    .single()

  if (!evento) {
    return { error: "Evento não encontrado" }
  }

  const isAdmin = profile && ["admin", "diretor"].includes(profile.tipo_usuario)

  if (!isAdmin && evento.created_by !== user.id) {
    return { error: "Você não tem permissão para editar este evento" }
  }

  const { error } = await supabase
    .from("eventos")
    .update({
      titulo: formData.titulo,
      descricao: formData.descricao,
      data_inicio: formData.data_inicio,
      data_fim: formData.data_fim || formData.data_inicio,
      hora_inicio: formData.hora_inicio || null,
      hora_fim: formData.hora_fim || null,
      tipo_evento: formData.tipo_evento,
    })
    .eq("id", eventoId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/agenda")
  return { success: true }
}

export async function deleteEvento(eventoId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Usuario nao autenticado" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tipo_usuario")
    .eq("id", user.id)
    .single()

  if (profile?.tipo_usuario === "professor") {
    return { error: "Professores não podem excluir eventos" }
  }

  const { data: evento } = await supabase
    .from("eventos")
    .select("created_by")
    .eq("id", eventoId)
    .single()

  if (!evento) {
    return { error: "Evento nao encontrado" }
  }

  const isAdmin = profile && ["admin", "diretor"].includes(profile.tipo_usuario)

  if (!isAdmin && evento.created_by !== user.id) {
    return { error: "Você nao tem permissao para excluir este evento" }
  }

  const { error } = await supabase.from("eventos").delete().eq("id", eventoId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/agenda")
  return { success: true }
}
