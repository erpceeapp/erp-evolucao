"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataPagination } from "@/components/ui/data-pagination"

interface AlunoSemMatricula {
  id: string
  nome_completo: string
  matricula: string | null
}

interface AlunosSemMatriculaTableProps {
  data: AlunoSemMatricula[]
}

export function AlunosSemMatriculaTable({ data }: AlunosSemMatriculaTableProps) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const term = search.toLowerCase()
    return data.filter((a) => a.nome_completo.toLowerCase().includes(term))
  }, [data, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const handlePageChange = (p: number) => setPage(p)
  const handlePageSizeChange = (s: number) => {
    setPageSize(s)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="pl-9 h-9 text-sm"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead className="text-right w-28">Matrícula</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-gray-500 py-6">
                Nenhum aluno encontrado.
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.nome_completo}</TableCell>
                <TableCell className="text-right font-mono text-xs text-gray-400">
                  {a.matricula || "-"}
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
