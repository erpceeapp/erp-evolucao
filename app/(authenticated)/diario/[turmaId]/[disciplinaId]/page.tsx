import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BookOpen, Plus, Calendar, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

async function getDiarioData(turmaId: string, disciplinaId: string) {
  const supabase = await createServerClient()

  // Buscar informações da turma e disciplina
  const { data: turmaDisciplina } = await supabase
    .from("turma_disciplinas")
    .select(`
      *,
      turmas (id, nome, serie, ano_letivo),
      disciplinas (id, nome, codigo, carga_horaria),
      professores (id, nome_completo)
    `)
    .eq("turma_id", turmaId)
    .eq("disciplina_id", disciplinaId)
    .single()

  // Buscar aulas registradas
  const { data: aulas } = await supabase
    .from("aulas")
    .select("*")
    .eq("turma_disciplina_id", turmaId + "_" + disciplinaId)
    .order("data_aula", { ascending: false })

  // Buscar alunos da turma
  const { data: matriculas } = await supabase
    .from("matriculas")
    .select(`
      *,
      alunos (id, nome_completo, email)
    `)
    .eq("turma_id", turmaId)
    .eq("status", "ativa")

  return {
    turmaDisciplina,
    aulas: aulas || [],
    alunos: matriculas?.map((m) => m.alunos) || [],
  }
}

export default async function DiarioDetalhePage({
  params,
}: {
  params: { turmaId: string; disciplinaId: string }
}) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { turmaDisciplina, aulas, alunos } = await getDiarioData(params.turmaId, params.disciplinaId)

  if (!turmaDisciplina) {
    redirect("/diario")
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <BookOpen className="h-6 w-6 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{turmaDisciplina.disciplinas?.nome}</h1>
            <p className="text-gray-600">
              {turmaDisciplina.turmas?.nome} - Prof. {turmaDisciplina.professores?.nome_completo}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/presenca/${params.turmaId}/${params.disciplinaId}`}>
              <Users className="h-4 w-4 mr-2" />
              Presença
            </Link>
          </Button>
          <Button asChild className="bg-cyan-600 hover:bg-cyan-700">
            <Link href={`/diario/${params.turmaId}/${params.disciplinaId}/nova-aula`}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Aula
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aulas Registradas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aulas.length > 0 ? (
                  aulas.map((aula) => (
                    <div key={aula.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">Aula {aula.numero_aula}</h4>
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(aula.data_aula).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <Badge variant={aula.status === "realizada" ? "default" : "secondary"}>{aula.status}</Badge>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <h5 className="text-sm font-medium text-gray-700">Conteúdo:</h5>
                          <p className="text-sm text-gray-600">{aula.conteudo}</p>
                        </div>

                        {aula.observacoes && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700">Observações:</h5>
                            <p className="text-sm text-gray-600">{aula.observacoes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline">
                          Editar
                        </Button>
                        <Button size="sm" variant="outline">
                          Ver Presença
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma aula registrada</h3>
                    <p className="text-gray-600 mb-4">Comece registrando a primeira aula desta disciplina.</p>
                    <Button asChild>
                      <Link href={`/diario/${params.turmaId}/${params.disciplinaId}/nova-aula`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Registrar Primeira Aula
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Disciplina</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Código:</p>
                <p className="text-sm text-gray-600">{turmaDisciplina.disciplinas?.codigo}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Carga Horária:</p>
                <p className="text-sm text-gray-600">{turmaDisciplina.disciplinas?.carga_horaria}h</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Aulas Ministradas:</p>
                <p className="text-sm text-gray-600">{aulas.length} aulas</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alunos da Turma</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alunos.map((aluno) => (
                  <div key={aluno?.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium">{aluno?.nome_completo?.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{aluno?.nome_completo}</p>
                      <p className="text-xs text-gray-600">{aluno?.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
