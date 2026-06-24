"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function saveEscolaData(data: {
  nome: string
  endereco: string
  cnpj: string
  telefone: string
  email: string
  site: string
  logo_url: string
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

  if (!profile || !["admin", "coordenacao", "secretaria", "diretor"].includes(profile.tipo_usuario)) {
    return { error: "Sem permissao para alterar dados da escola" }
  }

  const { data: existing } = await supabase.from("escola").select("id").limit(1).single()

  if (existing) {
    const { error } = await supabase.from("escola").update(data).eq("id", existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from("escola").insert([data])
    if (error) return { error: error.message }
  }

  revalidatePath("/escola")
  return { success: true }
}
