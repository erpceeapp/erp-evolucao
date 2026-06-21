import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"

export async function MatriculasPendentesCard() {
  const supabase = await createClient()

  const { data: matriculas } = await supabase
    .from("matriculas")
    .select("id, numero_matricula, status, data_matricula, aluno_id, turma_id")
    .neq("status", "ativa")
    .order("data_matricula", { ascending: false })
    .limit(10)

  if (!matriculas || matriculas.length === 0) return null

  const alunoIds = [...new Set(matriculas.map((m) => m.aluno_id))]
  const turmaIds = [...new Set(matriculas.map((m) => m.turma_id))]

  const [alunosRes, turmasRes] = await Promise.all([
    supabase.from("alunos").select("id, nome_completo").in("id", alunoIds),
    supabase.from("turmas").select("id, nome").in("id", turmaIds),
  ])

  const alunos = new Map((alunosRes.data || []).map((a) => [a.id, a.nome_completo]))
  const turmas = new Map((turmasRes.data || []).map((t) => [t.id, t.nome]))

  const statusLabels: Record<string, string> = {
    transferida: "Transferida",
    cancelada: "Cancelada",
    concluida: "Concluída",
    trancada: "Trancada",
  }

  const statusColors: Record<string, string> = {
    transferida: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    cancelada: "bg-red-100 text-red-800 hover:bg-red-100",
    concluida: "bg-green-100 text-green-800 hover:bg-green-100",
    trancada: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Matrículas Pendentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {matriculas.map((m) => (
            <div key={m.id} className="flex items-center justify-between text-sm">
              <div className="min-w-0">
                <div className="font-medium truncate">{alunos.get(m.aluno_id) || "—"}</div>
                <div className="text-gray-500 text-xs">{turmas.get(m.turma_id) || "—"}</div>
              </div>
              <Badge className={statusColors[m.status] || ""} variant="outline">
                {statusLabels[m.status] || m.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
