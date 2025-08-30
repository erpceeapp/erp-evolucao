"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface TurmaDisciplina {
  id: string
  turma_id: string
  disciplina_id: string
  professor_id: string
  turmas: {
    id: string
    nome: string
    serie: string
    ano_letivo: string
  }
  disciplinas: {
    id: string
    nome: string
    codigo: string
  }
  professores: {
    id: string
    nome_completo: string
  }
}

interface NovaAulaFormProps {
  turmasDisciplinas: TurmaDisciplina[]
}

export default function NovaAulaForm({ turmasDisciplinas }: NovaAulaFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    turma_disciplina_id: "",
    data_aula: "",
    horario_inicio: "",
    horario_fim: "",
    conteudo: "",
    observacoes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createBrowserClient()

      const { error } = await supabase.from("aulas").insert({
        turma_disciplina_id: formData.turma_disciplina_id,
        data_aula: formData.data_aula,
        horario_inicio: formData.horario_inicio,
        horario_fim: formData.horario_fim,
        conteudo: formData.conteudo,
        observacoes: formData.observacoes || null,
      })

      if (error) throw error

      toast.success("Aula registrada com sucesso!")
      router.push("/diario")
    } catch (error) {
      console.error("Erro ao registrar aula:", error)
      toast.error("Erro ao registrar aula. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const selectedTurmaDisciplina = turmasDisciplinas.find((td) => td.id === formData.turma_disciplina_id)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="turma_disciplina">Turma e Disciplina *</Label>
          <Select
            value={formData.turma_disciplina_id}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, turma_disciplina_id: value }))}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a turma e disciplina" />
            </SelectTrigger>
            <SelectContent>
              {turmasDisciplinas.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.turmas.nome} - {item.disciplinas.nome} ({item.disciplinas.codigo})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_aula">Data da Aula *</Label>
          <Input
            id="data_aula"
            type="date"
            value={formData.data_aula}
            onChange={(e) => setFormData((prev) => ({ ...prev, data_aula: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="horario_inicio">Horário de Início *</Label>
          <Input
            id="horario_inicio"
            type="time"
            value={formData.horario_inicio}
            onChange={(e) => setFormData((prev) => ({ ...prev, horario_inicio: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="horario_fim">Horário de Fim *</Label>
          <Input
            id="horario_fim"
            type="time"
            value={formData.horario_fim}
            onChange={(e) => setFormData((prev) => ({ ...prev, horario_fim: e.target.value }))}
            required
          />
        </div>
      </div>

      {selectedTurmaDisciplina && (
        <div className="p-4 bg-cyan-50 rounded-lg">
          <h3 className="font-medium text-cyan-900 mb-2">Detalhes Selecionados</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Turma:</span> {selectedTurmaDisciplina.turmas.nome}
            </div>
            <div>
              <span className="font-medium">Disciplina:</span> {selectedTurmaDisciplina.disciplinas.nome}
            </div>
            <div>
              <span className="font-medium">Professor:</span> {selectedTurmaDisciplina.professores.nome_completo}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="conteudo">Conteúdo Ministrado *</Label>
        <Textarea
          id="conteudo"
          placeholder="Descreva o conteúdo que foi ministrado na aula..."
          value={formData.conteudo}
          onChange={(e) => setFormData((prev) => ({ ...prev, conteudo: e.target.value }))}
          rows={4}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          placeholder="Observações adicionais sobre a aula (opcional)..."
          value={formData.observacoes}
          onChange={(e) => setFormData((prev) => ({ ...prev, observacoes: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={loading} className="bg-cyan-600 hover:bg-cyan-700">
          {loading ? "Salvando..." : "Registrar Aula"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/diario")}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
