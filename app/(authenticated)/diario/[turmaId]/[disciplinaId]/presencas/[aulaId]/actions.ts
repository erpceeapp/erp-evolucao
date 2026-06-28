"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function salvarPresencas(aulaId: string, presencas: { id: string; presente: boolean; justificativa: string | null }[], path: string) {
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

  for (const presenca of presencas) {
    const { error } = await supabase
      .from("presencas")
      .update({
        presente: presenca.presente,
        justificativa: presenca.justificativa || null,
      })
      .eq("id", presenca.id)

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath(path)
  return { success: true }
}
