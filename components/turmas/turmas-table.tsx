"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Edit, Eye, Users, X } from "lucide-react"
import { DataPagination } from "@/components/ui/data-pagination"
import { SearchableSelect } from "@/components/ui/searchable-select"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

interface Turma {
  id: string
  nome: string
  ano_letivo: number
  serie: string
  turno: string
  capacidade_maxima?: number
  alunos_matriculados?: number
  professor_responsavel?: {
    nome_completo: string
  }
  ativo: boolean
  created_at: string
}

interface TurmasTableProps {
  turmas: Turma[]
  currentPage: number
  totalPages: number
  pageSize: number
  totalCount: number
  busca: string
  ano: string
  status: string
}

export function TurmasTable({ turmas, currentPage, totalPages, pageSize, totalCount, busca, ano, status }: TurmasTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(busca)
  const [anoFilter, setAnoFilter] = useState(ano)
  const [statusFilter, setStatusFilter] = useState(status)

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams)
    if (searchTerm) {
      params.set("busca", searchTerm)
    } else {
      params.delete("busca")
    }
    params.set("page", "1")
    router.push(`/turmas?${params.toString()}`)
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
    router.push(`/turmas?${params.toString()}`)
  }

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus)
    const params = new URLSearchParams(searchParams)
    if (newStatus !== "todos") {
      params.set("status", newStatus)
    } else {
      params.delete("status")
    }
    params.set("page", "1")
    router.push(`/turmas?${params.toString()}`)
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setAnoFilter("")
    setStatusFilter("")
    const params = new URLSearchParams()
    params.set("page", "1")
    router.push(`/turmas?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", page.toString())
    router.push(`/turmas?${params.toString()}`)
  }

  const handlePageSizeChange = (size: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("limit", size.toString())
    params.set("page", "1")
    router.push(`/turmas?${params.toString()}`)
  }

  const getTurnoLabel = (turno: string) => {
    const turnos: Record<string, string> = {
      matutino: "Manhã",
      vespertino: "Tarde",
      noturno: "Noite",
    }
    return turnos[turno] || turno
  }

  const getTurnoBadgeColor = (turno: string) => {
    const colors: Record<string, string> = {
      matutino: "bg-yellow-100 text-yellow-800",
      vespertino: "bg-orange-100 text-orange-800",
      noturno: "bg-blue-100 text-blue-800",
    }
    return colors[turno] || "bg-gray-100 text-gray-800"
  }

  // Gerar anos disponíveis (últimos 5 anos + próximos 2)
  const currentYear = new Date().getFullYear()
  const availableYears = Array.from({ length: 8 }, (_, i) => currentYear - 3 + i)

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Buscar por nome ou série..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
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
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ativo">Ativas</SelectItem>
              <SelectItem value="inativo">Inativas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleClearFilters}
          title="Limpar filtros"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Turma</TableHead>
              <TableHead>Série</TableHead>
              <TableHead>Ano Letivo</TableHead>
              <TableHead>Turno</TableHead>
              <TableHead>Professor Responsável</TableHead>
              <TableHead>Capacidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {turmas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  Nenhuma turma encontrada
                </TableCell>
              </TableRow>
            ) : (
              turmas.map((turma) => (
                <TableRow key={turma.id}>
                  <TableCell>
                    <div className="font-medium">{turma.nome}</div>
                  </TableCell>
                  <TableCell>{turma.serie}</TableCell>
                  <TableCell>{turma.ano_letivo}</TableCell>
                  <TableCell>
                    <Badge className={getTurnoBadgeColor(turma.turno)} variant="secondary">
                      {getTurnoLabel(turma.turno)}
                    </Badge>
                  </TableCell>
                  <TableCell>{turma.professor_responsavel?.nome_completo || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      {turma.capacidade_maxima
                        ? `${turma.alunos_matriculados ?? "?"}/${turma.capacidade_maxima}`
                        : "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={turma.ativo ? "default" : "secondary"}>{turma.ativo ? "Ativa" : "Inativa"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/turmas/${turma.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/turmas/${turma.id}/editar`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
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
