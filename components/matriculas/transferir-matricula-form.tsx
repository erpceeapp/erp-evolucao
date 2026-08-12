"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DataPagination } from "@/components/ui/data-pagination"
import { ArrowRightLeft, ArrowLeft, Search, AlertCircle, Check } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { translateError } from "@/lib/error-messages"
import { MatriculaStatusBadge } from "@/components/ui/matricula-status-badge"
import { cn } from "@/lib/utils"

interface Turma {
  id: string
  nome: string
  serie: string
  ano_letivo: number
  capacidade_maxima: number | null
}

interface TransferirMatriculaFormProps {
  matriculaId: string
  numeroMatricula: string
  alunoNome: string
  turmaAtualId: string
  turmaAtualNome: string
  turmas: Turma[]
}

export function TransferirMatriculaForm({
  matriculaId,
  numeroMatricula,
  alunoNome,
  turmaAtualId,
  turmaAtualNome,
  turmas,
}: TransferirMatriculaFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null)
  const [searchTurma, setSearchTurma] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [capacidadeInfo, setCapacidadeInfo] = useState<{ atual: number; maxima: number } | null>(null)

  const turmasDisponiveis = turmas.filter((t) => t.id !== turmaAtualId)

  const turmasFiltradas = turmasDisponiveis.filter(
    (turma) =>
      turma.nome.toLowerCase().includes(searchTurma.toLowerCase()) ||
      turma.serie.toLowerCase().includes(searchTurma.toLowerCase()),
  )

  const totalPages = Math.max(1, Math.ceil(turmasFiltradas.length / pageSize))
  const turmasPaginadas = turmasFiltradas.slice((page - 1) * pageSize, page * pageSize)

  const handlePageChange = (p: number) => {
    setPage(p)
    if (selectedTurma) {
      setSelectedTurma(null)
      setCapacidadeInfo(null)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchTurma(value)
    setPage(1)
  }

  const handleSelecionarTurma = async (turma: Turma) => {
    setSelectedTurma(turma)
    setSearchTurma("")

    const supabase = createClient()
    const { data: turmaData } = await supabase
      .from("turmas")
      .select("capacidade_maxima")
      .eq("id", turma.id)
      .single()

    const { count } = await supabase
      .from("matriculas")
      .select("*", { count: "exact", head: true })
      .eq("turma_id", turma.id)
      .eq("status", "ativa")

    if (turmaData) {
      setCapacidadeInfo({ atual: count || 0, maxima: turmaData.capacidade_maxima })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTurma) {
      setError("Selecione a turma de destino")
      return
    }

    if (capacidadeInfo && capacidadeInfo.atual >= capacidadeInfo.maxima) {
      setError("A turma de destino está com a capacidade máxima atingida")
      return
    }

    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { data, error: rpcError } = await supabase.rpc("transferir_matricula", {
        p_matricula_id: matriculaId,
        p_nova_turma_id: selectedTurma.id,
      })

      if (rpcError) throw rpcError

      router.push(`/matriculas/${data}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao transferir matrícula"
      setError(translateError(message))
    } finally {
      setIsLoading(false)
    }
  }

  const capacidadeAtingida = capacidadeInfo ? capacidadeInfo.atual >= capacidadeInfo.maxima : false

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Dados da Transferência
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Matrícula</Label>
                <p className="font-mono font-medium">{numeroMatricula}</p>
              </div>
              <div>
                <Label>Aluno</Label>
                <p className="font-medium">{alunoNome}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <div>
                <Label>Turma Atual</Label>
                <p className="font-medium text-purple-900">{turmaAtualNome}</p>
              </div>
              <ArrowRightLeft className="h-5 w-5 text-purple-500 shrink-0" />
              <div>
                <Label>Nova Turma</Label>
                <p className="font-medium text-purple-900">{selectedTurma ? selectedTurma.nome : "A selecionar"}</p>
              </div>
            </div>

            {!selectedTurma && (
              <div className="flex items-center gap-2">
                <MatriculaStatusBadge status="ativa" />
                <span className="text-sm text-muted-foreground">Será encerrada como transferida após a ação</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Seleção da Turma de Destino
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Pesquisar Turma</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Digite o nome ou série da turma..."
                  value={searchTurma}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Turma</TableHead>
                      <TableHead>Série</TableHead>
                      <TableHead>Ano Letivo</TableHead>
                      <TableHead className="text-right">Selecionar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {turmasPaginadas.length > 0 ? (
                      turmasPaginadas.map((turma) => {
                        const isSelected = selectedTurma?.id === turma.id
                        return (
                          <TableRow
                            key={turma.id}
                            className={cn("cursor-pointer", isSelected && "bg-cyan-50")}
                            onClick={() => handleSelecionarTurma(turma)}
                          >
                            <TableCell className="font-medium">{turma.nome}</TableCell>
                            <TableCell>{turma.serie}</TableCell>
                            <TableCell>{turma.ano_letivo}</TableCell>
                            <TableCell className="text-right">
                              {isSelected && (
                                <Badge variant="outline" className="gap-1">
                                  <Check className="h-3 w-3" />
                                  Selecionada
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                          Nenhuma turma encontrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {turmasFiltradas.length > 0 && (
                  <div className="border-t p-4">
                    <DataPagination
                      currentPage={page}
                      totalPages={totalPages}
                      pageSize={pageSize}
                      totalCount={turmasFiltradas.length}
                      onPageChange={handlePageChange}
                      onPageSizeChange={(size) => {
                        setPageSize(size)
                        setPage(1)
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {selectedTurma && (
              <div className="bg-green-50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium text-green-900">Turma Selecionada</h4>
                <p className="text-green-800">
                  <strong>Nome:</strong> {selectedTurma.nome}
                </p>
                <p className="text-green-800">
                  <strong>Série:</strong> {selectedTurma.serie}
                </p>
                <p className="text-green-800">
                  <strong>Ano Letivo:</strong> {selectedTurma.ano_letivo}
                </p>
                {capacidadeInfo && (
                  <div className="pt-2 border-t border-green-200">
                    <p className="text-green-800">
                      <strong>Capacidade:</strong> {capacidadeInfo.atual}/{capacidadeInfo.maxima} alunos
                    </p>
                    <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min((capacidadeInfo.atual / capacidadeInfo.maxima) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    {capacidadeAtingida && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>Capacidade máxima atingida</AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href={`/matriculas/${matriculaId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancelar
            </Link>
          </Button>
          <Button type="submit" disabled={isLoading || !selectedTurma || capacidadeAtingida}>
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            {isLoading ? "Transferindo..." : "Confirmar Transferência"}
          </Button>
        </div>
      </div>
    </form>
  )
}