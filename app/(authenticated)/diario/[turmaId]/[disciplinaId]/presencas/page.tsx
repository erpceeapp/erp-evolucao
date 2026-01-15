import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { History, Calendar, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import PageHeader from "@/components/page-header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

async function getPresencasHistorico(turmaId: string, disciplinaId: string) {
  const supabase = await createServerClient()

  // Buscar turma_disciplina
  const { data: turmaDisciplina } = await supabase
    .from("turma_disciplinas")
    .select("id, turma_id, disciplina_id, professor_id")
    .eq("turma_id", turmaId)
    .eq("disciplina_id", disciplinaId)
    .single()

  if (!turmaDisciplina) return null

  // Buscar dados relacionados
  const [turmaRes, disciplinaRes, professorRes] = await Promise.all([
    supabase.from("turmas").select("nome, serie").eq("id", turmaId).single(),
    supabase.from("disciplinas").select("nome").eq("id", disciplinaId).single(),
    supabase.from("professores").select("nome_completo").eq("id", turmaDisciplina.professor_id).single(),
  ])

  // Buscar aulas com contagem de presenças
  const { data: aulas } = await supabase
    .from("aulas")
    .select("id, data_aula, hora_inicio, hora_fim, conteudo")
    .eq("turma_disciplina_id", turmaDisciplina.id)
    .order("data_aula", { ascending: false })

  // Para cada aula, buscar presenças
  const aulasComPresencas = await Promise.all(
    (aulas || []).map(async (aula) => {
      const { data: presencas } = await supabase
        .from("presencas")
        .select("id, presente, aluno_id, justificativa")
        .eq("aula_id", aula.id)

      const totalPresentes = presencas?.filter((p) => p.presente).length || 0
      const totalAusentes = presencas?.filter((p) => !p.presente).length || 0

      return {
        ...aula,
        totalAlunos: presencas?.length || 0,
        totalPresentes,
        totalAusentes,
        percentualPresenca: presencas?.length ? Math.round((totalPresentes / presencas.length) * 100) : 0,
      }
    }),
  )

  return {
    turma: turmaRes.data,
    disciplina: disciplinaRes.data,
    professor: professorRes.data,
    aulas: aulasComPresencas,
  }
}

export default async function HistoricoPresencasPage({
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

  const data = await getPresencasHistorico(params.turmaId, params.disciplinaId)

  if (!data) {
    redirect("/diario")
  }

  const { turma, disciplina, professor, aulas } = data

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        icon={History}
        title="Histórico de Presenças"
        description={`${disciplina.nome} - ${turma.nome} - Prof. ${professor.nome_completo}`}
        backHref={`/diario/${params.turmaId}/${params.disciplinaId}`}
      >
        <Button asChild>
          <Link href={`/presenca/${params.turmaId}/${params.disciplinaId}`}>
            <Calendar className="h-4 w-4 mr-2" />
            Nova Chamada
          </Link>
        </Button>
      </PageHeader>

      {aulas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma aula registrada</h3>
            <p className="text-sm text-muted-foreground mb-4">Comece registrando a primeira chamada da turma</p>
            <Button asChild>
              <Link href={`/presenca/${params.turmaId}/${params.disciplinaId}`}>
                <Calendar className="h-4 w-4 mr-2" />
                Registrar Presença
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Aulas Registradas ({aulas.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Conteúdo</TableHead>
                  <TableHead className="text-center">Total Alunos</TableHead>
                  <TableHead className="text-center">Presentes</TableHead>
                  <TableHead className="text-center">Ausentes</TableHead>
                  <TableHead className="text-center">% Presença</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aulas.map((aula) => (
                  <TableRow key={aula.id}>
                    <TableCell>{new Date(aula.data_aula).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      {aula.hora_inicio && aula.hora_fim
                        ? `${aula.hora_inicio} - ${aula.hora_fim}`
                        : aula.hora_inicio || "-"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{aula.conteudo || "-"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{aula.totalAlunos}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-green-600">{aula.totalPresentes}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="destructive">{aula.totalAusentes}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={aula.percentualPresenca >= 75 ? "default" : "secondary"}>
                        {aula.percentualPresenca}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/diario/${params.turmaId}/${params.disciplinaId}/presencas/${aula.id}`}>
                          Ver Detalhes
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
