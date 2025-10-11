"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, ArrowLeft, User, GraduationCap, Search, X, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface MatriculaData {
  numero_matricula: string
  aluno_id: string
  turma_id: string
  ano_letivo: string
  data_matricula: string
  status: string
  observacoes: string
}

interface Aluno {
  id: string
  nome_completo: string
  cpf?: string
}

interface Turma {
  id: string
  nome: string
  serie: string
  ano_letivo: number
  capacidade_maxima: number
}

interface MatriculaFormProps {
  matricula?: MatriculaData & { id: string }
  alunos: Aluno[]
  turmas: Turma[]
  isEditing?: boolean
}

export function MatriculaForm({ matricula, alunos, turmas, isEditing = false }: MatriculaFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null)
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null)
  const [alunosSelecionados, setAlunosSelecionados] = useState<Aluno[]>([])
  const [showAlunoSearch, setShowAlunoSearch] = useState(false)
  const [showTurmaSearch, setShowTurmaSearch] = useState(false)
  const [capacidadeInfo, setCapacidadeInfo] = useState<{ atual: number; maxima: number } | null>(null)
  const [searchAluno, setSearchAluno] = useState("")
  const [searchTurma, setSearchTurma] = useState("")

  const currentYear = new Date().getFullYear()
  const currentDate = new Date().toISOString().split("T")[0]

  const [formData, setFormData] = useState<MatriculaData>({
    numero_matricula: matricula?.numero_matricula || "",
    aluno_id: matricula?.aluno_id || "",
    turma_id: matricula?.turma_id || "",
    ano_letivo: matricula?.ano_letivo || currentYear.toString(),
    data_matricula: matricula?.data_matricula || currentDate,
    status: matricula?.status || "ativa",
    observacoes: matricula?.observacoes || "",
  })

  // Gerar número de matrícula automaticamente
  useEffect(() => {
    if (!isEditing && !formData.numero_matricula) {
      const generateMatriculaNumber = () => {
        const year = formData.ano_letivo.slice(-2)
        const random = Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0")
        return `${year}${random}`
      }
      setFormData((prev) => ({ ...prev, numero_matricula: generateMatriculaNumber() }))
    }
  }, [formData.ano_letivo, isEditing])

  // Atualizar dados do aluno selecionado
  useEffect(() => {
    if (formData.aluno_id) {
      const aluno = alunos.find((a) => a.id === formData.aluno_id)
      setSelectedAluno(aluno || null)
    }
  }, [formData.aluno_id, alunos])

  // Atualizar dados da turma selecionada
  useEffect(() => {
    if (formData.turma_id) {
      const turma = turmas.find((t) => t.id === formData.turma_id)
      setSelectedTurma(turma || null)
      if (turma) {
        setFormData((prev) => ({ ...prev, ano_letivo: turma.ano_letivo.toString() }))
      }
    }
  }, [formData.turma_id, turmas])

  useEffect(() => {
    if (formData.turma_id) {
      const fetchCapacidade = async () => {
        const supabase = createClient()
        const { data: turma } = await supabase
          .from("turmas")
          .select("capacidade_maxima")
          .eq("id", formData.turma_id)
          .single()

        const { count } = await supabase
          .from("matriculas")
          .select("*", { count: "exact", head: true })
          .eq("turma_id", formData.turma_id)
          .eq("status", "ativa")

        if (turma) {
          setCapacidadeInfo({ atual: count || 0, maxima: turma.capacidade_maxima })
        }
      }
      fetchCapacidade()
    }
  }, [formData.turma_id])

  const handleInputChange = (field: keyof MatriculaData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const alunosFiltrados = alunos.filter((aluno) =>
    aluno.nome_completo.toLowerCase().includes(searchAluno.toLowerCase()),
  )

  const turmasFiltradas = turmas.filter(
    (turma) =>
      turma.nome.toLowerCase().includes(searchTurma.toLowerCase()) ||
      turma.serie.toLowerCase().includes(searchTurma.toLowerCase()),
  )

  const handleAdicionarAluno = (aluno: Aluno) => {
    if (!alunosSelecionados.find((a) => a.id === aluno.id)) {
      setAlunosSelecionados([...alunosSelecionados, aluno])
    }
    setShowAlunoSearch(false)
    setSearchAluno("")
  }

  const handleRemoverAluno = (alunoId: string) => {
    setAlunosSelecionados(alunosSelecionados.filter((a) => a.id !== alunoId))
  }

  const handleSelecionarTurma = (turma: Turma) => {
    setSelectedTurma(turma)
    setFormData((prev) => ({ ...prev, turma_id: turma.id, ano_letivo: turma.ano_letivo.toString() }))
    setShowTurmaSearch(false)
    setSearchTurma("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isEditing && alunosSelecionados.length === 0) {
      setError("Selecione pelo menos um aluno")
      return
    }

    if (!formData.turma_id) {
      setError("Selecione uma turma")
      return
    }

    // Verificar capacidade
    if (capacidadeInfo && !isEditing) {
      const vagasDisponiveis = capacidadeInfo.maxima - capacidadeInfo.atual
      if (alunosSelecionados.length > vagasDisponiveis) {
        setError(`A turma tem apenas ${vagasDisponiveis} vaga(s) disponível(is)`)
        return
      }
    }

    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      if (isEditing && matricula) {
        const dataToSend = {
          ...formData,
          ano_letivo: Number.parseInt(formData.ano_letivo),
        }
        const { error } = await supabase.from("matriculas").update(dataToSend).eq("id", matricula.id)
        if (error) throw error
      } else {
        // Criar múltiplas matrículas
        const matriculas = alunosSelecionados.map((aluno) => ({
          numero_matricula: `${formData.ano_letivo.slice(-2)}${Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, "0")}`,
          aluno_id: aluno.id,
          turma_id: formData.turma_id,
          ano_letivo: Number.parseInt(formData.ano_letivo),
          data_matricula: formData.data_matricula,
          status: formData.status,
          observacoes: formData.observacoes,
        }))

        const { error } = await supabase.from("matriculas").insert(matriculas)
        if (error) throw error
      }

      router.push("/matriculas")
    } catch (error: any) {
      setError(error.message || "Erro ao salvar matrícula")
    } finally {
      setIsLoading(false)
    }
  }

  const capacidadeAtingida = capacidadeInfo && capacidadeInfo.atual >= capacidadeInfo.maxima

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados da Matrícula</CardTitle>
            <CardDescription>Informações básicas da matrícula</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero_matricula">Número da Matrícula *</Label>
                <Input
                  id="numero_matricula"
                  required
                  value={formData.numero_matricula}
                  onChange={(e) => handleInputChange("numero_matricula", e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_matricula">Data da Matrícula *</Label>
                <Input
                  id="data_matricula"
                  type="date"
                  required
                  value={formData.data_matricula}
                  onChange={(e) => handleInputChange("data_matricula", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ano_letivo">Ano Letivo *</Label>
                <Select value={formData.ano_letivo} onValueChange={(value) => handleInputChange("ano_letivo", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="transferida">Transferida</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {!isEditing && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Seleção de Alunos
              </CardTitle>
              <CardDescription>Pesquise e adicione múltiplos alunos de uma vez</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Pesquisar Alunos</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Digite o nome do aluno..."
                    value={searchAluno}
                    onChange={(e) => {
                      setSearchAluno(e.target.value)
                      setShowAlunoSearch(true)
                    }}
                    onFocus={() => setShowAlunoSearch(true)}
                    className="pl-10"
                  />
                </div>

                {showAlunoSearch && searchAluno && (
                  <div className="border rounded-lg max-h-60 overflow-y-auto bg-white shadow-lg">
                    {alunosFiltrados.length > 0 ? (
                      alunosFiltrados.map((aluno) => (
                        <button
                          key={aluno.id}
                          type="button"
                          onClick={() => handleAdicionarAluno(aluno)}
                          className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0"
                        >
                          <p className="font-medium">{aluno.nome_completo}</p>
                          {aluno.cpf && <p className="text-sm text-gray-600">CPF: {aluno.cpf}</p>}
                        </button>
                      ))
                    ) : (
                      <p className="p-4 text-center text-gray-500">Nenhum aluno encontrado</p>
                    )}
                  </div>
                )}
              </div>

              {alunosSelecionados.length > 0 && (
                <div className="space-y-2">
                  <Label>Alunos Selecionados ({alunosSelecionados.length})</Label>
                  <div className="space-y-2">
                    {alunosSelecionados.map((aluno) => (
                      <div key={aluno.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-medium text-blue-900">{aluno.nome_completo}</p>
                          {aluno.cpf && <p className="text-sm text-blue-700">CPF: {aluno.cpf}</p>}
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoverAluno(aluno.id)}>
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Seleção da Turma
            </CardTitle>
            <CardDescription>Pesquise e selecione a turma para a matrícula</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Pesquisar Turma</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Digite o nome ou série da turma..."
                  value={searchTurma}
                  onChange={(e) => {
                    setSearchTurma(e.target.value)
                    setShowTurmaSearch(true)
                  }}
                  onFocus={() => setShowTurmaSearch(true)}
                  className="pl-10"
                />
              </div>

              {showTurmaSearch && searchTurma && (
                <div className="border rounded-lg max-h-60 overflow-y-auto bg-white shadow-lg">
                  {turmasFiltradas.length > 0 ? (
                    turmasFiltradas.map((turma) => (
                      <button
                        key={turma.id}
                        type="button"
                        onClick={() => handleSelecionarTurma(turma)}
                        className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <p className="font-medium">
                          {turma.nome} - {turma.serie}
                        </p>
                        <p className="text-sm text-gray-600">Ano Letivo: {turma.ano_letivo}</p>
                      </button>
                    ))
                  ) : (
                    <p className="p-4 text-center text-gray-500">Nenhuma turma encontrada</p>
                  )}
                </div>
              )}
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
            <Link href="/matriculas">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancelar
            </Link>
          </Button>
          <Button
            type="submit"
            disabled={
              isLoading || (!isEditing && alunosSelecionados.length === 0) || !formData.turma_id || capacidadeAtingida
            }
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Salvando..." : isEditing ? "Atualizar" : `Matricular ${alunosSelecionados.length} Aluno(s)`}
          </Button>
        </div>
      </div>
    </form>
  )
}
