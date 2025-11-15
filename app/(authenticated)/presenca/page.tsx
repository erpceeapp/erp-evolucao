import { createServerClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import { Calendar, Search, Users } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"

async function getTurmasComDisciplinas() {
  const supabase = await createServerClient()

  // Buscar turma_disciplinas
  const { data: turmasDisciplinas, error: tdError } = await supabase
    .from("turma_disciplinas")
    .select("*")

  if (tdError) {
    console.error("Erro ao buscar turma_disciplinas:", tdError)
    return []
  }

  if (!turmasDisciplinas || turmasDisciplinas.length === 0) {
    return []
  }

  // Buscar turmas
  const turmaIds = [...new Set(turmasDisciplinas.map(td => td.turma_id))]
  const { data: turmas } = await supabase
    .from("turmas")
    .select("id, nome, serie, ano_letivo")
    .in("id", turmaIds)

  // Buscar disciplinas
  const disciplinaIds = [...new Set(turmasDisciplinas.map(td => td.disciplina_id))]
  const { data: disciplinas } = await supabase
    .from("disciplinas")
    .select("id, nome, codigo")
    .in("id", disciplinaIds)

  // Buscar professores
  const professorIds = [...new Set(turmasDisciplinas.map(td => td.professor_id).filter(Boolean))]
  const { data: professores } = await supabase
    .from("professores")
    .select("id, nome_completo")
    .in("id", professorIds)

  // Criar maps para lookup rápido
  const turmasMap = new Map(turmas?.map(t => [t.id, t]) || [])
  const disciplinasMap = new Map(disciplinas?.map(d => [d.id, d]) || [])
  const professoresMap = new Map(professores?.map(p => [p.id, p]) || [])

  // Combinar os dados
  return turmasDisciplinas.map(td => ({
    ...td,
    turmas: turmasMap.get(td.turma_id),
    disciplinas: disciplinasMap.get(td.disciplina_id),
    professores: professoresMap.get(td.professor_id)
  }))
}

export default async function PresencaPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const turmasDisciplinas = await getTurmasComDisciplinas()

  return (
    <>
      <PageHeader
        icon={Calendar}
        title="Controle de Presença"
        subtitle="Registre e gerencie a frequência dos alunos"
        backHref="/dashboard"
      />
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Turmas e Disciplinas</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input placeholder="Buscar turma ou disciplina..." className="pl-10 w-64" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {turmasDisciplinas.map((item) => (
                <Card key={`${item.turma_id}-${item.disciplina_id}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{item.turmas?.nome}</h3>
                          <p className="text-sm text-gray-600">
                            {item.turmas?.serie} - {item.turmas?.ano_letivo}
                          </p>
                        </div>
                        <Badge variant="outline">{item.disciplinas?.codigo}</Badge>
                      </div>

                      <div>
                        <p className="font-medium text-blue-700">{item.disciplinas?.nome}</p>
                        <p className="text-sm text-gray-600">Prof. {item.professores?.nome_completo}</p>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button asChild size="sm" className="flex-1">
                          <Link href={`/presenca/${item.turma_id}/${item.disciplina_id}`}>
                            <Calendar className="h-4 w-4 mr-2" />
                            Registrar Presença
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {turmasDisciplinas.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma turma encontrada</h3>
                <p className="text-gray-600 mb-4">Configure turmas e disciplinas para começar a registrar presença.</p>
                <Button asChild>
                  <Link href="/turmas">Gerenciar Turmas</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
