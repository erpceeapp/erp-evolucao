import { createServerClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import { Eye, Calendar, Clock, BookOpen, Users, Check, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import PageHeader from "@/components/page-header"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

async function getAulaDetalhes(aulaId: string, turmaId: string, disciplinaId: string) {
  const supabase = await createServerClient()

  // Buscar aula
  const { data: aula } = await supabase
    .from("aulas")
    .select("*")
    .eq("id", aulaId)
    .single()

  if (!aula) return null

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

  // Buscar presenças com dados dos alunos
  const { data: presencas } = await supabase
    .from("presencas")
    .select("id, presente, aluno_id, justificativa")
    .eq("aula_id", aulaId)

  // Buscar alunos
  const alunoIds = presencas?.map(p => p.aluno_id) || []
  const { data: alunos } = await supabase
    .from("alunos")
    .select("id, nome_completo, email")
    .in("id", alunoIds)

  // Buscar matrículas para pegar número
  const { data: matriculas } = await supabase
    .from("matriculas")
    .select("aluno_id, numero_matricula")
    .eq("turma_id", turmaId)
    .in("aluno_id", alunoIds)

  // Combinar dados
  const presencasComAlunos = (presencas || []).map(presenca => {
    const aluno = alunos?.find(a => a.id === presenca.aluno_id)
    const matricula = matriculas?.find(m => m.aluno_id === presenca.aluno_id)
    return {
      ...presenca,
      aluno,
      numero_matricula: matricula?.numero_matricula
    }
  }).sort((a, b) => (a.aluno?.nome_completo || '').localeCompare(b.aluno?.nome_completo || ''))

  const totalPresentes = presencas?.filter(p => p.presente).length || 0
  const totalAusentes = presencas?.filter(p => !p.presente).length || 0

  return {
    aula,
    turma: turmaRes.data,
    disciplina: disciplinaRes.data,
    professor: professorRes.data,
    presencas: presencasComAlunos,
    totalPresentes,
    totalAusentes,
    totalAlunos: presencas?.length || 0,
  }
}

export default async function AulaDetalhePage({
  params,
}: {
  params: { turmaId: string; disciplinaId: string; aulaId: string }
}) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  const data = await getAulaDetalhes(params.aulaId, params.turmaId, params.disciplinaId)

  if (!data) {
    redirect("/diario")
  }

  const { aula, turma, disciplina, professor, presencas, totalPresentes, totalAusentes, totalAlunos } = data
  const percentualPresenca = totalAlunos > 0 ? Math.round((totalPresentes / totalAlunos) * 100) : 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        icon={Eye}
        title="Detalhes da Aula"
        description={`${disciplina.nome} - ${turma.nome}`}
        backHref={`/diario/${params.turmaId}/${params.disciplinaId}/presencas`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações da Aula */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Aula</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Data</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(aula.data_aula).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Horário</p>
                    <p className="text-sm text-muted-foreground">
                      {aula.horario || '-'}
                    </p>
                  </div>
                </div>
              </div>
              
              {aula.conteudo_ministrado && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Conteúdo Ministrado</p>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">
                    {aula.conteudo_ministrado}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lista de Presenças */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Presença</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Nome do Aluno</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Justificativa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {presencas.map((presenca) => (
                    <TableRow key={presenca.id}>
                      <TableCell>
                        <Badge variant="outline">{presenca.numero_matricula}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {presenca.aluno?.nome_completo}
                      </TableCell>
                      <TableCell className="text-center">
                        {presenca.presente ? (
                          <Badge className="bg-green-600">
                            <Check className="h-3 w-3 mr-1" />
                            Presente
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <X className="h-3 w-3 mr-1" />
                            Ausente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {presenca.justificativa || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Resumo */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo da Chamada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total de Alunos</span>
                </div>
                <Badge variant="outline" className="text-lg">{totalAlunos}</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Presentes</span>
                </div>
                <Badge className="bg-green-600 text-lg">{totalPresentes}</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-700">Ausentes</span>
                </div>
                <Badge variant="destructive" className="text-lg">{totalAusentes}</Badge>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Percentual de Presença</span>
                  <Badge 
                    variant={percentualPresenca >= 75 ? "default" : "secondary"}
                    className="text-lg"
                  >
                    {percentualPresenca}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Professor</p>
                <p className="text-sm">{professor.nome_completo}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Turma</p>
                <p className="text-sm">{turma.nome} - {turma.serie}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Disciplina</p>
                <p className="text-sm">{disciplina.nome}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
