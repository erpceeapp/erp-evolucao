"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { alunoFormSchema } from "@/lib/schemas/aluno"
import { translateError } from "@/lib/error-messages"

export async function cadastrarAluno(formData: FormData) {
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

  if (!profile || !["admin", "secretaria", "diretor"].includes(profile.tipo_usuario)) {
    return { error: "Sem permissão para cadastrar alunos" }
  }

  const raw = Object.fromEntries(formData.entries())
  const parsed = alunoFormSchema.safeParse({
    ...raw,
    uso_medicamento_continuo: raw.uso_medicamento_continuo === "true",
    alergia_medicamento: raw.alergia_medicamento === "true",
    alergia_alimento: raw.alergia_alimento === "true",
    ativo: raw.ativo === "true",
  })

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { error: `${firstError.path.join(".")}: ${firstError.message}` }
  }

  const alunoData = parsed.data

  const { error } = await supabase.from("alunos").insert([alunoData])

  if (error) {
    return { error: translateError(error.message) }
  }

  revalidatePath("/alunos")
  redirect("/alunos")
}

export async function atualizarAluno(id: string, formData: FormData) {
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

  if (!profile || !["admin", "secretaria", "diretor"].includes(profile.tipo_usuario)) {
    return { error: "Sem permissão para alterar alunos" }
  }

  const raw = Object.fromEntries(formData.entries())
  const parsed = alunoFormSchema.safeParse({
    ...raw,
    uso_medicamento_continuo: raw.uso_medicamento_continuo === "true",
    alergia_medicamento: raw.alergia_medicamento === "true",
    alergia_alimento: raw.alergia_alimento === "true",
    ativo: raw.ativo === "true",
  })

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { error: `${firstError.path.join(".")}: ${firstError.message}` }
  }

  const { error: updateError } = await supabase.from("alunos").update(parsed.data).eq("id", id)

  if (updateError) {
    return { error: translateError(updateError.message) }
  }

  revalidatePath("/alunos")
  revalidatePath(`/alunos/${id}`)
  redirect("/alunos")
}
