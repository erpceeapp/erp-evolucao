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

    const supabase = createAdminClient()

    // Buscar aluno pelo email do responsavel e CPF
    const { data: aluno, error } = await supabase
      .from("alunos")
      .select("id, nome_completo, cpf, email_responsavel")
      .ilike("email_responsavel", email_responsavel.trim())
      .eq("cpf", cpfLimpo)
      .eq("ativo", true)
      .single()

    if (error || !aluno) {
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
    console.error("[v0] Erro no login do responsavel:", error)
    return NextResponse.json(
      { error: "Erro interno. Tente novamente mais tarde." },
      { status: 500 }
    )
  }
}
