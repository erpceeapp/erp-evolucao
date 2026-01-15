import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BookOpen, Plus, Search, AlertCircle, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

async function getTurmasComDisciplinas() {
  const supabase = await createServerClient()

  console.log("[v0] Buscando turma_disciplinas...")
  const { data: turmasDisciplinas, error: tdError } = await supabase.from("turma_disciplinas").select("*")

  if (tdError) {
    console.error("[v0] Erro ao buscar turma_disciplinas:", tdError)
  }

  const { data: todasTurmas, error: turmasError } = await supabase
    .from("turmas")
    .select("id, nome, serie, ano_letivo, ativo")
    .eq("ativo", true)
    .order("nome")

  if (turmasError) {
    console.error("[v0] Erro ao buscar turmas:", turmasError)
    return { turmasComDisciplinas: [], turmasSemDisciplinas: [] }
  }

  console.log(`[v0] Total de turmas ativas: ${todasTurmas?.length || 0}`)

  if (!turmasDisciplinas || turmasDisciplinas.length === 0) {
    console.log("[v0] Nenhuma turma_disciplina encontrada - todas as turmas estão sem disciplinas")
    return {
      turmasComDisciplinas: [],
      turmasSemDisciplinas: todasTurmas || [],
    }
  }

  console.log(`[v0] Encontradas ${turmasDisciplinas.length} turma_disciplinas`)

  // Buscar disciplinas
  const disciplinaIds = [...new Set(turmasDisciplinas.map((td) => td.disciplina_id))]
  const { data: disciplinas, error: disciplinasError } = await supabase
    .from("disciplinas")
    .select("id, nome, codigo")
    .in("id", disciplinaIds)

  if (disciplinasError) {
    console.error("[v0] Erro ao buscar disciplinas:", disciplinasError)
  }

  // Buscar professores
  const professorIds = [...new Set(turmasDisciplinas.map((td) => td.professor_id).filter(Boolean))]
  const { data: professores, error: professoresError } = await supabase
    .from("professores")
    .select("id, nome_completo")
    .in("id", professorIds)

  if (professoresError) {
    console.error("[v0] Erro ao buscar professores:", professoresError)
  }

  // Identificar turmas com e sem disciplinas
  const turmasComDisciplinasIds = [...new Set(turmasDisciplinas.map((td) => td.turma_id))]
  const turmasSemDisciplinas = todasTurmas?.filter((t) => !turmasComDisciplinasIds.includes(t.id)) || []

  // Combinar dados das turmas com disciplinas
  const turmasComDisciplinas = turmasDisciplinas.map((td) => {
    const turma = todasTurmas?.find((t) => t.id === td.turma_id)
    return {
      ...td,
      turmas: turma,
      disciplinas: disciplinas?.find((d) => d.id === td.disciplina_id),
      professores: professores?.find((p) => p.id === td.professor_id),
    }
  })

  console.log(
    `[v0] Turmas com disciplinas: ${turmasComDisciplinas.length}, sem disciplinas: ${turmasSemDisciplinas.length}`,
  )
  return { turmasComDisciplinas, turmasSemDisciplinas }
}

export default async function DiarioPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { turmasComDisciplinas, turmasSemDisciplinas } = await getTurmasComDisciplinas()
  const totalTurmas = turmasComDisciplinas.length + turmasSemDisciplinas.length

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

      {turmasSemDisciplinas.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você tem {turmasSemDisciplinas.length} turma{turmasSemDisciplinas.length !== 1 ? "s" : ""} sem disciplinas
            configuradas. Para usar o diário de classe, você precisa adicionar disciplinas às turmas.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Turmas e Disciplinas ({totalTurmas})</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Buscar turma ou disciplina..." className="pl-10 w-64" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {turmasComDisciplinas.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700">Turmas Prontas para Uso</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {turmasComDisciplinas.map((item) => (
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
                          <p className="text-sm text-gray-600">Prof. {item.professores?.nome_completo}</p>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button asChild size="sm" className="w-full bg-cyan-600 hover:bg-cyan-700">
                            <Link href={`/diario/${item.turma_id}/${item.disciplina_id}`}>Ver Diário</Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {turmasSemDisciplinas.length > 0 && (
            <div className="space-y-4 mt-6">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Turmas que Precisam de Configuração
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {turmasSemDisciplinas.map((turma) => (
                  <Card key={turma.id} className="border-orange-200 bg-orange-50/50">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{turma.nome}</h3>
                          <p className="text-sm text-gray-600">
                            {turma.serie} - {turma.ano_letivo}
                          </p>
                        </div>

                        <Alert className="py-2">
                          <AlertDescription className="text-xs">
                            Esta turma ainda não tem disciplinas. Adicione disciplinas para usar o diário.
                          </AlertDescription>
                        </Alert>

                        <Button asChild size="sm" className="w-full bg-transparent" variant="outline">
                          <Link href={`/turmas/${turma.id}`}>
                            <Settings className="h-4 w-4 mr-2" />
                            Configurar Turma
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {totalTurmas === 0 && (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma turma cadastrada</h3>
              <p className="text-gray-600 mb-4">Cadastre turmas para começar a usar o diário de classe.</p>
              <Button asChild>
                <Link href="/turmas/nova">Cadastrar Turma</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
