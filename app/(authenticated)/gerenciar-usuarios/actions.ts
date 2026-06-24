"use server"

import { createClient } from "@/lib/supabase/server"

export async function updateProfile(profileId: string, data: {
  nome_completo: string
  telefone: string
  tipo_usuario: string
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

  if (!profile || !["admin", "diretor"].includes(profile.tipo_usuario)) {
    return { error: "Apenas administradores e diretores podem alterar usuarios" }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      nome_completo: data.nome_completo,
      telefone: data.telefone,
      tipo_usuario: data.tipo_usuario,
    })
    .eq("id", profileId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
