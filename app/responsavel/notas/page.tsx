import { getResponsavelSession } from "@/lib/responsavel-auth"
import { createResponsavelClient } from "@/lib/supabase/responsavel-client"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BookOpen } from "lucide-react"
import { ExportBoletimButton } from "@/components/notas/export-boletim-button"

async function getAlunoNotas(alunoId: string) {
  const supabase = createResponsavelClient()

  // Buscar aluno via RPC
  const { data: alunoData } = await supabase
    .rpc("get_aluno_basico", { p_aluno_id: alunoId })
    .single()

  if (!alunoData) return null

  const aluno = alunoData as {
    id: string
    nome_completo: string
    matricula: string
    nivel: string
  }

  // Buscar notas completas via RPC
  const { data: notasData } = await supabase
    .rpc("get_aluno_notas", { p_aluno_id: alunoId })
    .single()

  if (!notasData) return { aluno, disciplinas: [], turma: null, anoLetivo: null, escola: null }

  const notas = notasData as {
    aluno: any
    disciplinas: Array<{
      id: string
      nome: string
      codigo: string
      notas: Record<string, { nota: number; observacoes: string } | null>
    }>
  }

  // Buscar escola via RPC
  const { data: escolaData } = await supabase
    .rpc("get_escola")
    .single()

  const escola = escolaData as { nome: string; endereco: string; telefone: string; email: string } | null

  // Processar disciplinas para o formato esperado pela pagina
  const disciplinas = (notas.disciplinas || []).map((disciplina) => {
    function toNotaVal(v: { nota: number; observacoes: string } | null | undefined): { nota: number } | undefined {
      if (!v || v.nota == null) return undefined
      return { nota: Number(v.nota) }
    }

    const notasPorBimestre = {
      1: toNotaVal(disciplina.notas?.["1"]),
      2: toNotaVal(disciplina.notas?.["2"]),
      3: toNotaVal(disciplina.notas?.["3"]),
      4: toNotaVal(disciplina.notas?.["4"]),
    }

    const notasValidas = [notasPorBimestre[1], notasPorBimestre[2], notasPorBimestre[3], notasPorBimestre[4]]
      .filter((n): n is { nota: number } => n !== undefined && n.nota != null)
      .map((n) => Number(n.nota))

    const media = notasValidas.length > 0 ? notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length : null

    return {
      id: disciplina.id,
      nome: disciplina.nome,
      codigo: disciplina.codigo,
      notas: notasPorBimestre,
      media: media ? media.toFixed(2) : "-",
    }
  })

  const turmaNome = null
  const anoLetivo = new Date().getFullYear()

  return { aluno, disciplinas, turma: turmaNome, anoLetivo, escola }
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
