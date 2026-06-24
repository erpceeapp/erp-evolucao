"use client"

import { useMemo, useState } from "react"
import { BookOpen, Search, AlertCircle, Settings, NotebookPen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataPagination } from "@/components/ui/data-pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

interface TurmaDisciplina {
  turma_id: string
  disciplina_id: string
  professor_id: string | null
  turmas: { id: string; nome: string; serie: string; ano_letivo: number } | null
  disciplinas: { id: string; nome: string; codigo: string } | null
  professores: { id: string; nome_completo: string } | null
}

interface Turma {
  id: string
  nome: string
  serie: string
  ano_letivo: number
}

interface DiarioTurmasViewProps {
  turmasComDisciplinas: TurmaDisciplina[]
  turmasSemDisciplinas: Turma[]
  totalTurmas: number
}

interface Row {
  id: string
  turmaNome: string
  serie: string
  anoLetivo: number
  disciplinaNome: string | null
  disciplinaCodigo: string | null
  professorNome: string | null
  status: "pronta" | "precisa_configuracao"
  turmaId: string
  disciplinaId: string | null
}

const PAGE_SIZE = 15

export function DiarioTurmasView({ turmasComDisciplinas, turmasSemDisciplinas, totalTurmas }: DiarioTurmasViewProps) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("pronta")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)

  const allRows = useMemo<Row[]>(() => {
    const prontas: Row[] = turmasComDisciplinas.map((item) => ({
      id: `${item.turma_id}-${item.disciplina_id}`,
      turmaNome: item.turmas?.nome ?? "",
      serie: item.turmas?.serie ?? "",
      anoLetivo: item.turmas?.ano_letivo ?? 0,
      disciplinaNome: item.disciplinas?.nome ?? null,
      disciplinaCodigo: item.disciplinas?.codigo ?? null,
      professorNome: item.professores?.nome_completo ?? null,
      status: "pronta" as const,
      turmaId: item.turma_id,
      disciplinaId: item.disciplina_id,
    }))

    const precisam: Row[] = turmasSemDisciplinas.map((turma) => ({
      id: turma.id,
      turmaNome: turma.nome,
      serie: turma.serie,
      anoLetivo: turma.ano_letivo,
      disciplinaNome: null,
      disciplinaCodigo: null,
      professorNome: null,
      status: "precisa_configuracao" as const,
      turmaId: turma.id,
      disciplinaId: null,
    }))

    return [...prontas, ...precisam]
  }, [turmasComDisciplinas, turmasSemDisciplinas])

  const filtered = useMemo(() => {
    let result = allRows

    if (filter === "pronta") {
      result = result.filter((r) => r.status === "pronta")
    } else if (filter === "precisa_configuracao") {
      result = result.filter((r) => r.status === "precisa_configuracao")
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (r) =>
          r.turmaNome.toLowerCase().includes(q) ||
          r.serie.toLowerCase().includes(q) ||
          (r.disciplinaNome && r.disciplinaNome.toLowerCase().includes(q)),
      )
    }

    return result
  }, [allRows, filter, search])

  const totalFiltered = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  if (totalTurmas === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma turma cadastrada</h3>
          <p className="text-gray-600 mb-4">Cadastre turmas para começar a usar o diário de classe.</p>
          <Button asChild>
            <Link href="/turmas/nova">Cadastrar Turma</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Turmas e Disciplinas ({totalTurmas})</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Buscar por turma, série ou disciplina..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
            <Button onClick={() => setPage(1)}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1) }}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ambas">Ambas</SelectItem>
              <SelectItem value="pronta">Prontas para Uso</SelectItem>
              <SelectItem value="precisa_configuracao">Precisam de Configuração</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <NotebookPen className="h-10 w-10 mx-auto mb-2 text-gray-300" />
            <p>Nenhum resultado encontrado</p>
          </div>
        ) : (
          <>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Turma</TableHead>
                    <TableHead>Série</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead>Disciplina</TableHead>
                    <TableHead>Professor</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.turmaNome}</TableCell>
                      <TableCell>{row.serie}</TableCell>
                      <TableCell>{row.anoLetivo}</TableCell>
                      <TableCell>
                        {row.disciplinaNome ? (
                          <span>
                            {row.disciplinaNome}
                            {row.disciplinaCodigo && (
                              <Badge variant="outline" className="ml-2">
                                {row.disciplinaCodigo}
                              </Badge>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-600">{row.professorNome ?? <span className="text-gray-400">—</span>}</TableCell>
                      <TableCell>
                        {row.status === "pronta" ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Pronta</Badge>
                        ) : (
                          <Badge variant="outline" className="border-orange-300 text-orange-600">
                            Precisa Configuração
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.status === "pronta" && row.disciplinaId ? (
                          <Button asChild size="sm" className="bg-cyan-600 hover:bg-cyan-700">
                            <Link href={`/diario/${row.turmaId}/${row.disciplinaId}`}>
                              <NotebookPen className="h-4 w-4 mr-1" />
                              Ver Diário
                            </Link>
                          </Button>
                        ) : (
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/turmas/${row.turmaId}`}>
                              <Settings className="h-4 w-4 mr-1" />
                              Configurar
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <DataPagination
              currentPage={safePage}
              totalPages={totalPages}
              totalCount={totalFiltered}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}
