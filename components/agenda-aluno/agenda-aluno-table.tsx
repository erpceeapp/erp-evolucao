"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, BookUser } from "lucide-react"
import { DataPagination } from "@/components/ui/data-pagination"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

interface MatriculaRef {
  turma_id: string
  turmas: { nome: string }[]
}

interface AlunoRow {
  id: string
  nome_completo: string
  cpf: string | null
  matriculas: MatriculaRef[]
}

interface TurmaOption {
  id: string
  nome: string
}

interface AgendaAlunoTableProps {
  alunos: AlunoRow[]
  turmas: TurmaOption[]
  currentPage: number
  totalPages: number
  pageSize: number
  totalCount: number
  busca: string
  turmaFilter: string
}

export function AgendaAlunoTable({
  alunos,
  turmas,
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  busca,
  turmaFilter,
}: AgendaAlunoTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(busca)
  const [turmaSelect, setTurmaSelect] = useState(turmaFilter)

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams)
    if (searchTerm) {
      params.set("busca", searchTerm)
    } else {
      params.delete("busca")
    }
    params.set("page", "1")
    router.push(`/agenda-aluno?${params.toString()}`)
  }

  const handleTurmaChange = (value: string) => {
    setTurmaSelect(value)
    const params = new URLSearchParams(searchParams)
    if (value && value !== "todas") {
      params.set("turma", value)
    } else {
      params.delete("turma")
    }
    params.set("page", "1")
    router.push(`/agenda-aluno?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", page.toString())
    router.push(`/agenda-aluno?${params.toString()}`)
  }

  const handlePageSizeChange = (size: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("limit", size.toString())
    params.set("page", "1")
    router.push(`/agenda-aluno?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Buscar por nome ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Select value={turmaSelect} onValueChange={handleTurmaChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por turma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as turmas</SelectItem>
            {turmas.map((turma) => (
              <SelectItem key={turma.id} value={turma.id}>
                {turma.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Turmas</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alunos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                  Nenhum aluno encontrado
                </TableCell>
              </TableRow>
            ) : (
              alunos.map((aluno) => (
                <TableRow key={aluno.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-cyan-700">
                          {aluno.nome_completo.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="font-medium">{aluno.nome_completo}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {aluno.cpf
                      ? `${aluno.cpf.slice(0, 3)}.${aluno.cpf.slice(3, 6)}.${aluno.cpf.slice(6, 9)}-${aluno.cpf.slice(9, 11)}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {aluno.matriculas && aluno.matriculas.length > 0 ? (
                        aluno.matriculas.map((m, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {m.turmas?.[0]?.nome || "Sem turma"}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">Sem matrícula</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/agenda-aluno/${aluno.id}`}>
                        <BookUser className="h-4 w-4 mr-1" />
                        Agenda
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DataPagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  )
}
