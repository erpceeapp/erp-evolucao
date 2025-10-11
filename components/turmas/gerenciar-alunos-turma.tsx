"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Search, UserPlus, UserMinus, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Aluno {
  id: string
  nome_completo: string
  cpf?: string
  data_nascimento?: string
}

interface AlunoMatriculado {
  id: string
  aluno: Aluno
}

interface GerenciarAlunosTurmaProps {
  turmaId: string
  capacidadeMaxima: number
  alunosMatriculados: AlunoMatriculado[]
  todosAlunos: Aluno[]
  totalAlunos: number
}

export function GerenciarAlunosTurma({
  turmaId,
  capacidadeMaxima,
  alunosMatriculados,
  todosAlunos,
  totalAlunos,
}: GerenciarAlunosTurmaProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [searchAlunoAdd, setSearchAlunoAdd] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const alunosIds = alunosMatriculados.map((m) => m.aluno.id)
  const alunosDisponiveis = todosAlunos.filter((a) => !alunosIds.includes(a.id))

  const alunosFiltrados = alunosMatriculados.filter((m) =>
    m.aluno.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const alunosDisponiveisFiltrados = alunosDisponiveis.filter((a) =>
    a.nome_completo.toLowerCase().includes(searchAlunoAdd.toLowerCase()),
  )

  const handleAdicionarAluno = async (alunoId: string) => {
    if (totalAlunos >= capacidadeMaxima) {
      setError("Capacidade máxima da turma atingida")
      return
    }

    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const currentYear = new Date().getFullYear()

    try {
      // Gerar número de matrícula
      const numeroMatricula = `${currentYear.toString().slice(-2)}${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`

      const { error } = await supabase.from("matriculas").insert({
        numero_matricula: numeroMatricula,
        aluno_id: alunoId,
        turma_id: turmaId,
        ano_letivo: currentYear,
        data_matricula: new Date().toISOString().split("T")[0],
        status: "ativa",
      })

      if (error) throw error

      setIsAddDialogOpen(false)
      setSearchAlunoAdd("")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Erro ao adicionar aluno")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoverAluno = async (matriculaId: string) => {
    if (!confirm("Deseja realmente remover este aluno da turma?")) return

    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { error } = await supabase.from("matriculas").update({ status: "cancelada" }).eq("id", matriculaId)

      if (error) throw error

      router.refresh()
    } catch (err: any) {
      setError(err.message || "Erro ao remover aluno")
    } finally {
      setIsLoading(false)
    }
  }

  const capacidadeAtingida = totalAlunos >= capacidadeMaxima

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Alunos Matriculados ({totalAlunos}/{capacidadeMaxima})
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={capacidadeAtingida}>
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Aluno
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adicionar Aluno à Turma</DialogTitle>
                <DialogDescription>Selecione um aluno para matricular nesta turma</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {capacidadeAtingida && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Capacidade máxima da turma atingida</AlertDescription>
                  </Alert>
                )}

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Pesquisar aluno por nome..."
                    value={searchAlunoAdd}
                    onChange={(e) => setSearchAlunoAdd(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {alunosDisponiveisFiltrados.length > 0 ? (
                    alunosDisponiveisFiltrados.map((aluno) => (
                      <div
                        key={aluno.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                      >
                        <div>
                          <p className="font-medium">{aluno.nome_completo}</p>
                          {aluno.cpf && <p className="text-sm text-gray-600">CPF: {aluno.cpf}</p>}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAdicionarAluno(aluno.id)}
                          disabled={isLoading || capacidadeAtingida}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Adicionar
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      {searchAlunoAdd ? "Nenhum aluno encontrado" : "Todos os alunos já estão matriculados"}
                    </p>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Pesquisar aluno na turma..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {capacidadeAtingida && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Capacidade máxima da turma atingida</AlertDescription>
            </Alert>
          )}

          {alunosFiltrados.length > 0 ? (
            <div className="space-y-2">
              {alunosFiltrados.map((matricula) => (
                <div
                  key={matricula.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{matricula.aluno.nome_completo}</p>
                      {matricula.aluno.cpf && <p className="text-sm text-gray-600">CPF: {matricula.aluno.cpf}</p>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoverAluno(matricula.id)}
                    disabled={isLoading}
                  >
                    <UserMinus className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              {searchTerm ? "Nenhum aluno encontrado" : "Nenhum aluno matriculado"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
