"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface DisciplinaData {
  nome: string
  codigo: string
  descricao: string
  carga_horaria: string
  ativo: boolean
  professor_id: string
}

interface DisciplinaFormProps {
  disciplina?: DisciplinaData & { id: string }
  isEditing?: boolean
}

interface Professor {
  id: string
  nome_completo: string
}

export function DisciplinaForm({ disciplina, isEditing = false }: DisciplinaFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [professores, setProfessores] = useState<Professor[]>([])
  const [openProfessor, setOpenProfessor] = useState(false)

  const [formData, setFormData] = useState<DisciplinaData>({
    nome: disciplina?.nome || "",
    codigo: disciplina?.codigo || "",
    descricao: disciplina?.descricao || "",
    carga_horaria: disciplina?.carga_horaria || "",
    ativo: disciplina?.ativo ?? true,
    professor_id: disciplina?.professor_id || "",
  })

  useEffect(() => {
    const fetchProfessores = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("professores")
        .select("id, nome_completo")
        .eq("ativo", true)
        .order("nome_completo")

      if (!error && data) {
        setProfessores(data)
      }
    }

    fetchProfessores()
  }, [])

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
        professor_id: formData.professor_id || null,
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

  const selectedProfessor = professores.find((p) => p.id === formData.professor_id)

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label htmlFor="professor">Professor Responsável</Label>
                <Popover open={openProfessor} onOpenChange={setOpenProfessor}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openProfessor}
                      className="w-full justify-between bg-transparent"
                    >
                      {selectedProfessor ? selectedProfessor.nome_completo : "Selecione um professor..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Buscar professor..." />
                      <CommandList>
                        <CommandEmpty>Nenhum professor encontrado.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value=""
                            onSelect={() => {
                              handleInputChange("professor_id", "")
                              setOpenProfessor(false)
                            }}
                          >
                            <Check
                              className={cn("mr-2 h-4 w-4", !formData.professor_id ? "opacity-100" : "opacity-0")}
                            />
                            Nenhum professor
                          </CommandItem>
                          {professores.map((professor) => (
                            <CommandItem
                              key={professor.id}
                              value={professor.nome_completo}
                              onSelect={() => {
                                handleInputChange("professor_id", professor.id)
                                setOpenProfessor(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.professor_id === professor.id ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {professor.nome_completo}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
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
