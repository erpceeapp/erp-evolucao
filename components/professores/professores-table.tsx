"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Edit, Eye, X } from "lucide-react"
import { DataPagination } from "@/components/ui/data-pagination"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

interface Professor {
  id: string
  nome_completo: string
  cpf?: string
  email: string
  telefone?: string
  formacao?: string
  especializacao?: string
  data_admissao?: string
  salario?: number
  ativo: boolean
  created_at: string
}

interface ProfessoresTableProps {
  professores: Professor[]
  currentPage: number
  totalPages: number
  pageSize: number
  totalCount: number
  busca: string
  status: string
}

export function ProfessoresTable({ professores, currentPage, totalPages, pageSize, totalCount, busca, status }: ProfessoresTableProps) {
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
    router.push(`/professores?${params.toString()}`)
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
    router.push(`/professores?${params.toString()}`)
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setStatusFilter("")
    const params = new URLSearchParams()
    params.set("page", "1")
    router.push(`/professores?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", page.toString())
    router.push(`/professores?${params.toString()}`)
  }

  const handlePageSizeChange = (size: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("limit", size.toString())
    params.set("page", "1")
    router.push(`/professores?${params.toString()}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const formatSalary = (salary?: number) => {
    if (!salary) return "-"
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(salary)
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Buscar por nome, CPF, email ou formação..."
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
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="inativo">Inativos</SelectItem>
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
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Formação</TableHead>
              <TableHead>Admissão</TableHead>
              <TableHead>Salário</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {professores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Nenhum professor encontrado
                </TableCell>
              </TableRow>
            ) : (
              professores.map((professor) => (
                <TableRow key={professor.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{professor.nome_completo}</div>
                      {professor.telefone && <div className="text-sm text-gray-500">{professor.telefone}</div>}
                    </div>
                  </TableCell>
                  <TableCell>{professor.email}</TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">{professor.formacao || "-"}</div>
                      {professor.especializacao && (
                        <div className="text-xs text-gray-500">{professor.especializacao}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{professor.data_admissao ? formatDate(professor.data_admissao) : "-"}</TableCell>
                  <TableCell>{formatSalary(professor.salario)}</TableCell>
                  <TableCell>
                    <Badge variant={professor.ativo ? "default" : "secondary"}>
                      {professor.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/professores/${professor.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/professores/${professor.id}/editar`}>
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
