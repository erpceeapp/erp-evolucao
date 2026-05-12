import { getResponsavelSession } from "@/lib/responsavel-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BookOpen } from "lucide-react"
import { ExportBoletimButton } from "@/components/notas/export-boletim-button"

async function getAlunoNotas(alunoId: string) {
  const supabase = createAdminClient()

  const { data: aluno } = await supabase
    .from("alunos")
    .select("id, nome_completo, matricula, nivel")
    .eq("id", alunoId)
    .single()

  if (!aluno) return null

  // Buscar matriculas
  const { data: matriculas } = await supabase
    .from("matriculas")
    .select("id, turma_id, status, ano_letivo")
    .eq("aluno_id", alunoId)

  const matriculasAtivas = (matriculas || []).filter(
    (m) => m.status !== "cancelado" && m.status !== "cancelada" && m.status !== "inativo" && m.status !== "inativa"
  )

  if (matriculasAtivas.length === 0) return { aluno, disciplinas: [], turma: null, anoLetivo: null }

  const turmaIds = matriculasAtivas.map((m) => m.turma_id)
  const anoLetivo = matriculasAtivas[0]?.ano_letivo

  // Buscar turma
  const { data: turma } = await supabase
    .from("turmas")
    .select("id, nome")
    .eq("id", turmaIds[0])
    .single()

  // Buscar turma_disciplinas
  const { data: turmaDisciplinas } = await supabase
    .from("turma_disciplinas")
    .select("id, turma_id, disciplina_id")
    .in("turma_id", turmaIds)

  if (!turmaDisciplinas || turmaDisciplinas.length === 0) {
    return { aluno, disciplinas: [], turma: turma?.nome, anoLetivo }
  }

  const disciplinaIds = [...new Set(turmaDisciplinas.map((td) => td.disciplina_id))]

  // Buscar disciplinas
  const { data: disciplinas } = await supabase
    .from("disciplinas")
    .select("id, nome, codigo")
    .in("id", disciplinaIds)

  // Buscar notas
  const matriculaIds = matriculasAtivas.map((m) => m.id)
  const { data: notas } = await supabase
    .from("notas")
    .select("id, matricula_id, disciplina_id, bimestre, nota, observacoes")
    .in("matricula_id", matriculaIds)

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

  return { aluno, disciplinas: disciplinasComNotas, turma: turma?.nome, anoLetivo, escola }
}

export default async function ResponsavelNotasPage() {
  const session = await getResponsavelSession()
  if (!session) redirect("/auth/login")

  const data = await getAlunoNotas(session.aluno_id)

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Aluno nao encontrado.</p>
      </div>
    )
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-full">
            <BookOpen className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notas e Desempenho</h1>
            <p className="text-sm text-gray-500">{aluno.nome_completo}</p>
          </div>
        </div>
        <ExportBoletimButton
          aluno={alunoBoletim}
          disciplinas={disciplinas}
          escola={escola}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
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
                O aluno nao possui disciplinas vinculadas ou nao esta matriculado em nenhuma turma ativa.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Disciplina</TableHead>
                    <TableHead className="text-center">1o Bim</TableHead>
                    <TableHead className="text-center">2o Bim</TableHead>
                    <TableHead className="text-center">3o Bim</TableHead>
                    <TableHead className="text-center">4o Bim</TableHead>
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
                      {[1, 2, 3, 4].map((bim) => (
                        <TableCell key={bim} className="text-center">
                          {(disciplina.notas as any)[bim] ? (
                            <Badge variant="outline">
                              {Number((disciplina.notas as any)[bim].nota).toFixed(1)}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      ))}
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
