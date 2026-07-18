import { createResponsavelClient } from "@/lib/supabase/responsavel-client"
import { createResponsavelSession } from "@/lib/responsavel-auth"
import { NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"
import { validateRequestOrigin } from "@/lib/validate-params"

type AlunoResponsavel = {
  id: string
  nome_completo: string
  cpf: string
  email_responsavel: string
}

export async function POST(request: Request) {
  try {
    if (!validateRequestOrigin(request)) {
      return NextResponse.json({ error: "Origem nao permitida" }, { status: 403 })
    }

    const ip = request.headers.get("x-forwarded-for") ?? "anonymous"
    const { success } = await rateLimit(ip, 5, 60_000)
    if (!success) {
      return NextResponse.json(
        { error: "Muitas tentativas. Tente novamente em 1 minuto." },
        { status: 429 }
      )
    }

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

    const supabase = createResponsavelClient()

    // Usa SECURITY DEFINER RPC para buscar aluno
    const { data: aluno, error: searchError } = (await supabase
      .rpc("buscar_aluno_responsavel", {
        p_email: emailLimpo,
        p_cpf: cpfLimpo,
      })
      .maybeSingle()) as unknown as { data: AlunoResponsavel | null; error: any }

    if (searchError || !aluno) {
      return NextResponse.json(
        { error: "Dados invalidos. Verifique o email do responsavel e o CPF do aluno." },
        { status: 401 }
      )
    }

    // Buscar turma do aluno via RPC SECURITY DEFINER
    const { data: matricula } = (await supabase
      .rpc("get_matricula_ativa", {
        p_aluno_id: aluno.id,
      })
      .maybeSingle()) as unknown as { data: { id: string; turma_id: string; status: string; numero_matricula: string } | null; error: any }

    let turmaNome: string | undefined
    if (matricula?.turma_id) {
      const { data: turma } = (await supabase
        .rpc("get_turma", {
          p_turma_id: matricula.turma_id,
        })
        .maybeSingle()) as unknown as { data: { nome: string; serie: string; turno: string } | null; error: any }
      turmaNome = turma?.nome
    }

    // Criar sessao JWT e obter o token
    const token = await createResponsavelSession({
      email_responsavel: aluno.email_responsavel,
      aluno_id: aluno.id,
      aluno_nome: aluno.nome_completo,
      turma_nome: turmaNome,
    })

    // Criar resposta e definir o cookie manualmente
    const response = NextResponse.json({
      success: true,
      aluno_nome: aluno.nome_completo,
    })

    // Definir cookie na resposta (8 horas)
    response.cookies.set("responsavel-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 8,
      path: "/",
    })

    return response
  } catch (error: any) {
    console.error("[responsavel-auth] Erro interno:", error?.message || error, error?.stack || "")
    return NextResponse.json(
      { error: "Erro interno. Tente novamente mais tarde." },
      { status: 500 }
    )
  }
}
