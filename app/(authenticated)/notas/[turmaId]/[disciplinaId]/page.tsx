import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import PageHeader from "@/components/page-header"
import { NotasTable } from "@/components/notas/notas-table"

async function getNotasData(turmaId: string, disciplinaId: string) {
  const supabase = await createServerClient()

  const [turmaResult, disciplinaResult] = await Promise.all([
    supabase.from("turmas").select("*").eq("id", turmaId).single(),
    supabase.from("disciplinas").select("*").eq("id", disciplinaId).single(),
  ])

  if (turmaResult.error || disciplinaResult.error) {
    console.error("Erro ao buscar dados:", turmaResult.error || disciplinaResult.error)
    return null
  }

  // Buscar matrículas sem embed
  const { data: matriculas, error: matriculasError } = await supabase
    .from("matriculas")
    .select("id, aluno_id, numero_matricula")
    .eq("turma_id", turmaId)
    .eq("status", "ativa")

  if (matriculasError) {
    console.error("Erro ao buscar matrículas:", matriculasError)
    return { turma: turmaResult.data, disciplina: disciplinaResult.data, matriculas: [] }
  }

  // Buscar alunos separadamente
  const alunoIds = matriculas?.map((m) => m.aluno_id) || []
  const { data: alunos, error: alunosError } = await supabase
    .from("alunos")
    .select("id, nome_completo, matricula")
    .in("id", alunoIds)

  if (alunosError) {
    console.error("Erro ao buscar alunos:", alunosError)
  }

  // Combinar dados manualmente
  const matriculasComAlunos = matriculas?.map((matricula) => {
    const aluno = alunos?.find((a) => a.id === matricula.aluno_id)
    return {
      ...matricula,
      alunos: aluno || null,
    }
  })

  const matriculaIds = matriculas?.map((m) => m.id) || []
  const { data: notas, error: notasError } = await supabase
    .from("notas")
    .select("*")
    .eq("disciplina_id", disciplinaId)
    .in("matricula_id", matriculaIds)

  if (notasError) {
    console.error("Erro ao buscar notas:", notasError)
  }

  return {
    turma: turmaResult.data,
    disciplina: disciplinaResult.data,
    matriculas: matriculasComAlunos || [],
    notas: notas || [],
  }
}

export default async function NotasDetailPage({
  params,
}: {
  params: { turmaId: string; disciplinaId: string }
}) {
  const { turmaId, disciplinaId } = params
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const data = await getNotasData(turmaId, disciplinaId)

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-600">Erro ao carregar dados. Tente novamente.</p>
            <Button asChild className="mt-4">
              <Link href="/notas">Voltar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        icon={GraduationCap}
        title={`Notas - ${data.disciplina.nome}`}
        subtitle={`${data.turma.nome} (${data.turma.serie}) - ${data.turma.ano_letivo}`}
        backHref="/notas"
      />
      <div className="container mx-auto p-6 space-y-6">
        <NotasTable
          turmaId={turmaId}
          disciplinaId={disciplinaId}
          matriculas={data.matriculas}
          notasExistentes={data.notas}
        />
      </div>
    </>
  )
}
