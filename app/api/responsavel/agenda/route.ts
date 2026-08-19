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

  // Buscar eventos escolares (agenda completa da escola)
  const { data: eventosData } = await supabase
    .from("eventos")
    .select("id, titulo, descricao, data_inicio, data_fim, hora_inicio, hora_fim, tipo_evento, local")
    .order("data_inicio", { ascending: true })

  const eventos = (eventosData || []) as Array<{
    id: string
    titulo: string
    descricao: string | null
    data_inicio: string
    data_fim: string | null
    hora_inicio: string | null
    hora_fim: string | null
    tipo_evento: string
    local: string | null
  }>

  return NextResponse.json({ aluno, avisos, eventos })
}
