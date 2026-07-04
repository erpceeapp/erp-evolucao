import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BookOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import PageHeader from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import NovaAulaForm from "@/components/diario/nova-aula-form"

async function getTurmasComDisciplinas() {
  const supabase = await createClient()

  const { data: turmasDisciplinas, error: tdError } = await supabase.from("turma_disciplinas").select("id, turma_id, disciplina_id, professor_id")

  if (tdError) {
    console.error("[v0] Erro ao buscar turma_disciplinas:", tdError)
    return []
  }

  if (!turmasDisciplinas || turmasDisciplinas.length === 0) {
    return []
  }

  // Buscar turmas
  const turmaIds = [...new Set(turmasDisciplinas.map((td) => td.turma_id))]
  const { data: turmas, error: turmasError } = await supabase
    .from("turmas")
    .select("id, nome, serie, ano_letivo")
    .in("id", turmaIds)

  if (turmasError) {
    console.error("[v0] Erro ao buscar turmas:", turmasError)
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

  // Combinar dados
  const resultado: any[] = turmasDisciplinas.map((td: any) => ({
    ...td,
    turmas: turmas?.find((t) => t.id === td.turma_id) ?? null,
    disciplinas: disciplinas?.find((d) => d.id === td.disciplina_id) ?? null,
    professores: professores?.find((p) => p.id === td.professor_id) ?? null,
  }))

  return resultado
}

export default async function NovaAulaPage() {
  const supabase = await createClient()

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
        icon={BookOpen}
        title="Nova Aula"
        subtitle="Registre uma nova aula no diário de classe"
        backHref="/diario"
      />
      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Diario de Classe", href: "/diario" },
          { label: "Nova Aula" },
        ]}
        className="mt-2"
      />

      <Card>
        <CardHeader>
          <CardTitle>Dados da Aula</CardTitle>
        </CardHeader>
        <CardContent>
          <NovaAulaForm turmasDisciplinas={turmasDisciplinas} />
        </CardContent>
      </Card>
    </>
  )
}
