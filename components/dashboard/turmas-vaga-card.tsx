import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DoorOpen } from "lucide-react"

export async function TurmasVagaCard() {
  const supabase = await createClient()

  const { data: turmas } = await supabase
    .from("turmas")
    .select("id, nome, capacidade_maxima, serie, turno, ano_letivo")
    .eq("ativo", true)
    .order("nome")

  if (!turmas || turmas.length === 0) return null

  const result = await Promise.all(
    turmas.map(async (turma) => {
      const { count } = await supabase
        .from("matriculas")
        .select("*", { count: "exact", head: true })
        .eq("turma_id", turma.id)
        .eq("status", "ativa")

      const matriculados = count || 0
      const vagas = turma.capacidade_maxima - matriculados

      return { ...turma, matriculados, vagas }
    }),
  )

  const comVaga = result.filter((t) => t.vagas > 0).sort((a, b) => b.vagas - a.vagas)

  if (comVaga.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <DoorOpen className="h-5 w-5 text-green-600" />
          Turmas com Vagas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {comVaga.map((turma) => (
            <div key={turma.id} className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium">{turma.nome}</span>
                <span className="text-gray-500 ml-2">
                  {turma.serie} · {turma.turno}
                </span>
              </div>
              <span className="text-green-600 font-semibold tabular-nums">
                {turma.vagas} vaga{turma.vagas !== 1 ? "s" : ""}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
