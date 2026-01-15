import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GraduationCap, BookOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import PageHeader from "@/components/page-header"

async function getAlunoNotasData(alunoId: string) {
  const supabase = await createServerClient()

  console.log("[v0] Buscando notas para aluno:", alunoId)

  // Buscar dados do aluno
  const { data: aluno, error: alunoError } = await supabase
    .from("alunos")
    .select("id, nome_completo, matricula, nivel")
    .eq("id", alunoId)
    .single()

  if (alunoError || !aluno) {
    console.error("[v0] Erro ao buscar aluno:", alunoError)
    return null
  }

  console.log("[v0] Aluno encontrado:", aluno.nome_completo)

  const { data: matriculas, error: matriculasError } = await supabase
    .from("matriculas")
    .select("id, turma_id, status")
    .eq("aluno_id", alunoId)

  if (matriculasError) {
    console.error("[v0] Erro ao buscar matrículas:", matriculasError)
    return { aluno, disciplinas: [] }
  }

  console.log("[v0] Total de matrículas encontradas:", matriculas?.length || 0)
  console.log(
    "[v0] Status das matrículas:",
    matriculas?.map((m) => m.status),
  )

  const matriculasAtivas =
    matriculas?.filter(
      (m) => m.status !== "cancelado" && m.status !== "cancelada" && m.status !== "inativo" && m.status !== "inativa",
    ) || []

  console.log("[v0] Matrículas ativas encontradas:", matriculasAtivas.length)

  if (matriculasAtivas.length === 0) {
    console.log("[v0] Nenhuma matrícula ativa encontrada para o aluno")
    return { aluno, disciplinas: [] }
  }

  const turmaIds = matriculasAtivas.map((m) => m.turma_id)
  console.log("[v0] Turma IDs:", turmaIds)

  // Buscar turma_disciplinas
  const { data: turmaDisciplinas, error: tdError } = await supabase
    .from("turma_disciplinas")
    .select("id, turma_id, disciplina_id")
    .in("turma_id", turmaIds)

  if (tdError || !turmaDisciplinas) {
    console.error("[v0] Erro ao buscar turma_disciplinas:", tdError)
    return { aluno, disciplinas: [] }
  }

  console.log("[v0] turma_disciplinas encontradas:", turmaDisciplinas.length)

  if (turmaDisciplinas.length === 0) {
    console.log("[v0] Nenhuma disciplina vinculada às turmas do aluno")
    return { aluno, disciplinas: [] }
  }

  const disciplinaIds = [...new Set(turmaDisciplinas.map((td) => td.disciplina_id))]
  console.log("[v0] Disciplina IDs únicos:", disciplinaIds)

  // Buscar disciplinas
  const { data: disciplinas, error: discError } = await supabase
    .from("disciplinas")
    .select("id, nome, codigo")
    .in("id", disciplinaIds)

  if (discError) {
    console.error("[v0] Erro ao buscar disciplinas:", discError)
    return { aluno, disciplinas: [] }
  }

  console.log("[v0] Disciplinas encontradas:", disciplinas?.length || 0)

  // Buscar notas do aluno
  const matriculaIds = matriculasAtivas.map((m) => m.id)
  const { data: notas, error: notasError } = await supabase
    .from("notas")
    .select("id, matricula_id, disciplina_id, bimestre, nota, observacoes")
    .in("matricula_id", matriculaIds)

  if (notasError) {
    console.error("[v0] Erro ao buscar notas:", notasError)
  }

  console.log("[v0] Notas encontradas:", notas?.length || 0)

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

  console.log("[v0] Disciplinas com notas organizadas:", disciplinasComNotas.length)

  return { aluno, disciplinas: disciplinasComNotas }
}

export default async function AlunoNotasPage({ params }: { params: { alunoId: string } }) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const data = await getAlunoNotasData(params.alunoId)

  if (!data) {
    redirect("/notas")
  }

  const { aluno, disciplinas } = data

  return (
    <>
      <PageHeader
        icon={GraduationCap}
        title={`Notas - ${aluno.nome_completo}`}
        subtitle={`Matrícula: ${aluno.matricula || "N/A"} | Série: ${aluno.nivel || "N/A"}`}
        backHref="/notas"
      />
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Notas por Disciplina
            </CardTitle>
          </CardHeader>
          <CardContent>
            {disciplinas.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma disciplina encontrada</h3>
                <p className="text-gray-600">
                  O aluno não possui disciplinas vinculadas ou não está matriculado em nenhuma turma ativa.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Disciplina</TableHead>
                    <TableHead className="text-center">1º Bimestre</TableHead>
                    <TableHead className="text-center">2º Bimestre</TableHead>
                    <TableHead className="text-center">3º Bimestre</TableHead>
                    <TableHead className="text-center">4º Bimestre</TableHead>
                    <TableHead className="text-center">Média</TableHead>
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
      </div>
    </>
  )
}
