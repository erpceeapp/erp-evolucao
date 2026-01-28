"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { createProfessorUser } from "@/app/(authenticated)/professores/novo/actions"
import { translateError } from "@/lib/error-messages"

interface ProfessorData {
  nome_completo: string
  cpf: string
  rg: string
  data_nascimento: string
  endereco: string
  telefone: string
  email: string
  formacao: string
  especializacao: string
  registro_profissional: string
  data_admissao: string
  salario: string | number | null
  ativo: boolean
}

interface Disciplina {
  id: string
  nome: string
  codigo: string
}

interface ProfessorFormProps {
  professor?: ProfessorData & { id: string }
  isEditing?: boolean
}

export function ProfessorForm({ professor, isEditing = false }: ProfessorFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [selectedDisciplinas, setSelectedDisciplinas] = useState<string[]>([])
  const [loadingDisciplinas, setLoadingDisciplinas] = useState(true)

  const [formData, setFormData] = useState<ProfessorData>({
    nome_completo: professor?.nome_completo || "",
    cpf: professor?.cpf || "",
    rg: professor?.rg || "",
    data_nascimento: professor?.data_nascimento || "",
    endereco: professor?.endereco || "",
    telefone: professor?.telefone || "",
    email: professor?.email || "",
    formacao: professor?.formacao || "",
    especializacao: professor?.especializacao || "",
    registro_profissional: professor?.registro_profissional || "",
    data_admissao: professor?.data_admissao || "",
    salario: professor?.salario || null,
    ativo: professor?.ativo ?? true,
  })

  const handleInputChange = (field: keyof ProfessorData, value: string | boolean | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleDisciplina = (disciplinaId: string) => {
    setSelectedDisciplinas((prev) =>
      prev.includes(disciplinaId) ? prev.filter((id) => id !== disciplinaId) : [...prev, disciplinaId],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      let salarioNumerico = null
      if (formData.salario) {
        // Se já for um número, usar diretamente
        if (typeof formData.salario === "number") {
          salarioNumerico = formData.salario
        } else {
          // Se for string, fazer o parse
          salarioNumerico = Number.parseFloat(formData.salario.replace(/[^\d,]/g, "").replace(",", "."))
        }
      }

      // Preparar dados para envio
      const dataToSend = {
        ...formData,
        salario: salarioNumerico,
      }

      let professorId: string

      if (isEditing && professor) {
        const { error } = await supabase.from("professores").update(dataToSend).eq("id", professor.id)

        if (error) throw error
        professorId = professor.id
      } else {
        if (formData.email && formData.cpf) {
          console.log("[v0] Chamando Server Action para criar usuário")

          const result = await createProfessorUser({
            email: formData.email,
            cpf: formData.cpf,
            nome_completo: formData.nome_completo,
            telefone: formData.telefone,
          })

          if (result.error) {
            throw new Error(result.error)
          }

          console.log("[v0] Usuário criado via Server Action:", result.userId)

          // Inserir professor com user_id
          const { data, error } = await supabase
            .from("professores")
            .insert([{ ...dataToSend, user_id: result.userId }])
            .select()
            .single()

          if (error) throw error
          professorId = data.id

          toast.success(`Professor cadastrado! Senha temporária: CPF (${result.senhaTemporaria})`)
        } else {
          throw new Error("Email e CPF são obrigatórios para criar acesso ao sistema")
        }
      }

      // Primeiro, remover todas as associações existentes
      await supabase.from("professor_disciplinas").delete().eq("professor_id", professorId)

      // Depois, inserir as novas associações
      if (selectedDisciplinas.length > 0) {
        const disciplinasToInsert = selectedDisciplinas.map((disciplinaId) => ({
          professor_id: professorId,
          disciplina_id: disciplinaId,
        }))

        const { error: disciplinasError } = await supabase.from("professor_disciplinas").insert(disciplinasToInsert)

        if (disciplinasError) throw disciplinasError
      }

      router.push("/professores")
    } catch (error: any) {
      console.error("[v0] Erro ao salvar professor:", error)
      setError(translateError(error.message || "Erro ao salvar professor"))
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, "")
    const formattedValue = (Number.parseInt(numericValue) / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
    return formattedValue
  }

  const handleSalaryChange = (value: string) => {
    const formatted = formatCurrency(value)
    handleInputChange("salario", formatted)
  }

  useEffect(() => {
    const fetchDisciplinas = async () => {
      const supabase = createClient()

      try {
        // Buscar todas as disciplinas ativas
        const { data: disciplinasData, error: disciplinasError } = await supabase
          .from("disciplinas")
          .select("id, nome, codigo")
          .eq("ativo", true)
          .order("nome")

        if (disciplinasError) throw disciplinasError
        setDisciplinas(disciplinasData || [])

        // Se estiver editando, buscar disciplinas já associadas ao professor
        if (isEditing && professor) {
          const { data: professorDisciplinas, error: pdError } = await supabase
            .from("professor_disciplinas")
            .select("disciplina_id")
            .eq("professor_id", professor.id)

          if (pdError) throw pdError

          const disciplinaIds = professorDisciplinas?.map((pd) => pd.disciplina_id) || []
          setSelectedDisciplinas(disciplinaIds)
        }
      } catch (error: any) {
        console.error("Erro ao buscar disciplinas:", error)
      } finally {
        setLoadingDisciplinas(false)
      }
    }

    fetchDisciplinas()
  }, [isEditing, professor])

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
            <CardDescription>Informações básicas do professor</CardDescription>
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
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" value={formData.cpf} onChange={(e) => handleInputChange("cpf", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rg">RG</Label>
                <Input id="rg" value={formData.rg} onChange={(e) => handleInputChange("rg", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                <Input
                  id="data_nascimento"
                  type="date"
                  value={formData.data_nascimento}
                  onChange={(e) => handleInputChange("data_nascimento", e.target.value)}
                />
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

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                type="tel"
                value={formData.telefone}
                onChange={(e) => handleInputChange("telefone", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados Profissionais</CardTitle>
            <CardDescription>Informações acadêmicas e profissionais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="formacao">Formação</Label>
              <Input
                id="formacao"
                placeholder="Ex: Licenciatura em Matemática"
                value={formData.formacao}
                onChange={(e) => handleInputChange("formacao", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="especializacao">Especialização</Label>
              <Input
                id="especializacao"
                placeholder="Ex: Mestrado em Educação Matemática"
                value={formData.especializacao}
                onChange={(e) => handleInputChange("especializacao", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registro_profissional">Registro Profissional</Label>
              <Input
                id="registro_profissional"
                placeholder="Ex: CREA, CRP, etc."
                value={formData.registro_profissional}
                onChange={(e) => handleInputChange("registro_profissional", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_admissao">Data de Admissão</Label>
                <Input
                  id="data_admissao"
                  type="date"
                  value={formData.data_admissao}
                  onChange={(e) => handleInputChange("data_admissao", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salario">Salário</Label>
                <Input
                  id="salario"
                  placeholder="R$ 0,00"
                  value={formData.salario}
                  onChange={(e) => handleSalaryChange(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => handleInputChange("ativo", checked)}
              />
              <Label htmlFor="ativo">Professor ativo</Label>
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
            <Link href="/professores">
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
