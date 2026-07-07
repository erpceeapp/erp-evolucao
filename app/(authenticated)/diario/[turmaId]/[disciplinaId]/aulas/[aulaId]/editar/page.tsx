import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BookOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import PageHeader from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import NovaAulaForm from "@/components/diario/nova-aula-form-v2"

async function getTurmaDisciplina(turmaId: string, disciplinaId: string) {
  const supabase = await createServerClient()

  const { data: td } = await supabase
    .from("turma_disciplinas")
    .select("id, turma_id, disciplina_id, professor_id")
    .eq("turma_id", turmaId)
    .eq("disciplina_id", disciplinaId)
    .single()

  if (!td) return null

  const [turmaRes, disciplinaRes, professorRes] = await Promise.all([
    supabase.from("turmas").select("id, nome, serie, ano_letivo").eq("id", td.turma_id).single(),
    supabase.from("disciplinas").select("id, nome, codigo").eq("id", td.disciplina_id).single(),
    td.professor_id
      ? supabase.from("professores").select("id, nome_completo").eq("id", td.professor_id).single()
      : Promise.resolve({ data: null, error: null }),
  ])

  return {
    id: td.id,
    turmas: turmaRes.data,
    disciplinas: disciplinaRes.data,
    professores: professorRes.data,
  }
}

async function getAula(aulaId: string, turmaDisciplinaId: string) {
  const supabase = await createServerClient()

  const { data } = await supabase
    .from("aulas")
    .select("id, data_aula, hora_inicio, hora_fim, conteudo, observacoes")
    .eq("id", aulaId)
    .eq("turma_disciplina_id", turmaDisciplinaId)
    .single()

  return data
}

async function getDuracaoPadrao(turmaDisciplinaId: string): Promise<number> {
  const supabase = await createServerClient()

  const { data: gradeHorarios } = await supabase
    .from("grade_horarios")
    .select("hora_inicio, hora_fim")
    .eq("turma_disciplina_id", turmaDisciplinaId)

  if (!gradeHorarios || gradeHorarios.length === 0) return 50

  const duracaoMin = Math.round(
    (gradeHorarios
      .map((g) => {
        const [hi, mi] = g.hora_inicio.split(":").map(Number)
        const [hf, mf] = g.hora_fim.split(":").map(Number)
        return hf * 60 + mf - (hi * 60 + mi)
      })
      .reduce((a, b) => a + b, 0)) / gradeHorarios.length
  )

  return duracaoMin > 0 ? duracaoMin : 50
}

export default async function EditarAulaPage({
  params,
}: {
  params: Promise<{ turmaId: string; disciplinaId: string; aulaId: string }>
}) {
  const { turmaId, disciplinaId, aulaId } = await params
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const turmaDisciplina = await getTurmaDisciplina(turmaId, disciplinaId)

  if (!turmaDisciplina) {
    redirect("/diario")
  }

  const aula = await getAula(aulaId, turmaDisciplina.id)

  if (!aula) {
    redirect(`/diario/${turmaId}/${disciplinaId}`)
  }

  const duracaoPadrao = await getDuracaoPadrao(turmaDisciplina.id)

  return (
    <>
      <PageHeader
        icon={BookOpen}
        title={`Editar Aula - ${(turmaDisciplina as any).disciplinas.nome}`}
        description={`${(turmaDisciplina as any).turmas.nome} - Prof. ${(turmaDisciplina as any).professores?.nome_completo || "Sem professor"}`}
        backHref={`/diario/${turmaId}/${disciplinaId}`}
      />
      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Diario de Classe", href: "/diario" },
          {
            label: `${(turmaDisciplina as any).turmas.nome} / ${(turmaDisciplina as any).disciplinas.nome}`,
            href: `/diario/${turmaId}/${disciplinaId}`,
          },
          { label: "Editar Aula" },
        ]}
        className="mt-2"
      />

      <Card>
        <CardHeader>
          <CardTitle>Dados da Aula</CardTitle>
        </CardHeader>
        <CardContent>
          <NovaAulaForm turmaDisciplina={turmaDisciplina} duracaoPadrao={duracaoPadrao} aula={aula} />
        </CardContent>
      </Card>
    </>
  )
}
