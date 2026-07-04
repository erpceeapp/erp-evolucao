"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataPagination } from "@/components/ui/data-pagination"
import { MatriculaStatusBadge } from "@/components/ui/matricula-status-badge"

interface MatriculaPendente {
  id: string
  numero_matricula: string
  status: string
  aluno_nome: string
  turma_nome: string
}

interface MatriculasPendentesTableProps {
  data: MatriculaPendente[]
}

export function MatriculasPendentesTable({ data }: MatriculasPendentesTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtered = useMemo(() => {
    let result = data
    if (statusFilter !== "todos") {
      result = result.filter((m) => m.status === statusFilter)
    }
    if (search.trim()) {
      const term = search.toLowerCase()
      result = result.filter((m) => m.aluno_nome.toLowerCase().includes(term))
    }
    return result
  }, [data, statusFilter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const handlePageChange = (p: number) => setPage(p)
  const handlePageSizeChange = (s: number) => {
    setPageSize(s)
    setPage(1)
  }

  const statusList = [...new Set(data.map((m) => m.status))]

  const statusLabels: Record<string, string> = {
    transferida: "Transferida",
    cancelada: "Cancelada",
    concluida: "Concluida",
    trancada: "Trancada",
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por aluno..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Status:</span>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
            <SelectTrigger className="h-9 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {statusList.map((s) => (
                <SelectItem key={s} value={s}>{statusLabels[s] || s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Aluno</TableHead>
            <TableHead>Turma</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-gray-500 py-6">
                Nenhuma matrícula pendente encontrada.
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium truncate max-w-50">{m.aluno_nome}</TableCell>
                <TableCell className="text-gray-500">{m.turma_nome}</TableCell>
                <TableCell className="text-right">
                  <MatriculaStatusBadge status={m.status} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <DataPagination
        currentPage={safePage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalCount={filtered.length}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  )
}
