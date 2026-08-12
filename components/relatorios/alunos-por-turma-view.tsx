"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download } from "lucide-react"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  generateAlunosPorTurmaPDF,
  type AlunoPorTurmaLinha,
} from "@/lib/alunos-por-turma-pdf"

interface Turma {
  id: string
  nome: string
  serie: string | null
  turno: string | null
  ano_letivo: number | null
}

interface AlunosPorTurmaViewProps {
  turmas: Turma[]
  turmaSelecionadaId: string | null
  turmaSelecionada: Turma | null
  alunos: AlunoPorTurmaLinha[]
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "-"
  const [year, month, day] = dateString.split("-")
  if (!year || !month || !day) return "-"
  return `${day}/${month}/${year}`
}

export function AlunosPorTurmaView({
  turmas,
  turmaSelecionadaId,
  turmaSelecionada,
  alunos,
}: AlunosPorTurmaViewProps) {
  const router = useRouter()
  const [isExporting, setIsExporting] = useState(false)

  function handleTurmaChange(value: string) {
    router.push(`/relatorios/alunos-por-turma?turma=${value}`)
  }

  async function handleExport() {
    if (!turmaSelecionada || alunos.length === 0) return
    try {
      setIsExporting(true)
      await generateAlunosPorTurmaPDF({
        turmaNome: turmaSelecionada.nome,
        turmaSerie: turmaSelecionada.serie,
        turno: turmaSelecionada.turno,
        anoLetivo: turmaSelecionada.ano_letivo,
        alunos,
      })
      toast.success("PDF exportado com sucesso")
    } catch {
      toast.error("Erro ao exportar PDF")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Seleção da Turma</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <Select value={turmaSelecionadaId ?? ""} onValueChange={handleTurmaChange}>
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue placeholder="Selecione uma turma" />
            </SelectTrigger>
            <SelectContent>
              {turmas.length === 0 && (
                <SelectItem value="__none__" disabled>
                  Nenhuma turma disponível
                </SelectItem>
              )}
              {turmas.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.nome} - {t.serie}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleExport} disabled={!turmaSelecionada || alunos.length === 0 || isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exportando..." : "Exportar PDF"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {turmaSelecionada
                ? `Alunos da Turma ${turmaSelecionada.nome}${turmaSelecionada.serie ? " - " + turmaSelecionada.serie : ""}`
                : "Alunos por Turma"}
              {turmaSelecionada && <span className="text-muted-foreground"> ({alunos.length})</span>}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {!turmaSelecionada ? (
            <p className="text-center py-8 text-muted-foreground">Selecione uma turma para visualizar os alunos.</p>
          ) : alunos.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhum aluno matriculado nesta turma.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Data Nascimento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alunos.map((aluno) => (
                  <TableRow key={aluno.matricula ?? aluno.nome_completo}>
                    <TableCell className="font-medium">{aluno.nome_completo}</TableCell>
                    <TableCell>
                      <span className="font-mono text-sm font-semibold text-blue-600">{aluno.matricula || "-"}</span>
                    </TableCell>
                    <TableCell>{aluno.cpf || "-"}</TableCell>
                    <TableCell>{formatDate(aluno.data_nascimento)}</TableCell>
                    <TableCell>
                      <Badge variant="default">Matriculado</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
