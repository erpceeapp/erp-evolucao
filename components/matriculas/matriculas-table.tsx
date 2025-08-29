"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Edit, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

interface Matricula {
  id: string
  numero_matricula: string
  ano_letivo: number
  data_matricula: string
  status: string
  aluno: {
    nome_completo: string
    cpf?: string
  }
  turma: {
    nome: string
    serie: string
    ano_letivo: number
  }
  created_at: string
}

interface Turma {
  id: string
  nome: string
  serie: string
}

interface MatriculasTableProps {
  matriculas: Matricula[]
  turmas: Turma[]
  currentPage: number
  totalPages: number
  busca: string
  status: string
  ano: string
  turma: string
}

export function MatriculasTable({
  matriculas,
  turmas,
  currentPage,
  totalPages,
  busca,
  status,
  ano,
  turma,
}: MatriculasTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(busca)
  const [statusFilter, setStatusFilter] = useState(status)
  const [anoFilter, setAnoFilter] = useState(ano)
  const [turmaFilter, setTurmaFilter] = useState(turma)

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams)
    if (searchTerm) {
      params.set("busca", searchTerm)
    } else {
      params.delete("busca")
    }
    params.set("page", "1")
    router.push(`/matriculas?${params.toString()}`)
  }

  const handleFilterChange = (filterType: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value !== "todos" && value !== "") {
      params.set(filterType, value)
    } else {
      params.delete(filterType)
    }
    params.set("page", "1")
    router.push(`/matriculas?${params.toString()}`)

    // Update local state
    switch (filterType) {
      case "status":
        setStatusFilter(value)
        break
      case "ano":
        setAnoFilter(value)
        break
      case "turma":
        setTurmaFilter(value)
        break
    }
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", page.toString())
    router.push(`/matriculas?${params.toString()}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      ativa: { label: "Ativa", variant: "default" },
      transferida: { label: "Transferida", variant: "secondary" },
      cancelada: { label: "Cancelada", variant: "destructive" },
      concluida: { label: "Concluída", variant: "secondary" },
    }

    const config = statusConfig[status] || { label: status, variant: "secondary" }
    return (
      <Badge variant={config.variant} className="capitalize">
        {config.label}
      </Badge>
    )
  }

  // Gerar anos disponíveis (últimos 5 anos + próximos 2)
  const currentYear = new Date().getFullYear()
  const availableYears = Array.from({ length: 8 }, (_, i) => currentYear - 3 + i)

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Buscar por número de matrícula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={statusFilter || "todos"} onValueChange={(value) => handleFilterChange("status", value)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="ativa">Ativas</SelectItem>
              <SelectItem value="transferida">Transferidas</SelectItem>
              <SelectItem value="cancelada">Canceladas</SelectItem>
              <SelectItem value="concluida">Concluídas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={anoFilter || "todos"} onValueChange={(value) => handleFilterChange("ano", value)}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Anos</SelectItem>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={turmaFilter || "todos"} onValueChange={(value) => handleFilterChange("turma", value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as Turmas</SelectItem>
              {turmas.map((turma) => (
                <SelectItem key={turma.id} value={turma.id}>
                  {turma.nome} - {turma.serie}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Aluno</TableHead>
              <TableHead>Turma</TableHead>
              <TableHead>Ano Letivo</TableHead>
              <TableHead>Data Matrícula</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matriculas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Nenhuma matrícula encontrada
                </TableCell>
              </TableRow>
            ) : (
              matriculas.map((matricula) => (
                <TableRow key={matricula.id}>
                  <TableCell>
                    <div className="font-mono text-sm">{matricula.numero_matricula}</div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{matricula.aluno.nome_completo}</div>
                      {matricula.aluno.cpf && <div className="text-sm text-gray-500">{matricula.aluno.cpf}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{matricula.turma.nome}</div>
                      <div className="text-sm text-gray-500">{matricula.turma.serie}</div>
                    </div>
                  </TableCell>
                  <TableCell>{matricula.ano_letivo}</TableCell>
                  <TableCell>{formatDate(matricula.data_matricula)}</TableCell>
                  <TableCell>{getStatusBadge(matricula.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/matriculas/${matricula.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/matriculas/${matricula.id}/editar`}>
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
