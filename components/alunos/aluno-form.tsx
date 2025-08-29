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

interface AlunoData {
  nome_completo: string
  data_nascimento: string
  cpf: string
  rg: string
  endereco: string
  telefone: string
  email: string
  nome_responsavel: string
  telefone_responsavel: string
  email_responsavel: string
  observacoes: string
  ativo: boolean
}

interface AlunoFormProps {
  aluno?: AlunoData & { id: string }
  isEditing?: boolean
}

export function AlunoForm({ aluno, isEditing = false }: AlunoFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<AlunoData>({
    nome_completo: aluno?.nome_completo || "",
    data_nascimento: aluno?.data_nascimento || "",
    cpf: aluno?.cpf || "",
    rg: aluno?.rg || "",
    endereco: aluno?.endereco || "",
    telefone: aluno?.telefone || "",
    email: aluno?.email || "",
    nome_responsavel: aluno?.nome_responsavel || "",
    telefone_responsavel: aluno?.telefone_responsavel || "",
    email_responsavel: aluno?.email_responsavel || "",
    observacoes: aluno?.observacoes || "",
    ativo: aluno?.ativo ?? true,
  })

  const handleInputChange = (field: keyof AlunoData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      if (isEditing && aluno) {
        const { error } = await supabase.from("alunos").update(formData).eq("id", aluno.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("alunos").insert([formData])

        if (error) throw error
      }

      router.push("/alunos")
    } catch (error: any) {
      setError(error.message || "Erro ao salvar aluno")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
            <CardDescription>Informações básicas do aluno</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome_completo">Nome Completo *</Label>
                <Input
                  id="nome_completo"
                  required
                  value={formData.nome_completo}
                  onChange={(e) => handleInputChange("nome_completo", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
                <Input
                  id="data_nascimento"
                  type="date"
                  required
                  value={formData.data_nascimento}
                  onChange={(e) => handleInputChange("data_nascimento", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" value={formData.cpf} onChange={(e) => handleInputChange("cpf", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rg">RG</Label>
                <Input id="rg" value={formData.rg} onChange={(e) => handleInputChange("rg", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={formData.endereco}
                onChange={(e) => handleInputChange("endereco", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange("telefone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Responsável</CardTitle>
            <CardDescription>Informações do responsável pelo aluno</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome_responsavel">Nome do Responsável</Label>
              <Input
                id="nome_responsavel"
                value={formData.nome_responsavel}
                onChange={(e) => handleInputChange("nome_responsavel", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone_responsavel">Telefone do Responsável</Label>
                <Input
                  id="telefone_responsavel"
                  type="tel"
                  value={formData.telefone_responsavel}
                  onChange={(e) => handleInputChange("telefone_responsavel", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email_responsavel">Email do Responsável</Label>
                <Input
                  id="email_responsavel"
                  type="email"
                  value={formData.email_responsavel}
                  onChange={(e) => handleInputChange("email_responsavel", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                rows={3}
                value={formData.observacoes}
                onChange={(e) => handleInputChange("observacoes", e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => handleInputChange("ativo", checked)}
              />
              <Label htmlFor="ativo">Aluno ativo</Label>
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
            <Link href="/alunos">
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
