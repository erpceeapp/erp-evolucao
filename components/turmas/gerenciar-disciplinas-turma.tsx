"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Plus, Trash2, AlertCircle, Search } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Disciplina {
  id: string
  nome: string
  codigo: string
  carga_horaria: number
  professor?: {
    id: string
    nome_completo: string
  }
}

interface Professor {
  id: string
  nome_completo: string
}

interface DisciplinaAtual {
  id: string
  disciplina: Disciplina
  professor?: Professor
}

interface GerenciarDisciplinasTurmaProps {
  turmaId: string
  disciplinasAtuais: DisciplinaAtual[]
  todasDisciplinas: Disciplina[]
  todosProfessores: Professor[]
}

export function GerenciarDisciplinasTurma({
  turmaId,
  disciplinasAtuais,
  todasDisciplinas,
  todosProfessores,
}: GerenciarDisciplinasTurmaProps) {
  const router = useRouter()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDisciplina, setSelectedDisciplina] = useState<Disciplina | null>(null)
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const disciplinasIds = disciplinasAtuais.map((d) => d.disciplina.id)
  const disciplinasDisponiveis = todasDisciplinas.filter((d) => !disciplinasIds.includes(d.id))

  const disciplinasFiltradas = searchTerm
    ? disciplinasDisponiveis.filter(
        (d) =>
          d.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.codigo.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : disciplinasDisponiveis

  const handleAdicionarDisciplina = async () => {
    if (!selectedDisciplina) {
      setError("Selecione uma disciplina")
      return
    }

    if (!selectedDisciplina.professor) {
      setError("Esta disciplina não tem um professor associado. Por favor, associe um professor à disciplina primeiro.")
      return
    }

    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { error } = await supabase.from("turma_disciplinas").insert({
        turma_id: turmaId,
        disciplina_id: selectedDisciplina.id,
        professor_id: selectedDisciplina.professor.id,
        carga_horaria_semanal: 4, // Valor padrão
      })

      if (error) throw error

      setIsAddDialogOpen(false)
      setSelectedDisciplina(null)
      setSearchTerm("")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Erro ao adicionar disciplina")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoverDisciplina = async (turmaDisciplinaId: string) => {
    if (!confirm("Deseja realmente remover esta disciplina da turma?")) return

    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { error } = await supabase.from("turma_disciplinas").delete().eq("id", turmaDisciplinaId)

      if (error) throw error

      router.refresh()
    } catch (err: any) {
      setError(err.message || "Erro ao remover disciplina")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Disciplinas ({disciplinasAtuais.length})
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Disciplina
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Disciplina à Turma</DialogTitle>
                <DialogDescription>
                  Selecione uma disciplina. O professor responsável será automaticamente associado.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label>Disciplina *</Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between bg-transparent"
                      >
                        {selectedDisciplina ? (
                          <span className="truncate">
                            {selectedDisciplina.nome} ({selectedDisciplina.codigo})
                          </span>
                        ) : (
                          "Buscar disciplina..."
                        )}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Buscar disciplina..."
                          value={searchTerm}
                          onValueChange={(value) => {
                            console.log("[v0] Search term changed:", value)
                            setSearchTerm(value)
                          }}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {searchTerm
                              ? "Nenhuma disciplina encontrada para sua busca."
                              : "Nenhuma disciplina disponível."}
                          </CommandEmpty>
                          <CommandGroup>
                            {disciplinasFiltradas.map((disciplina) => (
                              <CommandItem
                                key={disciplina.id}
                                value={disciplina.id}
                                onSelect={() => {
                                  console.log("[v0] Disciplina selected:", disciplina.nome)
                                  setSelectedDisciplina(disciplina)
                                  setOpen(false)
                                  setSearchTerm("")
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedDisciplina?.id === disciplina.id ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {disciplina.nome} ({disciplina.codigo})
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {disciplina.carga_horaria}h
                                    {disciplina.professor && ` • Prof. ${disciplina.professor.nome_completo}`}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {selectedDisciplina && (
                  <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                    <p className="text-sm font-medium">Detalhes da Disciplina:</p>
                    <p className="text-sm text-gray-600">Código: {selectedDisciplina.codigo}</p>
                    <p className="text-sm text-gray-600">Carga Horária: {selectedDisciplina.carga_horaria}h</p>
                    {selectedDisciplina.professor ? (
                      <p className="text-sm text-gray-500 mt-1">
                        Professor: {selectedDisciplina.professor.nome_completo}
                      </p>
                    ) : (
                      <p className="text-sm text-red-600">⚠️ Sem professor associado</p>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false)
                      setSelectedDisciplina(null)
                      setSearchTerm("")
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleAdicionarDisciplina} disabled={isLoading}>
                    {isLoading ? "Adicionando..." : "Adicionar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {disciplinasAtuais.length > 0 ? (
          <div className="space-y-3">
            {disciplinasAtuais.map((item) => (
              <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{item.disciplina.nome}</p>
                  <p className="text-sm text-gray-600">
                    Código: {item.disciplina.codigo} • {item.disciplina.carga_horaria}h
                  </p>
                  {item.professor && (
                    <p className="text-sm text-gray-500 mt-1">Professor: {item.professor.nome_completo}</p>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleRemoverDisciplina(item.id)} disabled={isLoading}>
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">Nenhuma disciplina associada</p>
        )}
      </CardContent>
    </Card>
  )
}
