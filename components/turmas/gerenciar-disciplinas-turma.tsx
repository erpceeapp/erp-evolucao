"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Plus, Trash2, AlertCircle } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Disciplina {
  id: string
  nome: string
  codigo: string
  carga_horaria: number
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
  const [selectedDisciplina, setSelectedDisciplina] = useState("")
  const [selectedProfessor, setSelectedProfessor] = useState("")

  const disciplinasIds = disciplinasAtuais.map((d) => d.disciplina.id)
  const disciplinasDisponiveis = todasDisciplinas.filter((d) => !disciplinasIds.includes(d.id))

  const handleAdicionarDisciplina = async () => {
    if (!selectedDisciplina || !selectedProfessor) {
      setError("Selecione uma disciplina e um professor")
      return
    }

    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { error } = await supabase.from("turma_disciplinas").insert({
        turma_id: turmaId,
        disciplina_id: selectedDisciplina,
        professor_id: selectedProfessor,
        carga_horaria_semanal: 4, // Valor padrão
      })

      if (error) throw error

      setIsAddDialogOpen(false)
      setSelectedDisciplina("")
      setSelectedProfessor("")
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
                <DialogDescription>Selecione uma disciplina e o professor responsável</DialogDescription>
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
                  <Select value={selectedDisciplina} onValueChange={setSelectedDisciplina}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      {disciplinasDisponiveis.map((disciplina) => (
                        <SelectItem key={disciplina.id} value={disciplina.id}>
                          {disciplina.nome} ({disciplina.codigo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Professor *</Label>
                  <Select value={selectedProfessor} onValueChange={setSelectedProfessor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um professor" />
                    </SelectTrigger>
                    <SelectContent>
                      {todosProfessores.map((professor) => (
                        <SelectItem key={professor.id} value={professor.id}>
                          {professor.nome_completo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
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
