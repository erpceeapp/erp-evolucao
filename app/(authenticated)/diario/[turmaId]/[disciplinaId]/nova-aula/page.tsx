import { createServerClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import PageHeader from "@/components/page-header"
import NovaAulaForm from "@/components/diario/nova-aula-form-v2"

async function getTurmaDisciplina(turmaId: string, disciplinaId: string) {
  const supabase = await createServerClient()

  const { data } = await supabase
    .from("turma_disciplinas")
    .select(`
      id,
      turmas (id, nome, serie, ano_letivo),
      disciplinas (id, nome, codigo),
      professores (id, nome_completo)
    `)
    .eq("turma_id", turmaId)
    .eq("disciplina_id", disciplinaId)
    .single()

  return data
}

export default async function NovaAulaPage({
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

  const turmaDisciplina = await getTurmaDisciplina(turmaId, disciplinaId)

  if (!turmaDisciplina) {
    redirect("/diario")
  }

  return (
    <>
      <PageHeader
        icon={BookOpen}
        title="Nova Aula"
        description="Registre uma nova aula no diário de classe"
        backHref={`/diario/${turmaId}/${disciplinaId}`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Dados da Aula</CardTitle>
        </CardHeader>
        <CardContent>
          <NovaAulaForm turmaDisciplina={turmaDisciplina} />
        </CardContent>
      </Card>
    </>
  )
}
