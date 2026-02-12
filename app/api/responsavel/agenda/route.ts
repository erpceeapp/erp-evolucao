import { getResponsavelSession } from "@/lib/responsavel-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await getResponsavelSession()
  if (!session) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Buscar dados do aluno
  const { data: aluno } = await supabase
    .from("alunos")
    .select("id, nome_completo, email_responsavel")
    .eq("id", session.aluno_id)
    .single()

  // Buscar avisos do aluno
  const { data: avisos } = await supabase
    .from("avisos_aluno")
    .select("id, titulo, descricao, tipo_aviso, data_aviso, hora_aviso, created_at")
    .eq("aluno_id", session.aluno_id)
    .order("data_aviso", { ascending: false })

  return NextResponse.json({ aluno, avisos: avisos || [] })
}
