"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function cadastrarAluno(formData: FormData) {
  const supabase = await createClient()

  const alunoData = {
    nome_completo: formData.get("nome_completo") as string,
    data_nascimento: formData.get("data_nascimento") as string,
    sexo: formData.get("sexo") as string,
    naturalidade: formData.get("naturalidade") as string,
    cpf: formData.get("cpf") as string,
    rg: formData.get("rg") as string,
    certidao_nascimento_numero: formData.get("certidao_nascimento_numero") as string,
    certidao_livro: formData.get("certidao_livro") as string,
    certidao_folha: formData.get("certidao_folha") as string,
    certidao_data_emissao: formData.get("certidao_data_emissao") as string,
    certidao_cartorio: formData.get("certidao_cartorio") as string,
    certidao_uf: formData.get("certidao_uf") as string,
    endereco: formData.get("endereco") as string,
    endereco_numero: formData.get("endereco_numero") as string,
    bairro: formData.get("bairro") as string,
    cidade: formData.get("cidade") as string,
    uf: formData.get("uf") as string,
    cep: formData.get("cep") as string,
    telefone_residencial: formData.get("telefone_residencial") as string,
    telefone_comercial: formData.get("telefone_comercial") as string,
    telefone: formData.get("telefone") as string,
    email: formData.get("email") as string,
    nome_mae: formData.get("nome_mae") as string,
    profissao_mae: formData.get("profissao_mae") as string,
    celular_mae: formData.get("celular_mae") as string,
    nome_pai: formData.get("nome_pai") as string,
    profissao_pai: formData.get("profissao_pai") as string,
    celular_pai: formData.get("celular_pai") as string,
    nome_responsavel: formData.get("nome_responsavel") as string,
    telefone_responsavel: formData.get("telefone_responsavel") as string,
    email_responsavel: formData.get("email_responsavel") as string,
    resp_fin_nome: formData.get("resp_fin_nome") as string,
    resp_fin_data_nascimento: formData.get("resp_fin_data_nascimento") as string,
    resp_fin_estado_civil: formData.get("resp_fin_estado_civil") as string,
    resp_fin_cpf: formData.get("resp_fin_cpf") as string,
    resp_fin_identidade: formData.get("resp_fin_identidade") as string,
    resp_fin_orgao_emissor: formData.get("resp_fin_orgao_emissor") as string,
    resp_fin_uf: formData.get("resp_fin_uf") as string,
    resp_fin_grau_parentesco: formData.get("resp_fin_grau_parentesco") as string,
    resp_fin_endereco: formData.get("resp_fin_endereco") as string,
    resp_fin_bairro: formData.get("resp_fin_bairro") as string,
    resp_fin_telefone: formData.get("resp_fin_telefone") as string,
    resp_fin_cidade: formData.get("resp_fin_cidade") as string,
    resp_fin_uf_endereco: formData.get("resp_fin_uf_endereco") as string,
    resp_fin_cep: formData.get("resp_fin_cep") as string,
    uso_medicamento_continuo: formData.get("uso_medicamento_continuo") === "true",
    medicamento_continuo_qual: formData.get("medicamento_continuo_qual") as string,
    alergia_medicamento: formData.get("alergia_medicamento") === "true",
    alergia_medicamento_qual: formData.get("alergia_medicamento_qual") as string,
    alergia_alimento: formData.get("alergia_alimento") === "true",
    alergia_alimento_qual: formData.get("alergia_alimento_qual") as string,
    periodo_letivo: formData.get("periodo_letivo") as string,
    nivel: formData.get("nivel") as string,
    turno_preferencial: formData.get("turno_preferencial") as string,
    responsavel_matricula: formData.get("responsavel_matricula") as string,
    observacoes: formData.get("observacoes") as string,
    ativo: formData.get("ativo") === "true",
  }

  console.log("[v0] Tentando cadastrar aluno:", alunoData.nome_completo)

  const { error } = await supabase.from("alunos").insert([alunoData])

  if (error) {
    console.error("[v0] Erro ao cadastrar aluno:", error)
    throw new Error(error.message)
  }

  console.log("[v0] Aluno cadastrado com sucesso")
  revalidatePath("/alunos")
  redirect("/alunos")
}

export async function atualizarAluno(id: string, formData: FormData) {
  const supabase = await createClient()

  const alunoData = {
    nome_completo: formData.get("nome_completo") as string,
    data_nascimento: formData.get("data_nascimento") as string,
    sexo: formData.get("sexo") as string,
    naturalidade: formData.get("naturalidade") as string,
    cpf: formData.get("cpf") as string,
    rg: formData.get("rg") as string,
    certidao_nascimento_numero: formData.get("certidao_nascimento_numero") as string,
    certidao_livro: formData.get("certidao_livro") as string,
    certidao_folha: formData.get("certidao_folha") as string,
    certidao_data_emissao: formData.get("certidao_data_emissao") as string,
    certidao_cartorio: formData.get("certidao_cartorio") as string,
    certidao_uf: formData.get("certidao_uf") as string,
    endereco: formData.get("endereco") as string,
    endereco_numero: formData.get("endereco_numero") as string,
    bairro: formData.get("bairro") as string,
    cidade: formData.get("cidade") as string,
    uf: formData.get("uf") as string,
    cep: formData.get("cep") as string,
    telefone_residencial: formData.get("telefone_residencial") as string,
    telefone_comercial: formData.get("telefone_comercial") as string,
    telefone: formData.get("telefone") as string,
    email: formData.get("email") as string,
    nome_mae: formData.get("nome_mae") as string,
    profissao_mae: formData.get("profissao_mae") as string,
    celular_mae: formData.get("celular_mae") as string,
    nome_pai: formData.get("nome_pai") as string,
    profissao_pai: formData.get("profissao_pai") as string,
    celular_pai: formData.get("celular_pai") as string,
    nome_responsavel: formData.get("nome_responsavel") as string,
    telefone_responsavel: formData.get("telefone_responsavel") as string,
    email_responsavel: formData.get("email_responsavel") as string,
    resp_fin_nome: formData.get("resp_fin_nome") as string,
    resp_fin_data_nascimento: formData.get("resp_fin_data_nascimento") as string,
    resp_fin_estado_civil: formData.get("resp_fin_estado_civil") as string,
    resp_fin_cpf: formData.get("resp_fin_cpf") as string,
    resp_fin_identidade: formData.get("resp_fin_identidade") as string,
    resp_fin_orgao_emissor: formData.get("resp_fin_orgao_emissor") as string,
    resp_fin_uf: formData.get("resp_fin_uf") as string,
    resp_fin_grau_parentesco: formData.get("resp_fin_grau_parentesco") as string,
    resp_fin_endereco: formData.get("resp_fin_endereco") as string,
    resp_fin_bairro: formData.get("resp_fin_bairro") as string,
    resp_fin_telefone: formData.get("resp_fin_telefone") as string,
    resp_fin_cidade: formData.get("resp_fin_cidade") as string,
    resp_fin_uf_endereco: formData.get("resp_fin_uf_endereco") as string,
    resp_fin_cep: formData.get("resp_fin_cep") as string,
    uso_medicamento_continuo: formData.get("uso_medicamento_continuo") === "true",
    medicamento_continuo_qual: formData.get("medicamento_continuo_qual") as string,
    alergia_medicamento: formData.get("alergia_medicamento") === "true",
    alergia_medicamento_qual: formData.get("alergia_medicamento_qual") as string,
    alergia_alimento: formData.get("alergia_alimento") === "true",
    alergia_alimento_qual: formData.get("alergia_alimento_qual") as string,
    periodo_letivo: formData.get("periodo_letivo") as string,
    nivel: formData.get("nivel") as string,
    turno_preferencial: formData.get("turno_preferencial") as string,
    responsavel_matricula: formData.get("responsavel_matricula") as string,
    observacoes: formData.get("observacoes") as string,
    ativo: formData.get("ativo") === "true",
  }

  console.log("[v0] Tentando atualizar aluno:", id)

  const { error } = await supabase.from("alunos").update(alunoData).eq("id", id)

  if (error) {
    console.error("[v0] Erro ao atualizar aluno:", error)
    throw new Error(error.message)
  }

  console.log("[v0] Aluno atualizado com sucesso")
  revalidatePath("/alunos")
  revalidatePath(`/alunos/${id}`)
  redirect("/alunos")
}
