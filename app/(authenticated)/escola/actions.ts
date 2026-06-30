"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function saveEscolaData(data: {
  nome: string
  logradouro: string
  numero: string
  complemento: string
  cidade: string
  estado: string
  cep: string
  cnpj: string
  telefone: string
  telefone2: string
  email: string
  site: string
}) {
  try {
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

    const endereco = [data.logradouro, data.numero, data.complemento, `${data.cidade}/${data.estado}`]
      .filter(Boolean)
      .join(", ")

    const { data: existing } = await supabase.from("escola").select("id").limit(1).single()

    if (existing) {
      const { error } = await supabase
        .from("escola")
        .update({ ...data, endereco })
        .eq("id", existing.id)
      if (error) {
        console.error("Erro ao atualizar escola:", error)
        return { error: error.message }
      }
    } else {
      const { error } = await supabase
        .from("escola")
        .insert([{ ...data, endereco }])
      if (error) {
        console.error("Erro ao inserir escola:", error)
        return { error: error.message }
      }
    }

    revalidatePath("/escola")
    return { success: true }
  } catch (err) {
    console.error("Erro inesperado em saveEscolaData:", err)
    return { error: err instanceof Error ? err.message : "Erro interno do servidor" }
  }
}
