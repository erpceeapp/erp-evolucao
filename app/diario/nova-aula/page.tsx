import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BookOpen, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import NovaAulaForm from "@/components/diario/nova-aula-form"

async function getTurmasComDisciplinas() {
  const supabase = await createServerClient()

  const { data: turmasDisciplinas, error } = await supabase
    .from("turma_disciplinas")
    .select(`
      *,
      turmas (id, nome, serie, ano_letivo),
      disciplinas (id, nome, codigo),
      professores!turma_disciplinas_professor_id_fkey (id, nome_completo)
    `)
    .order("turmas(serie)", { ascending: true })

  if (error) {
    console.error("Erro ao buscar turmas e disciplinas:", error)
    return []
  }

  return turmasDisciplinas || []
}

export default async function NovaAulaPage() {
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/diario">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <BookOpen className="h-6 w-6 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nova Aula</h1>
            <p className="text-gray-600">Registre uma nova aula no diário de classe</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Aula</CardTitle>
        </CardHeader>
        <CardContent>
          <NovaAulaForm turmasDisciplinas={turmasDisciplinas} />
        </CardContent>
      </Card>
    </div>
  )
}
