"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function cadastrarAluno(formData: FormData) {
  const supabase = await createServerClient()

  const alunoData = {
    nome: formData.get("nome") as string,
    cpf: formData.get("cpf") as string,
    data_nascimento: formData.get("data_nascimento") as string,
    email: formData.get("email") as string,
    telefone: formData.get("telefone") as string,
    endereco: (formData.get("endereco") as string) || null,
    nome_responsavel: (formData.get("nome_responsavel") as string) || null,
    telefone_responsavel: (formData.get("telefone_responsavel") as string) || null,
    status: "ativo",
  }

  const { error } = await supabase.from("alunos").insert([alunoData])

  if (error) {
    console.error("Erro ao cadastrar aluno:", error)
    throw new Error("Erro ao cadastrar aluno")
  }

  revalidatePath("/alunos")
  redirect("/alunos")
}
