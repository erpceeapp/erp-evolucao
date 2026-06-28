import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BookOpen, Plus, Search, AlertCircle, Settings, NotebookPen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { DiarioTurmasView } from "./diario-turmas-view"
import { getProfessorFilter } from "@/lib/professor-filter"

async function getTurmasComDisciplinas() {
  const supabase = await createServerClient()
  const filter = await getProfessorFilter()

  let tdQuery = supabase.from("turma_disciplinas").select("*")
  if (filter.isProfessor && filter.professorId) {
    tdQuery = tdQuery.eq("professor_id", filter.professorId)
  }

  const { data: turmasDisciplinas, error: tdError } = await tdQuery

  if (tdError) {
    console.error("[v0] Erro ao buscar turma_disciplinas:", tdError)
  }

  let turmasQuery = supabase
    .from("turmas")
    .select("id, nome, serie, ano_letivo, ativo")
    .eq("ativo", true)
    .order("nome")

  if (filter.isProfessor) {
    if (filter.turmaIds.length > 0) {
      turmasQuery = turmasQuery.in("id", filter.turmaIds)
    } else {
      turmasQuery = turmasQuery.in("id", [])
    }
  }

  const { data: todasTurmas, error: turmasError } = await turmasQuery

  if (turmasError) {
    console.error("[v0] Erro ao buscar turmas:", turmasError)
    return { turmasComDisciplinas: [], turmasSemDisciplinas: [] }
  }

  if (!turmasDisciplinas || turmasDisciplinas.length === 0) {
    return {
      turmasComDisciplinas: [],
      turmasSemDisciplinas: todasTurmas || [],
    }
  }

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
    <>
      <PageHeader
        icon={NotebookPen}
        title="Diário de Classe"
        description="Registre aulas e acompanhe o progresso"
        actions={
          <Button asChild>
            <Link href="/diario/nova-aula">
              <Plus className="h-4 w-4 mr-2" />
              Nova Aula
            </Link>
          </Button>
        }
      />

      {turmasSemDisciplinas.length > 0 && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você tem {turmasSemDisciplinas.length} turma{turmasSemDisciplinas.length !== 1 ? "s" : ""} sem disciplinas
            configuradas. Para usar o diário de classe, você precisa adicionar disciplinas às turmas.
          </AlertDescription>
        </Alert>
      )}

      <DiarioTurmasView
        turmasComDisciplinas={turmasComDisciplinas}
        turmasSemDisciplinas={turmasSemDisciplinas}
        totalTurmas={totalTurmas}
      />
    </>
  )
}
