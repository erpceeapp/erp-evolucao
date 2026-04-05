"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { BookUser, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import Link from "next/link"

export default function AgendaAlunoPage() {
  const [alunos, setAlunos] = useState<any[]>([])
  const [turmas, setTurmas] = useState<any[]>([])
  const [filtroNome, setFiltroNome] = useState("")
  const [filtroCpf, setFiltroCpf] = useState("")
  const [filtroTurma, setFiltroTurma] = useState("todas")
  const [loading, setLoading] = useState(true)
  const [matriculas, setMatriculas] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    // Buscar turmas
    const { data: turmasData } = await supabase
      .from("turmas")
      .select("id, nome")
      .order("nome")

    setTurmas(turmasData || [])

    // Buscar alunos
    const { data: alunosData } = await supabase
      .from("alunos")
      .select("id, nome_completo, cpf, ativo")
      .eq("ativo", true)
      .order("nome_completo")

    setAlunos(alunosData || [])

    // Buscar matriculas para vincular alunos a turmas
    const { data: matriculasData } = await supabase
      .from("matriculas")
      .select("aluno_id, turma_id")

    setMatriculas(matriculasData || [])

    setLoading(false)
  }

  function getTurmasDoAluno(alunoId: string) {
    const turmaIds = matriculas
      .filter((m) => m.aluno_id === alunoId)
      .map((m) => m.turma_id)
    return turmas.filter((t) => turmaIds.includes(t.id))
  }

  const alunosFiltrados = alunos.filter((aluno) => {
    const matchNome = aluno.nome_completo.toLowerCase().includes(filtroNome.toLowerCase())
    const matchCpf = filtroCpf === "" || (aluno.cpf && aluno.cpf.includes(filtroCpf))
    const matchTurma =
      filtroTurma === "todas" ||
      matriculas.some((m) => m.aluno_id === aluno.id && m.turma_id === filtroTurma)
    return matchNome && matchCpf && matchTurma
  })

  return (
    <>
      <PageHeader
        icon={BookUser}
        title="Agenda do Aluno"
        subtitle="Registre avisos, ocorrencias e comunicados individuais para os alunos"
        backHref="/dashboard"
      />
      <div className="container mx-auto p-6 space-y-6">
        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtros</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome..."
                  value={filtroNome}
                  onChange={(e) => setFiltroNome(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Input
                placeholder="Buscar por CPF..."
                value={filtroCpf}
                onChange={(e) => setFiltroCpf(e.target.value)}
              />
              <Select value={filtroTurma} onValueChange={setFiltroTurma}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por turma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as turmas</SelectItem>
                  {turmas.map((turma) => (
                    <SelectItem key={turma.id} value={turma.id}>
                      {turma.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de alunos */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" />
          </div>
        ) : alunosFiltrados.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {alunosFiltrados.map((aluno) => {
                  const turmasAluno = getTurmasDoAluno(aluno.id)
                  return (
                    <Link
                      key={aluno.id}
                      href={`/agenda-aluno/${aluno.id}`}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center">
                          <span className="text-sm font-semibold text-cyan-700">
                            {aluno.nome_completo.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{aluno.nome_completo}</p>
                          {aluno.cpf && (
                            <p className="text-sm text-gray-500">CPF: {aluno.cpf}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {turmasAluno.map((turma) => (
                          <Badge key={turma.id} variant="outline" className="text-xs">
                            {turma.nome}
                          </Badge>
                        ))}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookUser className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500 text-center">Nenhum aluno encontrado com os filtros selecionados</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
