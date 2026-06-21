"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function deleteEvento(eventoId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Usuário nao autenticado" }
  }

  const { data: evento } = await supabase
    .from("eventos")
    .select("created_by")
    .eq("id", eventoId)
    .single()

  if (!evento) {
    return { error: "Evento nao encontrado" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tipo_usuario")
    .eq("id", user.id)
    .single()

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
