"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface NovaAulaFormProps {
  turmaDisciplina: any
}

export default function NovaAulaFormV2({ turmaDisciplina }: NovaAulaFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    data_aula: "",
    hora_inicio: "",
    hora_fim: "",
    conteudo: "",
    observacoes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createBrowserClient()

      const { error } = await supabase.from("aulas").insert({
        turma_disciplina_id: turmaDisciplina.id,
        data_aula: formData.data_aula,
        hora_inicio: formData.hora_inicio,
        hora_fim: formData.hora_fim,
        conteudo: formData.conteudo,
        observacoes: formData.observacoes || null,
      })

      if (error) throw error

      toast.success("Aula registrada com sucesso!")
      router.push(`/diario/${turmaDisciplina.turmas.id}/${turmaDisciplina.disciplinas.id}`)
      router.refresh()
    } catch (error) {
      console.error("Erro ao registrar aula:", error)
      toast.error("Erro ao registrar aula. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-cyan-50 rounded-lg">
        <h3 className="font-medium text-cyan-900 mb-2">Turma e Disciplina</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Turma:</span> {turmaDisciplina.turmas.nome}
          </div>
          <div>
            <span className="font-medium">Disciplina:</span> {turmaDisciplina.disciplinas.nome}
          </div>
          <div>
            <span className="font-medium">Professor:</span> {turmaDisciplina.professores.nome_completo}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          <Label htmlFor="hora_inicio">Horário de Início *</Label>
          <Input
            id="hora_inicio"
            type="time"
            value={formData.hora_inicio}
            onChange={(e) => setFormData((prev) => ({ ...prev, hora_inicio: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hora_fim">Horário de Fim *</Label>
          <Input
            id="hora_fim"
            type="time"
            value={formData.hora_fim}
            onChange={(e) => setFormData((prev) => ({ ...prev, hora_fim: e.target.value }))}
            required
          />
        </div>
      </div>

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
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/diario/${turmaDisciplina.turmas.id}/${turmaDisciplina.disciplinas.id}`)}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
