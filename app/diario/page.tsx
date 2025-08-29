import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BookOpen, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

async function getTurmasComDisciplinas() {
  const supabase = await createServerClient()

  const { data: turmasDisciplinas, error } = await supabase
    .from("turma_disciplinas")
    .select(`
      *,
      turmas (id, nome, serie, ano_letivo),
      disciplinas (id, nome, codigo),
      professores (id, nome)
    `)
    .order("turmas(serie)", { ascending: true })

  if (error) {
    console.error("Erro ao buscar turmas e disciplinas:", error)
    return []
  }

  return turmasDisciplinas || []
}

export default async function DiarioPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const turmasDisciplinas = await getTurmasComDisciplinas()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <BookOpen className="h-6 w-6 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Diário de Classe</h1>
            <p className="text-gray-600">Registre aulas e acompanhe o progresso</p>
          </div>
        </div>
        <Button asChild className="bg-cyan-600 hover:bg-cyan-700">
          <Link href="/diario/nova-aula">
            <Plus className="h-4 w-4 mr-2" />
            Nova Aula
          </Link>
        </Button>
      </div>

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
                      <p className="text-sm text-gray-600">Prof. {item.professores?.nome}</p>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button asChild size="sm" className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                        <Link href={`/diario/${item.turma_id}/${item.disciplina_id}`}>Ver Diário</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="flex-1 bg-transparent">
                        <Link href={`/presenca/${item.turma_id}/${item.disciplina_id}`}>Presença</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {turmasDisciplinas.length === 0 && (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma turma encontrada</h3>
              <p className="text-gray-600 mb-4">
                Configure turmas e disciplinas para começar a usar o diário de classe.
              </p>
              <Button asChild>
                <Link href="/turmas">Gerenciar Turmas</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
