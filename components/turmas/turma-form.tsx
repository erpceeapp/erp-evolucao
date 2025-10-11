"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Save, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface TurmaData {
  nome: string
  ano_letivo: string
  serie: string
  turno: string
  capacidade_maxima: string
  professor_responsavel_id: string
  ativo: boolean
}

interface Professor {
  id: string
  nome_completo: string
}

interface TurmaFormProps {
  turma?: TurmaData & { id: string }
  professores: Professor[]
  isEditing?: boolean
}

export function TurmaForm({ turma, professores, isEditing = false }: TurmaFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentYear = new Date().getFullYear()

  const [formData, setFormData] = useState<TurmaData>({
    nome: turma?.nome || "",
    ano_letivo: turma?.ano_letivo?.toString() || currentYear.toString(),
    serie: turma?.serie || "",
    turno: turma?.turno || "matutino",
    capacidade_maxima: turma?.capacidade_maxima?.toString() || "",
    professor_responsavel_id: turma?.professor_responsavel_id || "none",
    ativo: turma?.ativo ?? true,
  })

  const handleInputChange = (field: keyof TurmaData, value: string | boolean) => {
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
        capacidade_maxima: formData.capacidade_maxima ? Number.parseInt(formData.capacidade_maxima) : null,
        professor_responsavel_id:
          formData.professor_responsavel_id === "none" ? null : formData.professor_responsavel_id,
      }

      if (isEditing && turma) {
        const { error } = await supabase.from("turmas").update(dataToSend).eq("id", turma.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("turmas").insert([dataToSend])

        if (error) throw error
      }

      router.push("/turmas")
    } catch (error: any) {
      setError(error.message || "Erro ao salvar turma")
    } finally {
      setIsLoading(false)
    }
  }

  // Gerar anos disponíveis (últimos 3 anos + próximos 5)
  const availableYears = Array.from({ length: 8 }, (_, i) => currentYear - 3 + i)

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados da Turma</CardTitle>
            <CardDescription>Informações básicas da turma</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Turma *</Label>
                <Input
                  id="nome"
                  required
                  placeholder="Ex: 1º Ano A"
                  value={formData.nome}
                  onChange={(e) => handleInputChange("nome", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serie">Série *</Label>
                <Input
                  id="serie"
                  required
                  placeholder="Ex: 1º Ano"
                  value={formData.serie}
                  onChange={(e) => handleInputChange("serie", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ano_letivo">Ano Letivo *</Label>
                <Select value={formData.ano_letivo} onValueChange={(value) => handleInputChange("ano_letivo", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="turno">Turno *</Label>
                <Select value={formData.turno} onValueChange={(value) => handleInputChange("turno", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o turno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matutino">Matutino</SelectItem>
                    <SelectItem value="vespertino">Vespertino</SelectItem>
                    <SelectItem value="noturno">Noturno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacidade_maxima">Capacidade Máxima</Label>
                <Input
                  id="capacidade_maxima"
                  type="number"
                  min="1"
                  placeholder="Ex: 30"
                  value={formData.capacidade_maxima}
                  onChange={(e) => handleInputChange("capacidade_maxima", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="professor_responsavel_id">Professor Responsável</Label>
              <Select
                value={formData.professor_responsavel_id}
                onValueChange={(value) => handleInputChange("professor_responsavel_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um professor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum professor</SelectItem>
                  {professores.map((professor) => (
                    <SelectItem key={professor.id} value={professor.id}>
                      {professor.nome_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => handleInputChange("ativo", checked)}
              />
              <Label htmlFor="ativo">Turma ativa</Label>
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
            <Link href="/turmas">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancelar
            </Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Salvando..." : isEditing ? "Atualizar" : "Cadastrar"}
          </Button>
        </div>
      </div>
    </form>
  )
}
