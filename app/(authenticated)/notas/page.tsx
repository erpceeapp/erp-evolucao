import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GraduationCap, BookOpen, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import PageHeader from "@/components/page-header"
import Link from "next/link"

type TurmaComDisciplinas = {
  id: string
  nome: string
  serie: string | null
  turno: string | null
  ano_letivo: number
  ativo: boolean
  disciplinas: { id: string; nome: string; codigo: string }[]
  totalAlunos: number
}

type SupabaseClient = Awaited<ReturnType<typeof createServerClient>>

async function getTurmasComDisciplinas(supabase: SupabaseClient): Promise<TurmaComDisciplinas[]> {
  const { data: { user } } = await supabase.auth.getUser()

  let filteredTurmaIds: string[] | null = null

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("tipo_usuario")
      .eq("id", user.id)
      .single()

    if (profile?.tipo_usuario === "professor") {
      const { data: professor } = await supabase
        .from("professores")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (professor) {
        const [tdResult, tResult] = await Promise.all([
          supabase.from("turma_disciplinas").select("turma_id").eq("professor_id", professor.id),
          supabase.from("turmas").select("id").eq("professor_responsavel_id", professor.id).eq("ativo", true),
        ])

        const idSet = new Set<string>()
        tdResult.data?.forEach((td) => idSet.add(td.turma_id))
        tResult.data?.forEach((t) => idSet.add(t.id))
        filteredTurmaIds = [...idSet]
      } else {
        filteredTurmaIds = []
      }
    }
  }

  let turmasQuery = supabase
    .from("turmas")
    .select("id, nome, serie, turno, ano_letivo, ativo")
    .eq("ativo", true)
    .order("nome")

  if (filteredTurmaIds !== null) {
    turmasQuery = filteredTurmaIds.length > 0
      ? turmasQuery.in("id", filteredTurmaIds)
      : turmasQuery.in("id", [])
  }

  const { data: turmas, error: turmasError } = await turmasQuery
  if (turmasError || !turmas) return []

  const turmaIds = turmas.map((t) => t.id)

  const [tdResult, matResult] = await Promise.all([
    supabase
      .from("turma_disciplinas")
      .select("id, turma_id, disciplina_id")
      .in("turma_id", turmaIds),
    supabase
      .from("matriculas")
      .select("turma_id")
      .in("turma_id", turmaIds)
      .eq("status", "ativa"),
  ])

  const turmaDisciplinas = tdResult.data || []
  const matriculas = matResult.data || []

  const disciplinaIds = [...new Set(turmaDisciplinas.map((td) => td.disciplina_id))]

  const { data: disciplinas } = await supabase
    .from("disciplinas")
    .select("id, nome, codigo")
    .in("id", disciplinaIds)

  const disciplinasMap = new Map(disciplinas?.map((d) => [d.id, d]) || [])

  return turmas.map((turma) => {
    const disciplinasDaTurma = turmaDisciplinas
      .filter((td) => td.turma_id === turma.id)
      .map((td) => disciplinasMap.get(td.disciplina_id))
      .filter((d): d is NonNullable<typeof d> => !!d)

    const totalAlunos = matriculas.filter((m) => m.turma_id === turma.id).length

    return { ...turma, disciplinas: disciplinasDaTurma, totalAlunos }
  })
}

export default async function NotasPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const turmas = await getTurmasComDisciplinas(supabase)

  return (
    <>
      <PageHeader
        icon={GraduationCap}
        title="Gestao de Notas"
        subtitle="Selecione uma turma e disciplina para lancar notas"
        backHref="/dashboard"
      />
      {turmas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma turma encontrada</h3>
              <p className="text-gray-600">Cadastre turmas e vincule disciplinas para comecar a lancar notas.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {turmas.map((turma) => (
              <Card key={turma.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{turma.nome}</CardTitle>
                      <CardDescription>
                        {turma.serie} - {turma.turno} - {turma.ano_letivo}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {turma.totalAlunos}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {turma.disciplinas.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nenhuma disciplina vinculada
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Disciplinas
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {turma.disciplinas.map((disciplina) => (
                          <Link
                            key={disciplina.id}
                            href={`/notas/${turma.id}/${disciplina.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
                          >
                            <BookOpen className="h-3.5 w-3.5" />
                            {disciplina.nome}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </>
  )
}
