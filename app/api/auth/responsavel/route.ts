import { createAdminClient } from "@/lib/supabase/admin"
import { createResponsavelSession } from "@/lib/responsavel-auth"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email_responsavel, cpf } = await request.json()

    if (!email_responsavel || !cpf) {
      return NextResponse.json(
        { error: "Email do responsavel e CPF do aluno sao obrigatorios" },
        { status: 400 }
      )
    }

    // Limpar CPF (remover formatacao)
    const cpfLimpo = cpf.replace(/[^0-9]/g, "")
    const emailLimpo = email_responsavel.trim().toLowerCase()

    console.log("[v0] Login responsavel - email:", emailLimpo, "cpf:", cpfLimpo)

    const supabase = createAdminClient()

    // Buscar aluno pelo email do responsavel e CPF
    // Primeiro buscar sem .single() para ver quantos resultados retornam
    const { data: alunos, error: searchError } = await supabase
      .from("alunos")
      .select("id, nome_completo, cpf, email_responsavel, ativo")
      .ilike("email_responsavel", emailLimpo)
      .eq("ativo", true)

    console.log("[v0] Alunos encontrados por email:", alunos?.length, "erro:", searchError?.message)
    
    if (alunos && alunos.length > 0) {
      console.log("[v0] CPFs dos alunos encontrados:", alunos.map(a => ({ cpf: a.cpf, nome: a.nome_completo })))
    }

    // Agora filtrar pelo CPF
    const aluno = alunos?.find(a => a.cpf === cpfLimpo)

    console.log("[v0] Aluno encontrado pelo CPF:", aluno?.nome_completo)

    if (!aluno) {
      // Se nao encontrou, tentar busca direta para debug
      const { data: alunoDirecto, error: directError } = await supabase
        .from("alunos")
        .select("id, nome_completo, cpf, email_responsavel")
        .eq("cpf", cpfLimpo)
        .eq("ativo", true)
        .maybeSingle()

      console.log("[v0] Busca direta por CPF:", alunoDirecto?.nome_completo, "email cadastrado:", alunoDirecto?.email_responsavel, "erro:", directError?.message)

      return NextResponse.json(
        { error: "Dados invalidos. Verifique o email do responsavel e o CPF do aluno." },
        { status: 401 }
      )
    }

    // Buscar turma do aluno
    const { data: matricula } = await supabase
      .from("matriculas")
      .select("turma_id")
      .eq("aluno_id", aluno.id)
      .neq("status", "cancelada")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    let turmaNome: string | undefined
    if (matricula?.turma_id) {
      const { data: turma } = await supabase
        .from("turmas")
        .select("nome")
        .eq("id", matricula.turma_id)
        .single()
      turmaNome = turma?.nome
    }

    // Criar sessao JWT
    await createResponsavelSession({
      email_responsavel: aluno.email_responsavel,
      aluno_id: aluno.id,
      aluno_nome: aluno.nome_completo,
      aluno_cpf: aluno.cpf,
      turma_nome: turmaNome,
    })

    return NextResponse.json({
      success: true,
      aluno_nome: aluno.nome_completo,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro interno. Tente novamente mais tarde." },
      { status: 500 }
    )
  }
}
