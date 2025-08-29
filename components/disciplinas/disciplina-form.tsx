"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Save, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface DisciplinaData {
  nome: string
  codigo: string
  descricao: string
  carga_horaria: string
  ativo: boolean
}

interface DisciplinaFormProps {
  disciplina?: DisciplinaData & { id: string }
  isEditing?: boolean
}

export function DisciplinaForm({ disciplina, isEditing = false }: DisciplinaFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<DisciplinaData>({
    nome: disciplina?.nome || "",
    codigo: disciplina?.codigo || "",
    descricao: disciplina?.descricao || "",
    carga_horaria: disciplina?.carga_horaria || "",
    ativo: disciplina?.ativo ?? true,
  })

  const handleInputChange = (field: keyof DisciplinaData, value: string | boolean) => {
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
        carga_horaria: formData.carga_horaria ? Number.parseInt(formData.carga_horaria) : null,
      }

      if (isEditing && disciplina) {
        const { error } = await supabase.from("disciplinas").update(dataToSend).eq("id", disciplina.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("disciplinas").insert([dataToSend])

        if (error) throw error
      }

      router.push("/disciplinas")
    } catch (error: any) {
      setError(error.message || "Erro ao salvar disciplina")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados da Disciplina</CardTitle>
            <CardDescription>Informações básicas da disciplina</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Disciplina *</Label>
                <Input
                  id="nome"
                  required
                  placeholder="Ex: Matemática"
                  value={formData.nome}
                  onChange={(e) => handleInputChange("nome", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="codigo">Código *</Label>
                <Input
                  id="codigo"
                  required
                  placeholder="Ex: MAT001"
                  value={formData.codigo}
                  onChange={(e) => handleInputChange("codigo", e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                rows={3}
                placeholder="Descrição da disciplina..."
                value={formData.descricao}
                onChange={(e) => handleInputChange("descricao", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carga_horaria">Carga Horária (horas)</Label>
              <Input
                id="carga_horaria"
                type="number"
                min="1"
                placeholder="Ex: 60"
                value={formData.carga_horaria}
                onChange={(e) => handleInputChange("carga_horaria", e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => handleInputChange("ativo", checked)}
              />
              <Label htmlFor="ativo">Disciplina ativa</Label>
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
            <Link href="/disciplinas">
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
