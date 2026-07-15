"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Search, BookUser, X } from "lucide-react"
import { DataPagination } from "@/components/ui/data-pagination"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

interface AlunoRow {
  id: string
  nome_completo: string
  cpf: string | null
  turma_id: string | null
  turma_nome: string | null
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
  isProfessor?: boolean
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
  isProfessor = false,
}: AgendaAlunoTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(busca)
  const [turmaSelect, setTurmaSelect] = useState(
    isProfessor
      ? (turmaFilter && turmaFilter !== "todos" ? turmaFilter : turmas[0]?.id || "")
      : (turmaFilter || "todos")
  )

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
    if (isProfessor) {
      params.set("turma", value)
    } else if (value && value !== "todos") {
      params.set("turma", value)
    } else {
      params.delete("turma")
    }
    params.set("page", "1")
    router.push(`/agenda-aluno?${params.toString()}`)
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    const params = new URLSearchParams()
    if (isProfessor) {
      const firstTurmaId = turmas[0]?.id || ""
      setTurmaSelect(firstTurmaId)
      if (firstTurmaId) params.set("turma", firstTurmaId)
    } else {
      setTurmaSelect("todos")
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
        <SearchableSelect
          value={turmaSelect}
          onChange={handleTurmaChange}
          placeholder={isProfessor ? "Selecione uma turma" : "Turma"}
          allLabel={isProfessor ? undefined : "Todas as turmas"}
          options={turmas.map((t) => ({ value: t.id, label: t.nome }))}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={handleClearFilters}
          title="Limpar filtros"
        >
          <X className="h-4 w-4" />
        </Button>
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
                      <Badge variant="outline" className="text-xs">
                        {aluno.turma_nome || "Sem turma"}
                      </Badge>
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
