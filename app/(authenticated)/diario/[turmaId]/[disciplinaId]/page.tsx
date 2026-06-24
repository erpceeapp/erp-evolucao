import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BookOpen, Calendar, FileText } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PageHeader from "@/components/page-header"
import AulasTab from "@/components/diario/aulas-tab"
import NotasTab from "@/components/diario/notas-tab"

async function getDiarioData(turmaId: string, disciplinaId: string) {
  const supabase = await createServerClient()

  try {
    const { data: turmaDisciplinas, error: tdError } = await supabase
      .from("turma_disciplinas")
      .select("id, carga_horaria_semanal, turma_id, disciplina_id, professor_id")
      .eq("turma_id", turmaId)
      .eq("disciplina_id", disciplinaId)
      .single()

    if (tdError) {
      console.error("[v0] Erro ao buscar turma_disciplina:", tdError)
      return null
    }

    if (!turmaDisciplinas) {
      return null
    }

    // Buscar dados relacionados em paralelo
    const [turmaRes, disciplinaRes, professorRes, aulasRes, matriculasRes] = await Promise.all([
      supabase.from("turmas").select("id, nome, serie, ano_letivo").eq("id", turmaId).single(),
      supabase.from("disciplinas").select("id, nome, codigo, carga_horaria").eq("id", disciplinaId).single(),
      supabase.from("professores").select("id, nome_completo").eq("id", turmaDisciplinas.professor_id).single(),
      supabase
        .from("aulas")
        .select("*")
        .eq("turma_disciplina_id", turmaDisciplinas.id)
        .order("data_aula", { ascending: false }),
      supabase
        .from("matriculas")
        .select("id, numero_matricula, aluno_id")
        .eq("turma_id", turmaId)
        .eq("status", "ativa"),
    ])

    if (turmaRes.error || disciplinaRes.error || professorRes.error) {
      console.error("[v0] Erro ao buscar dados relacionados")
      return null
    }

    // Buscar alunos
    const alunoIds = matriculasRes.data?.map((m) => m.aluno_id) || []
    const { data: alunos } = await supabase.from("alunos").select("id, nome_completo, email").in("id", alunoIds)

    // Combinar matriculas com alunos
    const matriculasComAlunos = (matriculasRes.data || []).map((matricula) => ({
      ...matricula,
      alunos: alunos?.find((a) => a.id === matricula.aluno_id),
    }))

    // Buscar períodos letivos
    const { data: periodos } = await supabase
      .from("periodos_letivos")
      .select("*")
      .eq("ano_letivo", turmaRes.data.ano_letivo)
      .order("numero_periodo")

    return {
      turmaDisciplina: {
        ...turmaDisciplinas,
        turmas: turmaRes.data,
        disciplinas: disciplinaRes.data,
        professores: professorRes.data,
      },
      aulas: aulasRes.data || [],
      matriculas: matriculasComAlunos,
      periodos: periodos || [],
    }
  } catch (error) {
    console.error("[v0] Erro em getDiarioData:", error)
    return null
  }
}

export default async function DiarioDetalhePage({
  params,
}: {
  params: Promise<{ turmaId: string; disciplinaId: string }>
}) {
  const { turmaId, disciplinaId } = await params
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const data = await getDiarioData(turmaId, disciplinaId)

  if (!data) {
    redirect("/diario")
  }

  const { turmaDisciplina, aulas, matriculas, periodos } = data

  return (
    <>
      <PageHeader
        icon={BookOpen}
        title={turmaDisciplina.disciplinas.nome}
        description={`${turmaDisciplina.turmas.nome} - Prof. ${turmaDisciplina.professores.nome_completo}`}
        backHref="/diario"
      >
        {/* <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/presenca/${turmaId}/${disciplinaId}`}>
              <Users className="h-4 w-4 mr-2" />
              Nova Aula
            </Link>
          </Button>
        </div> */}
      </PageHeader>

      <Tabs defaultValue="aulas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="aulas" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Aulas e Frequência
          </TabsTrigger>
          <TabsTrigger value="notas" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Notas e Períodos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="aulas">
          <AulasTab
            aulas={aulas}
            turmaDisciplina={turmaDisciplina}
            turmaId={turmaId}
            disciplinaId={disciplinaId}
            matriculas={matriculas}
          />
        </TabsContent>

        <TabsContent value="notas">
          <NotasTab
            matriculas={matriculas}
            disciplinaId={disciplinaId}
            periodos={periodos}
            anoLetivo={turmaDisciplina.turmas.ano_letivo}
          />
        </TabsContent>
      </Tabs>
    </>
  )
}
