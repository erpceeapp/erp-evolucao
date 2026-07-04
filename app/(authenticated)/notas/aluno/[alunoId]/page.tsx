import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GraduationCap, BookOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import PageHeader from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { ExportBoletimButton } from "@/components/notas/export-boletim-button"

async function getAlunoNotasData(alunoId: string) {
  const supabase = await createServerClient()

  // Buscar dados do aluno
  const { data: aluno, error: alunoError } = await supabase
    .from("alunos")
    .select("id, nome_completo, matricula, nivel")
    .eq("id", alunoId)
    .single()

  if (alunoError || !aluno) {
    return null
  }

  // Buscar matriculas
  const { data: matriculas, error: matriculasError } = await supabase
    .from("matriculas")
    .select("id, turma_id, status, ano_letivo")
    .eq("aluno_id", alunoId)

  if (matriculasError) {
    return { aluno, disciplinas: [], turma: null, anoLetivo: null }
  }

  const matriculasAtivas =
    matriculas?.filter(
      (m) => m.status !== "cancelado" && m.status !== "cancelada" && m.status !== "inativo" && m.status !== "inativa"
    ) || []

  if (matriculasAtivas.length === 0) {
    return { aluno, disciplinas: [], turma: null, anoLetivo: null }
  }

  const turmaIds = matriculasAtivas.map((m) => m.turma_id)
  const anoLetivo = matriculasAtivas[0]?.ano_letivo

  // Buscar turma
  const { data: turma } = await supabase
    .from("turmas")
    .select("id, nome")
    .eq("id", turmaIds[0])
    .single()

  // Buscar turma_disciplinas
  const { data: turmaDisciplinas, error: tdError } = await supabase
    .from("turma_disciplinas")
    .select("id, turma_id, disciplina_id")
    .in("turma_id", turmaIds)

  if (tdError || !turmaDisciplinas) {
    return { aluno, disciplinas: [], turma: turma?.nome, anoLetivo }
  }

  if (turmaDisciplinas.length === 0) {
    return { aluno, disciplinas: [], turma: turma?.nome, anoLetivo }
  }

  const disciplinaIds = [...new Set(turmaDisciplinas.map((td) => td.disciplina_id))]

  // Buscar disciplinas
  const { data: disciplinas, error: discError } = await supabase
    .from("disciplinas")
    .select("id, nome, codigo")
    .in("id", disciplinaIds)

  if (discError) {
    return { aluno, disciplinas: [], turma: turma?.nome, anoLetivo }
  }

  // Buscar notas do aluno
  const matriculaIds = matriculasAtivas.map((m) => m.id)
  const { data: notas, error: notasError } = await supabase
    .from("notas")
    .select("id, matricula_id, disciplina_id, bimestre, nota, observacoes")
    .in("matricula_id", matriculaIds)

  if (notasError) {
    // Continue without notas
  }

  // Buscar escola
  const { data: escola } = await supabase
    .from("escola")
    .select("nome, endereco, telefone, email")
    .single()

  // Organizar notas por disciplina
  const disciplinasComNotas = (disciplinas || []).map((disciplina) => {
    const notasDisciplina = (notas || []).filter((n) => n.disciplina_id === disciplina.id)

    const notasPorBimestre = {
      1: notasDisciplina.find((n) => n.bimestre === 1),
      2: notasDisciplina.find((n) => n.bimestre === 2),
      3: notasDisciplina.find((n) => n.bimestre === 3),
      4: notasDisciplina.find((n) => n.bimestre === 4),
    }

    const notasValidas = notasDisciplina.filter((n) => n.nota != null).map((n) => Number(n.nota))
    const media = notasValidas.length > 0 ? notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length : null

    return {
      ...disciplina,
      notas: notasPorBimestre,
      media: media ? media.toFixed(2) : "-",
    }
  })

  return { 
    aluno, 
    disciplinas: disciplinasComNotas, 
    turma: turma?.nome, 
    anoLetivo,
    escola 
  }
}

export default async function AlunoNotasPage({ params }: { params: Promise<{ alunoId: string }> }) {
  const { alunoId } = await params
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const data = await getAlunoNotasData(alunoId)

  if (!data) {
    redirect("/notas")
  }

  const { aluno, disciplinas, turma, anoLetivo, escola } = data

  const alunoBoletim = {
    nome_completo: aluno.nome_completo,
    matricula: aluno.matricula,
    nivel: aluno.nivel,
    turma: turma || undefined,
    ano_letivo: anoLetivo || undefined,
  }

  return (
    <>
      <PageHeader
        icon={GraduationCap}
        title={`Notas - ${aluno.nome_completo}`}
        subtitle={`Matricula: ${aluno.matricula || "N/A"} | Serie: ${aluno.nivel || "N/A"}${turma ? ` | Turma: ${turma}` : ""}`}
        backHref="/notas"
      />
      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Notas", href: "/notas" },
          { label: aluno.nome_completo },
        ]}
        className="mt-2"
      />
      <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Notas por Disciplina
              </CardTitle>
              <ExportBoletimButton
                aluno={alunoBoletim}
                disciplinas={disciplinas}
                escola={escola}
              />
            </div>
          </CardHeader>
          <CardContent>
            {disciplinas.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma disciplina encontrada</h3>
                <p className="text-gray-600">
                  O aluno nao possui disciplinas vinculadas ou nao esta matriculado em nenhuma turma ativa.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Disciplina</TableHead>
                    <TableHead className="text-center">1o Bimestre</TableHead>
                    <TableHead className="text-center">2o Bimestre</TableHead>
                    <TableHead className="text-center">3o Bimestre</TableHead>
                    <TableHead className="text-center">4o Bimestre</TableHead>
                    <TableHead className="text-center">Media</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disciplinas.map((disciplina) => (
                    <TableRow key={disciplina.id}>
                      <TableCell className="font-medium">
                        <div>
                          <p>{disciplina.nome}</p>
                          <p className="text-xs text-gray-500">{disciplina.codigo}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {disciplina.notas[1] ? (
                          <Badge variant="outline">{Number(disciplina.notas[1].nota).toFixed(1)}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {disciplina.notas[2] ? (
                          <Badge variant="outline">{Number(disciplina.notas[2].nota).toFixed(1)}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {disciplina.notas[3] ? (
                          <Badge variant="outline">{Number(disciplina.notas[3].nota).toFixed(1)}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {disciplina.notas[4] ? (
                          <Badge variant="outline">{Number(disciplina.notas[4].nota).toFixed(1)}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            disciplina.media === "-"
                              ? "secondary"
                              : Number(disciplina.media) >= 7
                                ? "default"
                                : Number(disciplina.media) >= 5
                                  ? "outline"
                                  : "destructive"
                          }
                          className="font-bold"
                        >
                          {disciplina.media}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
    </>
  )
}
