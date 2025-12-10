"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

function sanitizeFormData(formData: FormData, field: string): string | null {
  const value = formData.get(field) as string
  return value && value.trim() !== "" ? value.trim() : null
}

function sanitizeDateField(formData: FormData, field: string): string | null {
  const value = formData.get(field) as string
  return value && value.trim() !== "" ? value.trim() : null
}

function sanitizeBooleanField(formData: FormData, field: string): boolean {
  const value = formData.get(field) as string
  return value === "true"
}

export async function cadastrarAluno(formData: FormData) {
  const supabase = await createClient()

  const nomeCompleto = sanitizeFormData(formData, "nome_completo")
  const dataNascimento = sanitizeDateField(formData, "data_nascimento")

  console.log("[v0] Validando campos obrigatórios:", { nomeCompleto, dataNascimento })

  if (!nomeCompleto) {
    return { error: "Nome completo é obrigatório" }
  }

  if (!dataNascimento) {
    return { error: "Data de nascimento é obrigatória" }
  }

  const alunoData = {
    nome_completo: nomeCompleto,
    data_nascimento: dataNascimento,
    sexo: sanitizeFormData(formData, "sexo"),
    naturalidade: sanitizeFormData(formData, "naturalidade"),
    cpf: sanitizeFormData(formData, "cpf"),
    rg: sanitizeFormData(formData, "rg"),
    certidao_nascimento_numero: sanitizeFormData(formData, "certidao_nascimento_numero"),
    certidao_livro: sanitizeFormData(formData, "certidao_livro"),
    certidao_folha: sanitizeFormData(formData, "certidao_folha"),
    certidao_data_emissao: sanitizeDateField(formData, "certidao_data_emissao"),
    certidao_cartorio: sanitizeFormData(formData, "certidao_cartorio"),
    certidao_uf: sanitizeFormData(formData, "certidao_uf"),
    endereco: sanitizeFormData(formData, "endereco"),
    endereco_numero: sanitizeFormData(formData, "endereco_numero"),
    bairro: sanitizeFormData(formData, "bairro"),
    cidade: sanitizeFormData(formData, "cidade"),
    uf: sanitizeFormData(formData, "uf"),
    cep: sanitizeFormData(formData, "cep"),
    telefone_residencial: sanitizeFormData(formData, "telefone_residencial"),
    telefone_comercial: sanitizeFormData(formData, "telefone_comercial"),
    telefone: sanitizeFormData(formData, "telefone"),
    email: sanitizeFormData(formData, "email"),
    nome_mae: sanitizeFormData(formData, "nome_mae"),
    profissao_mae: sanitizeFormData(formData, "profissao_mae"),
    celular_mae: sanitizeFormData(formData, "celular_mae"),
    nome_pai: sanitizeFormData(formData, "nome_pai"),
    profissao_pai: sanitizeFormData(formData, "profissao_pai"),
    celular_pai: sanitizeFormData(formData, "celular_pai"),
    nome_responsavel: sanitizeFormData(formData, "nome_responsavel"),
    telefone_responsavel: sanitizeFormData(formData, "telefone_responsavel"),
    email_responsavel: sanitizeFormData(formData, "email_responsavel"),
    resp_fin_nome: sanitizeFormData(formData, "resp_fin_nome"),
    resp_fin_data_nascimento: sanitizeDateField(formData, "resp_fin_data_nascimento"),
    resp_fin_estado_civil: sanitizeFormData(formData, "resp_fin_estado_civil"),
    resp_fin_cpf: sanitizeFormData(formData, "resp_fin_cpf"),
    resp_fin_identidade: sanitizeFormData(formData, "resp_fin_identidade"),
    resp_fin_orgao_emissor: sanitizeFormData(formData, "resp_fin_orgao_emissor"),
    resp_fin_uf: sanitizeFormData(formData, "resp_fin_uf"),
    resp_fin_grau_parentesco: sanitizeFormData(formData, "resp_fin_grau_parentesco"),
    resp_fin_endereco: sanitizeFormData(formData, "resp_fin_endereco"),
    resp_fin_bairro: sanitizeFormData(formData, "resp_fin_bairro"),
    resp_fin_telefone: sanitizeFormData(formData, "resp_fin_telefone"),
    resp_fin_cidade: sanitizeFormData(formData, "resp_fin_cidade"),
    resp_fin_uf_endereco: sanitizeFormData(formData, "resp_fin_uf_endereco"),
    resp_fin_cep: sanitizeFormData(formData, "resp_fin_cep"),
    uso_medicamento_continuo: sanitizeBooleanField(formData, "uso_medicamento_continuo"),
    medicamento_continuo_qual: sanitizeFormData(formData, "medicamento_continuo_qual"),
    alergia_medicamento: sanitizeBooleanField(formData, "alergia_medicamento"),
    alergia_medicamento_qual: sanitizeFormData(formData, "alergia_medicamento_qual"),
    alergia_alimento: sanitizeBooleanField(formData, "alergia_alimento"),
    alergia_alimento_qual: sanitizeFormData(formData, "alergia_alimento_qual"),
    periodo_letivo: sanitizeFormData(formData, "periodo_letivo"),
    nivel: sanitizeFormData(formData, "nivel"),
    turno_preferencial: sanitizeFormData(formData, "turno_preferencial"),
    responsavel_matricula: sanitizeFormData(formData, "responsavel_matricula"),
    observacoes: sanitizeFormData(formData, "observacoes"),
    ativo: sanitizeBooleanField(formData, "ativo"),
  }

  console.log("[v0] Tentando cadastrar aluno:", alunoData.nome_completo)

  const { error } = await supabase.from("alunos").insert([alunoData])

  if (error) {
    console.error("[v0] Erro ao cadastrar aluno:", error)
    return { error: error.message }
  }

  console.log("[v0] Aluno cadastrado com sucesso")
  revalidatePath("/alunos")
  redirect("/alunos")
}

export async function atualizarAluno(id: string, formData: FormData) {
  const supabase = await createClient()

  const nomeCompleto = sanitizeFormData(formData, "nome_completo")
  const dataNascimento = sanitizeDateField(formData, "data_nascimento")

  if (!nomeCompleto) {
    return { error: "Nome completo é obrigatório" }
  }

  if (!dataNascimento) {
    return { error: "Data de nascimento é obrigatória" }
  }

  const alunoData = {
    nome_completo: nomeCompleto,
    data_nascimento: dataNascimento,
    sexo: sanitizeFormData(formData, "sexo"),
    naturalidade: sanitizeFormData(formData, "naturalidade"),
    cpf: sanitizeFormData(formData, "cpf"),
    rg: sanitizeFormData(formData, "rg"),
    certidao_nascimento_numero: sanitizeFormData(formData, "certidao_nascimento_numero"),
    certidao_livro: sanitizeFormData(formData, "certidao_livro"),
    certidao_folha: sanitizeFormData(formData, "certidao_folha"),
    certidao_data_emissao: sanitizeDateField(formData, "certidao_data_emissao"),
    certidao_cartorio: sanitizeFormData(formData, "certidao_cartorio"),
    certidao_uf: sanitizeFormData(formData, "certidao_uf"),
    endereco: sanitizeFormData(formData, "endereco"),
    endereco_numero: sanitizeFormData(formData, "endereco_numero"),
    bairro: sanitizeFormData(formData, "bairro"),
    cidade: sanitizeFormData(formData, "cidade"),
    uf: sanitizeFormData(formData, "uf"),
    cep: sanitizeFormData(formData, "cep"),
    telefone_residencial: sanitizeFormData(formData, "telefone_residencial"),
    telefone_comercial: sanitizeFormData(formData, "telefone_comercial"),
    telefone: sanitizeFormData(formData, "telefone"),
    email: sanitizeFormData(formData, "email"),
    nome_mae: sanitizeFormData(formData, "nome_mae"),
    profissao_mae: sanitizeFormData(formData, "profissao_mae"),
    celular_mae: sanitizeFormData(formData, "celular_mae"),
    nome_pai: sanitizeFormData(formData, "nome_pai"),
    profissao_pai: sanitizeFormData(formData, "profissao_pai"),
    celular_pai: sanitizeFormData(formData, "celular_pai"),
    nome_responsavel: sanitizeFormData(formData, "nome_responsavel"),
    telefone_responsavel: sanitizeFormData(formData, "telefone_responsavel"),
    email_responsavel: sanitizeFormData(formData, "email_responsavel"),
    resp_fin_nome: sanitizeFormData(formData, "resp_fin_nome"),
    resp_fin_data_nascimento: sanitizeDateField(formData, "resp_fin_data_nascimento"),
    resp_fin_estado_civil: sanitizeFormData(formData, "resp_fin_estado_civil"),
    resp_fin_cpf: sanitizeFormData(formData, "resp_fin_cpf"),
    resp_fin_identidade: sanitizeFormData(formData, "resp_fin_identidade"),
    resp_fin_orgao_emissor: sanitizeFormData(formData, "resp_fin_orgao_emissor"),
    resp_fin_uf: sanitizeFormData(formData, "resp_fin_uf"),
    resp_fin_grau_parentesco: sanitizeFormData(formData, "resp_fin_grau_parentesco"),
    resp_fin_endereco: sanitizeFormData(formData, "resp_fin_endereco"),
    resp_fin_bairro: sanitizeFormData(formData, "resp_fin_bairro"),
    resp_fin_telefone: sanitizeFormData(formData, "resp_fin_telefone"),
    resp_fin_cidade: sanitizeFormData(formData, "resp_fin_cidade"),
    resp_fin_uf_endereco: sanitizeFormData(formData, "resp_fin_uf_endereco"),
    resp_fin_cep: sanitizeFormData(formData, "resp_fin_cep"),
    uso_medicamento_continuo: sanitizeBooleanField(formData, "uso_medicamento_continuo"),
    medicamento_continuo_qual: sanitizeFormData(formData, "medicamento_continuo_qual"),
    alergia_medicamento: sanitizeBooleanField(formData, "alergia_medicamento"),
    alergia_medicamento_qual: sanitizeFormData(formData, "alergia_medicamento_qual"),
    alergia_alimento: sanitizeBooleanField(formData, "alergia_alimento"),
    alergia_alimento_qual: sanitizeFormData(formData, "alergia_alimento_qual"),
    periodo_letivo: sanitizeFormData(formData, "periodo_letivo"),
    nivel: sanitizeFormData(formData, "nivel"),
    turno_preferencial: sanitizeFormData(formData, "turno_preferencial"),
    responsavel_matricula: sanitizeFormData(formData, "responsavel_matricula"),
    observacoes: sanitizeFormData(formData, "observacoes"),
    ativo: sanitizeBooleanField(formData, "ativo"),
  }

  console.log("[v0] Tentando atualizar aluno:", id)

  const { error: updateError } = await supabase.from("alunos").update(alunoData).eq("id", id)

  if (updateError) {
    console.error("[v0] Erro ao atualizar aluno:", updateError)
    return { error: updateError.message }
  }

  console.log("[v0] Aluno atualizado com sucesso")
  revalidatePath("/alunos")
  revalidatePath(`/alunos/${id}`)
  redirect("/alunos")
}
