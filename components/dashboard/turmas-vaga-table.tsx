"use client"

import { useState, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataPagination } from "@/components/ui/data-pagination"

interface TurmaComVaga {
  id: string
  nome: string
  serie: string
  turno: string
  vagas: number
}

interface TurmasVagaTableProps {
  data: TurmaComVaga[]
}

export function TurmasVagaTable({ data }: TurmasVagaTableProps) {
  const [turnoFilter, setTurnoFilter] = useState("todos")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtered = useMemo(() => {
    if (turnoFilter === "todos") return data
    return data.filter((t) => t.turno === turnoFilter)
  }, [data, turnoFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const handlePageChange = (p: number) => setPage(p)
  const handlePageSizeChange = (s: number) => {
    setPageSize(s)
    setPage(1)
  }

  const turnos = [...new Set(data.map((t) => t.turno))]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Turno:</span>
        <Select value={turnoFilter} onValueChange={(v) => { setTurnoFilter(v); setPage(1) }}>
          <SelectTrigger className="h-9 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {turnos.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Turma</TableHead>
            <TableHead>Série</TableHead>
            <TableHead>Turno</TableHead>
            <TableHead className="text-right w-24">Vagas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-gray-500 py-6">
                Nenhuma turma com vagas encontrada.
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.nome}</TableCell>
                <TableCell>{t.serie}</TableCell>
                <TableCell>{t.turno}</TableCell>
                <TableCell className="text-right font-semibold text-green-600 tabular-nums">
                  {t.vagas} vaga{t.vagas !== 1 ? "s" : ""}
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
