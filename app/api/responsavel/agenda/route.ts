import { getResponsavelSession } from "@/lib/responsavel-auth"
import { createResponsavelClient } from "@/lib/supabase/responsavel-client"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await getResponsavelSession()
  if (!session) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  const supabase = createResponsavelClient()

  // Buscar dados do aluno via RPC
  const { data: alunoData } = await supabase
    .rpc("get_aluno_basico", { p_aluno_id: session.aluno_id })
    .single()

  const aluno = alunoData as { id: string; nome_completo: string; email_responsavel: string } | null

  // Buscar avisos via RPC
  const { data: avisosData } = await supabase
    .rpc("get_avisos_aluno", { p_aluno_id: session.aluno_id })
    .single()

  const avisos = (Array.isArray(avisosData) ? avisosData : []) as Array<{
    id: string
    titulo: string
    descricao: string
    tipo_aviso: string
    data_aviso: string
    hora_aviso: string
    created_at: string
  }>

  return NextResponse.json({ aluno, avisos })
}
