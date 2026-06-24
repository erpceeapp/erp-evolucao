"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Edit, Eye, Trash2 } from "lucide-react"
import { DataPagination } from "@/components/ui/data-pagination"
import { SearchableSelect } from "@/components/ui/searchable-select"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

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
  pageSize: number
  totalCount: number
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
  pageSize,
  totalCount,
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
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

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

  const handlePageSizeChange = (size: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("limit", size.toString())
    params.set("page", "1")
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

  const currentYear = new Date().getFullYear()
  const availableYears = Array.from({ length: 8 }, (_, i) => currentYear - 3 + i)

  const handleRemoverMatricula = async (matriculaId: string, numeroMatricula: string) => {
    if (!confirm(`Deseja realmente remover a matrícula ${numeroMatricula}? Esta ação não pode ser desfeita.`)) {
      return
    }

    setIsDeleting(matriculaId)

    const supabase = createClient()

    try {
      const { error } = await supabase.from("matriculas").update({ status: "cancelada" }).eq("id", matriculaId)

      if (error) throw error

      router.refresh()
    } catch (err: any) {
      console.error("Erro ao remover matrícula:", err)
      alert("Erro ao remover matrícula. Tente novamente.")
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
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
          <SearchableSelect
            value={anoFilter || "todos"}
            onChange={(value) => handleFilterChange("ano", value)}
            placeholder="Ano"
            allLabel="Todos os Anos"
            options={availableYears.map((year) => ({ value: year.toString(), label: year.toString() }))}
          />
          <SearchableSelect
            value={turmaFilter || "todos"}
            onChange={(value) => handleFilterChange("turma", value)}
            placeholder="Turma"
            allLabel="Todas as Turmas"
            options={turmas.map((t) => ({ value: t.id, label: `${t.nome} - ${t.serie}` }))}
          />
        </div>
      </div>

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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoverMatricula(matricula.id, matricula.numero_matricula)}
                        disabled={isDeleting === matricula.id || matricula.status === "cancelada"}
                        title={matricula.status === "cancelada" ? "Matrícula já cancelada" : "Remover matrícula"}
                      >
                        <Trash2
                          className={`h-4 w-4 ${isDeleting === matricula.id ? "text-gray-400" : "text-red-600"}`}
                        />
                      </Button>
                    </div>
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
