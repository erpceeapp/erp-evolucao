"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, X, BookOpen, Users } from "lucide-react"
import { DataPagination } from "@/components/ui/data-pagination"
import { SearchableSelect } from "@/components/ui/searchable-select"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

interface Disciplina {
  id: string
  nome: string
  codigo: string
}

interface TurmaRow {
  id: string
  nome: string
  serie: string | null
  turno: string | null
  ano_letivo: number
  totalAlunos: number
  disciplinas: Disciplina[]
}

interface NotasTurmasTableProps {
  turmas: TurmaRow[]
  currentPage: number
  totalPages: number
  pageSize: number
  totalCount: number
  busca: string
  ano: string
}

export function NotasTurmasTable({ turmas, currentPage, totalPages, pageSize, totalCount, busca, ano }: NotasTurmasTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(busca)
  const [anoFilter, setAnoFilter] = useState(ano)

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams)
    if (searchTerm) {
      params.set("busca", searchTerm)
    } else {
      params.delete("busca")
    }
    params.set("page", "1")
    router.push(`/notas?${params.toString()}`)
  }

  const handleAnoChange = (newAno: string) => {
    setAnoFilter(newAno)
    const params = new URLSearchParams(searchParams)
    if (newAno !== "todos") {
      params.set("ano", newAno)
    } else {
      params.delete("ano")
    }
    params.set("page", "1")
    router.push(`/notas?${params.toString()}`)
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setAnoFilter("todos")
    const params = new URLSearchParams()
    params.set("page", "1")
    router.push(`/notas?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", page.toString())
    router.push(`/notas?${params.toString()}`)
  }

  const handlePageSizeChange = (size: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("limit", size.toString())
    params.set("page", "1")
    router.push(`/notas?${params.toString()}`)
  }

  const getTurnoLabel = (turno: string) => {
    const turnos: Record<string, string> = {
      matutino: "Manha",
      vespertino: "Tarde",
      noturno: "Noite",
    }
    return turnos[turno] || turno
  }

  const currentYear = new Date().getFullYear()
  const availableYears = Array.from({ length: 8 }, (_, i) => currentYear - 3 + i)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Buscar por nome da turma..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <SearchableSelect
            value={anoFilter || "todos"}
            onChange={handleAnoChange}
            placeholder="Ano"
            allLabel="Todos os Anos"
            options={availableYears.map((year) => ({ value: year.toString(), label: year.toString() }))}
          />
          <Button variant="outline" size="icon" onClick={handleClearFilters} title="Limpar filtros">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border rounded-lg [&_td]:py-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Turma</TableHead>
              <TableHead>Serie</TableHead>
              <TableHead>Turno</TableHead>
              <TableHead>Ano Letivo</TableHead>
              <TableHead>Alunos</TableHead>
              <TableHead>Disciplinas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {turmas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Nenhuma turma encontrada
                </TableCell>
              </TableRow>
            ) : (
              turmas.map((turma) => (
                <TableRow key={turma.id}>
                  <TableCell>
                    <div className="font-medium">{turma.nome}</div>
                  </TableCell>
                  <TableCell>{turma.serie || "-"}</TableCell>
                  <TableCell>{turma.turno ? getTurnoLabel(turma.turno) : "-"}</TableCell>
                  <TableCell>{turma.ano_letivo}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      {turma.totalAlunos}
                    </div>
                  </TableCell>
                  <TableCell>
                    {turma.disciplinas.length === 0 ? (
                      <span className="text-sm text-gray-400">Nenhuma</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {turma.disciplinas.map((disciplina) => (
                          <Link
                            key={disciplina.id}
                            href={`/notas/${turma.id}/${disciplina.id}`}
                            className="inline-flex items-center gap-1 px-2 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100 transition-colors leading-5"
                          >
                            <BookOpen className="h-3 w-3 shrink-0" />
                            {disciplina.nome}
                          </Link>
                        ))}
                      </div>
                    )}
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
