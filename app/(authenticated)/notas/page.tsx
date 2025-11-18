import { createServerClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import { GraduationCap, Search } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import PageHeader from "@/components/page-header"

async function getTurmasComDisciplinas() {
  const supabase = await createServerClient()

  const { data: turmasDisciplinas, error } = await supabase
    .from("turma_disciplinas")
    .select(`
      id,
      turma_id,
      disciplina_id,
      professor_id,
      carga_horaria_semanal
    `)

  if (error) {
    console.error("Erro ao buscar turmas e disciplinas:", error)
    return []
  }

  if (!turmasDisciplinas || turmasDisciplinas.length === 0) {
    return []
  }

  // Fetch related data separately to avoid ambiguous relationships
  const turmaIds = [...new Set(turmasDisciplinas.map(td => td.turma_id))]
  const disciplinaIds = [...new Set(turmasDisciplinas.map(td => td.disciplina_id))]
  const professorIds = [...new Set(turmasDisciplinas.map(td => td.professor_id).filter(Boolean))]

  const [turmasResult, disciplinasResult, professoresResult] = await Promise.all([
    supabase.from("turmas").select("id, nome, serie, ano_letivo").in("id", turmaIds),
    supabase.from("disciplinas").select("id, nome, codigo").in("id", disciplinaIds),
    professorIds.length > 0
      ? supabase.from("professores").select("id, nome_completo").in("id", professorIds)
      : { data: [], error: null }
  ])

  // Create maps for quick lookup
  const turmasMap = new Map((turmasResult.data || []).map(t => [t.id, t]))
  const disciplinasMap = new Map((disciplinasResult.data || []).map(d => [d.id, d]))
  const professoresMap = new Map((professoresResult.data || []).map(p => [p.id, p]))

  // Combine the data
  const combined = turmasDisciplinas.map(td => ({
    ...td,
    turmas: turmasMap.get(td.turma_id),
    disciplinas: disciplinasMap.get(td.disciplina_id),
    professores: td.professor_id ? professoresMap.get(td.professor_id) : null
  }))

  return combined
}

export default async function NotasPage() {
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
        icon={GraduationCap}
        title="Gestão de Notas"
        subtitle="Lance e gerencie notas dos alunos"
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
                        <p className="font-medium text-cyan-700">{item.disciplinas?.nome}</p>
                        <p className="text-sm text-gray-600">Prof. {item.professores?.nome_completo || 'Não atribuído'}</p>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button asChild size="sm" className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                          <Link href={`/notas/${item.turma_id}/${item.disciplina_id}`}>Gerenciar Notas</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {turmasDisciplinas.length === 0 && (
              <div className="text-center py-8">
                <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma turma encontrada</h3>
                <p className="text-gray-600 mb-4">Configure turmas e disciplinas para começar a gerenciar notas.</p>
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
