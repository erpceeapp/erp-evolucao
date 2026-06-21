import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserX } from "lucide-react"

export async function AlunosSemMatriculaCard() {
  const supabase = await createClient()

  const anoLetivo = new Date().getFullYear()

  const { data: alunos } = await supabase
    .from("alunos")
    .select("id, nome_completo, matricula")
    .eq("ativo", true)
    .order("nome_completo")

  if (!alunos || alunos.length === 0) return null

  const result = await Promise.all(
    alunos.map(async (aluno) => {
      const { count } = await supabase
        .from("matriculas")
        .select("*", { count: "exact", head: true })
        .eq("aluno_id", aluno.id)
        .eq("ano_letivo", anoLetivo)

      return { ...aluno, temMatricula: (count || 0) > 0 }
    }),
  )

  const semMatricula = result.filter((a) => !a.temMatricula)

  if (semMatricula.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserX className="h-5 w-5 text-amber-600" />
          Alunos sem Matrícula ({anoLetivo})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {semMatricula.map((aluno) => (
            <div key={aluno.id} className="flex items-center justify-between text-sm">
              <span>{aluno.nome_completo}</span>
              {aluno.matricula && (
                <span className="text-gray-400 font-mono text-xs">{aluno.matricula}</span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
