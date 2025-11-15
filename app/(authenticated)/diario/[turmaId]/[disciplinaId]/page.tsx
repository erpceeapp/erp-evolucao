import { createServerClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import { BookOpen, Plus, Calendar, Users, FileText } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import PageHeader from "@/components/page-header"
import AulasTab from "@/components/diario/aulas-tab"
import NotasTab from "@/components/diario/notas-tab"

async function getDiarioData(turmaId: string, disciplinaId: string) {
  const supabase = await createServerClient()

  // Buscar turma_disciplina_id
  const { data: turmaDisciplina } = await supabase
    .from("turma_disciplinas")
    .select(`
      id,
      carga_horaria_semanal,
      turmas (id, nome, serie, ano_letivo),
      disciplinas (id, nome, codigo, carga_horaria),
      professores (id, nome_completo)
    `)
    .eq("turma_id", turmaId)
    .eq("disciplina_id", disciplinaId)
    .single()

  if (!turmaDisciplina) {
    return null
  }

  // Buscar aulas registradas
  const { data: aulas } = await supabase
    .from("aulas")
    .select("*")
    .eq("turma_disciplina_id", turmaDisciplina.id)
    .order("data_aula", { ascending: false })

  // Buscar alunos da turma (matrículas ativas)
  const { data: matriculas } = await supabase
    .from("matriculas")
    .select(`
      id,
      numero_matricula,
      alunos (id, nome_completo, email)
    `)
    .eq("turma_id", turmaId)
    .eq("status", "ativa")

  // Buscar períodos letivos
  const { data: periodos } = await supabase
    .from("periodos_letivos")
    .select("*")
    .eq("ano_letivo", turmaDisciplina.turmas.ano_letivo)
    .order("numero_periodo")

  return {
    turmaDisciplina,
    aulas: aulas || [],
    matriculas: matriculas || [],
    periodos: periodos || [],
  }
}

export default async function DiarioDetalhePage({
  params,
}: {
  params: { turmaId: string; disciplinaId: string }
}) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const data = await getDiarioData(params.turmaId, params.disciplinaId)

  if (!data) {
    redirect("/diario")
  }

  const { turmaDisciplina, aulas, matriculas, periodos } = data

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        icon={BookOpen}
        title={turmaDisciplina.disciplinas.nome}
        description={`${turmaDisciplina.turmas.nome} - Prof. ${turmaDisciplina.professores.nome_completo}`}
        backHref="/diario"
      >
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/presenca/${params.turmaId}/${params.disciplinaId}`}>
              <Users className="h-4 w-4 mr-2" />
              Presença
            </Link>
          </Button>
        </div>
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
            turmaId={params.turmaId}
            disciplinaId={params.disciplinaId}
            matriculas={matriculas}
          />
        </TabsContent>

        <TabsContent value="notas">
          <NotasTab
            matriculas={matriculas}
            disciplinaId={params.disciplinaId}
            periodos={periodos}
            anoLetivo={turmaDisciplina.turmas.ano_letivo}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
