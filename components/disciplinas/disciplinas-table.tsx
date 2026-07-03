"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Edit, Eye, Trash2, Clock, ArrowUpDown, ArrowUp, ArrowDown, X } from "lucide-react"
import { deleteDisciplina } from "@/app/(authenticated)/disciplinas/actions"
import { DataPagination } from "@/components/ui/data-pagination"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { translateError } from "@/lib/error-messages"

interface Disciplina {
  id: string
  nome: string
  codigo: string
  descricao?: string
  carga_horaria?: number
  ativo: boolean
  created_at: string
  professores?: {
    id: string
    nome_completo: string
  }
}

interface DisciplinasTableProps {
  disciplinas: Disciplina[]
  currentPage: number
  totalPages: number
  pageSize: number
  totalCount: number
  busca: string
  status: string
  sortBy: string
  sortOrder: string
  currentUserTipo: string
}

export function DisciplinasTable({ disciplinas, currentPage, totalPages, pageSize, totalCount, busca, status, sortBy, sortOrder, currentUserTipo }: DisciplinasTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(busca)
  const [statusFilter, setStatusFilter] = useState(status)

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams)
    if (searchTerm) {
      params.set("busca", searchTerm)
    } else {
      params.delete("busca")
    }
    params.set("page", "1")
    router.push(`/disciplinas?${params.toString()}`)
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
    router.push(`/disciplinas?${params.toString()}`)
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setStatusFilter("todos")
    const params = new URLSearchParams()
    params.set("page", "1")
    router.push(`/disciplinas?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", page.toString())
    router.push(`/disciplinas?${params.toString()}`)
  }

  const handlePageSizeChange = (size: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("limit", size.toString())
    params.set("page", "1")
    router.push(`/disciplinas?${params.toString()}`)
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
    return sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
  }

  const handleDelete = async (disciplinaId: string) => {
    const result = await deleteDisciplina(disciplinaId)
    if (result.error) {
      toast.error(translateError(result.error))
    } else {
      toast.success("Disciplina excluída com sucesso")
      router.refresh()
    }
  }

  const handleSort = (column: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("sortBy", column)
    params.set("sortOrder", sortBy === column && sortOrder === "asc" ? "desc" : "asc")
    params.set("page", "1")
    router.push(`/disciplinas?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Buscar por nome, código ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="ativo">Ativas</SelectItem>
            <SelectItem value="inativo">Inativas</SelectItem>
          </SelectContent>
        </Select>
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
              <TableHead>
                <button onClick={() => handleSort("nome")} className="flex items-center gap-1 font-medium">
                  Nome
                  <SortIcon column="nome" />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleSort("codigo")} className="flex items-center gap-1 font-medium">
                  Código
                  <SortIcon column="codigo" />
                </button>
              </TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>
                <button onClick={() => handleSort("carga_horaria")} className="flex items-center gap-1 font-medium">
                  Carga Horária
                  <SortIcon column="carga_horaria" />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleSort("professor")} className="flex items-center gap-1 font-medium">
                  Professor
                  <SortIcon column="professor" />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleSort("ativo")} className="flex items-center gap-1 font-medium">
                  Status
                  <SortIcon column="ativo" />
                </button>
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {disciplinas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Nenhuma disciplina encontrada
                </TableCell>
              </TableRow>
            ) : (
              disciplinas.map((disciplina) => (
                <TableRow key={disciplina.id}>
                  <TableCell>
                    <div className="font-medium">{disciplina.nome}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{disciplina.codigo}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">{disciplina.descricao || "-"}</div>
                  </TableCell>
                  <TableCell>
                    {disciplina.carga_horaria ? (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        {disciplina.carga_horaria}h
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {disciplina.professores?.nome_completo || (
                        <span className="text-gray-400 italic">Sem professor</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={disciplina.ativo ? "default" : "secondary"}>
                      {disciplina.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/disciplinas/${disciplina.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/disciplinas/${disciplina.id}/editar`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      {["admin", "diretor"].includes(currentUserTipo) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Disciplina</AlertDialogTitle>
                              <AlertDialogDescription>
                                A disciplina será removida permanentemente, incluindo todas as associações com turmas e professores. Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(disciplina.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
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
