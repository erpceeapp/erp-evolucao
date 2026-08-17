"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, Filter, Search, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataPagination } from "@/components/ui/data-pagination"
import { jsPDF } from "jspdf"

const DEFAULT_PAGE_SIZE = 10

type Turma = {
  id: string
  nome: string
  serie: string | null
}

type Matricula = {
  id: string
  aluno_id: string
  turma_id: string | null
  status: string | null
  turmas?: Turma
}

export type AlunoRelatorio = {
  id: string
  matricula: string | null
  nome_completo: string
  email: string | null
  cpf: string | null
  data_nascimento: string | null
  matriculas: Matricula[]
}

type AlunosRelatorioTableProps = {
  alunos: AlunoRelatorio[]
}

export function AlunosRelatorioTable({ alunos }: AlunosRelatorioTableProps) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("todos")
  const [turmaId, setTurmaId] = useState("todas")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const turmas = useMemo(() => {
    const turmaMap = new Map<string, Turma>()
    alunos.forEach((aluno) => {
      aluno.matriculas.forEach((matricula) => {
        if (matricula.turmas) turmaMap.set(matricula.turmas.id, matricula.turmas)
      })
    })
    return Array.from(turmaMap.values()).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
  }, [alunos])

  const filteredAlunos = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR")

    return alunos.filter((aluno) => {
      const matriculaAtiva = aluno.matriculas.some((matricula) => matricula.status === "ativa")
      const matchesStatus = status === "todos" || (status === "matriculado" ? matriculaAtiva : !matriculaAtiva)
      const matchesTurma =
        turmaId === "todas" || aluno.matriculas.some((matricula) => matricula.turma_id === turmaId)
      const searchableText = [aluno.nome_completo, aluno.matricula, aluno.email, aluno.cpf]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("pt-BR")

      return matchesStatus && matchesTurma && (!normalizedSearch || searchableText.includes(normalizedSearch))
    })
  }, [alunos, search, status, turmaId])

  const totalPages = Math.max(1, Math.ceil(filteredAlunos.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedAlunos = filteredAlunos.slice((safePage - 1) * pageSize, safePage * pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, status, turmaId])

  function clearFilters() {
    setSearch("")
    setStatus("todos")
    setTurmaId("todas")
    setCurrentPage(1)
  }

  function exportCsv() {
    const headers = ["Matrícula", "Nome", "Email", "CPF", "Data Nascimento", "Turma Atual", "Status"]
    const rows = filteredAlunos.map((aluno) => {
      const matriculaAtiva = aluno.matriculas.find((matricula) => matricula.status === "ativa")
      return [
        aluno.matricula || "-",
        aluno.nome_completo,
        aluno.email || "-",
        aluno.cpf || "-",
        aluno.data_nascimento ? new Date(aluno.data_nascimento).toLocaleDateString("pt-BR") : "-",
        matriculaAtiva?.turmas ? `${matriculaAtiva.turmas.nome} - ${matriculaAtiva.turmas.serie || ""}` : "-",
        matriculaAtiva ? "Matriculado" : "Sem Matrícula",
      ]
    })
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(";"))
      .join("\n")
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "relatorio-alunos.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  function exportPdf() {
    const pdf = new jsPDF("landscape", "mm", "a4")
    const headers = ["Matrícula", "Nome", "Email", "CPF", "Turma", "Status"]
    const columns = [
      { x: 14, width: 25 },
      { x: 39, width: 65 },
      { x: 104, width: 72 },
      { x: 176, width: 34 },
      { x: 210, width: 48 },
      { x: 258, width: 25 },
    ]
    const rows = filteredAlunos.map((aluno) => {
      const matriculaAtiva = aluno.matriculas.find((matricula) => matricula.status === "ativa")
      return [
        aluno.matricula || "-",
        aluno.nome_completo,
        aluno.email || "-",
        aluno.cpf || "-",
        matriculaAtiva?.turmas ? `${matriculaAtiva.turmas.nome} - ${matriculaAtiva.turmas.serie || ""}` : "-",
        matriculaAtiva ? "Matriculado" : "Sem Matrícula",
      ]
    })

    pdf.setFontSize(16)
    pdf.text("Relatório de Alunos", 14, 15)
    pdf.setFontSize(9)
    pdf.text(`Total: ${filteredAlunos.length}`, 14, 22)

    const drawHeader = (topY: number) => {
      pdf.setFont("helvetica", "bold")
      headers.forEach((header, index) => pdf.text(header, columns[index].x, topY))
      pdf.setFont("helvetica", "normal")
    }

    let y = 32
    drawHeader(y)
    y += 6

    rows.forEach((row) => {
      const lines = row.map((value, index) => pdf.splitTextToSize(value, columns[index].width))
      const rowHeight = Math.max(...lines.map((column) => column.length)) * 4 + 2

      if (y + rowHeight > 190) {
        pdf.addPage()
        y = 18
        drawHeader(y)
        y += 6
      }

      lines.forEach((column, index) => pdf.text(column, columns[index].x, y))
      y += rowHeight
    })

    pdf.save("relatorio-alunos.pdf")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setFiltersOpen((open) => !open)}>
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          <Button variant="outline" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button onClick={exportPdf}>
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar aluno..."
            className="pl-10"
          />
        </div>
      </div>

      {filtersOpen && (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="status-filter">
              Status
            </label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status-filter" className="w-full sm:w-48">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="matriculado">Matriculados</SelectItem>
                <SelectItem value="sem-matricula">Sem matrícula</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="turma-filter">
              Turma
            </label>
            <Select value={turmaId} onValueChange={setTurmaId}>
              <SelectTrigger id="turma-filter" className="w-full sm:w-56">
                <SelectValue placeholder="Todas as turmas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as turmas</SelectItem>
                {turmas.map((turma) => (
                  <SelectItem key={turma.id} value={turma.id}>
                    {turma.nome} {turma.serie ? `- ${turma.serie}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="ghost" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Limpar filtros
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            Alunos Cadastrados ({filteredAlunos.length})
            {filteredAlunos.length !== alunos.length && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">de {alunos.length}</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matrícula</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Data Nascimento</TableHead>
                <TableHead>Turma Atual</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlunos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Nenhum aluno encontrado com os filtros atuais.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAlunos.map((aluno) => {
                  const matriculaAtiva = aluno.matriculas.find((matricula) => matricula.status === "ativa")
                  return (
                    <TableRow key={aluno.id}>
                      <TableCell>
                        <span className="font-mono text-sm font-semibold text-blue-600">{aluno.matricula || "-"}</span>
                      </TableCell>
                      <TableCell className="font-medium">{aluno.nome_completo}</TableCell>
                      <TableCell>{aluno.email || "-"}</TableCell>
                      <TableCell>{aluno.cpf || "-"}</TableCell>
                      <TableCell>
                        {aluno.data_nascimento ? new Date(aluno.data_nascimento).toLocaleDateString("pt-BR") : "-"}
                      </TableCell>
                      <TableCell>
                        {matriculaAtiva?.turmas ? (
                          <span>
                            {matriculaAtiva.turmas.nome} - {matriculaAtiva.turmas.serie}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={matriculaAtiva ? "default" : "secondary"}>
                          {matriculaAtiva ? "Matriculado" : "Sem Matrícula"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
          <div className="mt-4">
            <DataPagination
              currentPage={safePage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalCount={filteredAlunos.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setCurrentPage(1)
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
