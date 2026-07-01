"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function deleteDisciplina(disciplinaId: string) {
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

  if (!profile || !["admin", "diretor"].includes(profile.tipo_usuario)) {
    return { error: "Apenas administradores e diretores podem excluir disciplinas" }
  }

  const { error } = await supabase.from("disciplinas").delete().eq("id", disciplinaId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/disciplinas")
  return { success: true }
}
