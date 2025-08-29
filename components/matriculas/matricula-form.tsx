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
import { Textarea } from "@/components/ui/textarea"
import { Save, ArrowLeft, User, GraduationCap } from "lucide-react"
import Link from "next/link"

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

  const handleInputChange = (field: keyof MatriculaData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      // Preparar dados para envio
      const dataToSend = {
        ...formData,
        ano_letivo: Number.parseInt(formData.ano_letivo),
      }

      if (isEditing && matricula) {
        const { error } = await supabase.from("matriculas").update(dataToSend).eq("id", matricula.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("matriculas").insert([dataToSend])

        if (error) throw error
      }

      router.push("/matriculas")
    } catch (error: any) {
      setError(error.message || "Erro ao salvar matrícula")
    } finally {
      setIsLoading(false)
    }
  }

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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Seleção do Aluno
            </CardTitle>
            <CardDescription>Escolha o aluno para esta matrícula</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="aluno_id">Aluno *</Label>
              <Select value={formData.aluno_id} onValueChange={(value) => handleInputChange("aluno_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um aluno" />
                </SelectTrigger>
                <SelectContent>
                  {alunos.map((aluno) => (
                    <SelectItem key={aluno.id} value={aluno.id}>
                      {aluno.nome_completo} {aluno.cpf && `- ${aluno.cpf}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAluno && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Aluno Selecionado</h4>
                <p className="text-blue-800">
                  <strong>Nome:</strong> {selectedAluno.nome_completo}
                </p>
                {selectedAluno.cpf && (
                  <p className="text-blue-800">
                    <strong>CPF:</strong> {selectedAluno.cpf}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Seleção da Turma
            </CardTitle>
            <CardDescription>Escolha a turma para esta matrícula</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="turma_id">Turma *</Label>
              <Select value={formData.turma_id} onValueChange={(value) => handleInputChange("turma_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmas.map((turma) => (
                    <SelectItem key={turma.id} value={turma.id}>
                      {turma.nome} - {turma.serie} ({turma.ano_letivo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTurma && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Turma Selecionada</h4>
                <p className="text-green-800">
                  <strong>Nome:</strong> {selectedTurma.nome}
                </p>
                <p className="text-green-800">
                  <strong>Série:</strong> {selectedTurma.serie}
                </p>
                <p className="text-green-800">
                  <strong>Ano Letivo:</strong> {selectedTurma.ano_letivo}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                rows={3}
                placeholder="Observações sobre a matrícula..."
                value={formData.observacoes}
                onChange={(e) => handleInputChange("observacoes", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/matriculas">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancelar
            </Link>
          </Button>
          <Button type="submit" disabled={isLoading || !formData.aluno_id || !formData.turma_id}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Salvando..." : isEditing ? "Atualizar" : "Matricular"}
          </Button>
        </div>
      </div>
    </form>
  )
}
