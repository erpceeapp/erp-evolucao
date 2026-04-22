import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GraduationCap, BookOpen, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import PageHeader from "@/components/page-header"
import Link from "next/link"

async function getTurmasComDisciplinas() {
  const supabase = await createServerClient()

  // Buscar turmas ativas
  const { data: turmas, error: turmasError } = await supabase
    .from("turmas")
    .select("id, nome, serie, turno, ano_letivo, ativo")
    .eq("ativo", true)
    .order("nome")

  if (turmasError) {
    return []
  }

  // Buscar turma_disciplinas com disciplinas
  const turmaIds = turmas?.map((t) => t.id) || []
  
  const { data: turmaDisciplinas, error: tdError } = await supabase
    .from("turma_disciplinas")
    .select("id, turma_id, disciplina_id")
    .in("turma_id", turmaIds)

  if (tdError) {
    return turmas?.map((t) => ({ ...t, disciplinas: [] })) || []
  }

  // Buscar disciplinas
  const disciplinaIds = [...new Set(turmaDisciplinas?.map((td) => td.disciplina_id) || [])]
  
  const { data: disciplinas } = await supabase
    .from("disciplinas")
    .select("id, nome, codigo")
    .in("id", disciplinaIds)

  // Buscar contagem de matriculas por turma
  const { data: matriculas } = await supabase
    .from("matriculas")
    .select("turma_id")
    .in("turma_id", turmaIds)
    .eq("status", "ativa")

  // Organizar dados
  const turmasComDisciplinas = turmas?.map((turma) => {
    const disciplinasDaTurma = turmaDisciplinas
      ?.filter((td) => td.turma_id === turma.id)
      .map((td) => disciplinas?.find((d) => d.id === td.disciplina_id))
      .filter(Boolean) || []

    const totalAlunos = matriculas?.filter((m) => m.turma_id === turma.id).length || 0

    return {
      ...turma,
      disciplinas: disciplinasDaTurma,
      totalAlunos,
    }
  })

  return turmasComDisciplinas || []
}

export default async function NotasPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const turmas = await getTurmasComDisciplinas()

  return (
    <>
      <PageHeader
        icon={GraduationCap}
        title="Gestao de Notas"
        subtitle="Selecione uma turma e disciplina para lancar notas"
        backHref="/dashboard"
      />
      <div className="container mx-auto p-6 space-y-6">
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
              <Card key={turma.id} className="hover:shadow-md transition-shadow">
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
                        {turma.disciplinas.map((disciplina: any) => (
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
      </div>
    </>
  )
}
