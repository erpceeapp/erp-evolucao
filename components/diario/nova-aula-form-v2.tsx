"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim()
}

interface NovaAulaFormProps {
  turmaDisciplina: any
  duracaoPadrao?: number
  aula?: any
}

function calcHoraFim(inicio: string, duracaoMin: number): string {
  const [h, m] = inicio.split(":").map(Number)
  const totalMin = h * 60 + m + duracaoMin
  const nh = Math.floor(totalMin / 60)
  const nm = totalMin % 60
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`
}

function toTimeInput(value: string): string {
  return value ? value.slice(0, 5) : ""
}

export default function NovaAulaFormV2({ turmaDisciplina, duracaoPadrao = 50, aula }: NovaAulaFormProps) {
  const router = useRouter()
  const isEditing = !!aula
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    data_aula: aula?.data_aula || "",
    hora_inicio: toTimeInput(aula?.hora_inicio) || "",
    hora_fim: toTimeInput(aula?.hora_fim) || "",
    conteudo: aula?.conteudo || "",
    observacoes: aula?.observacoes || "",
  })

  const handleHoraInicioChange = (hora: string) => {
    setFormData((prev) => ({ ...prev, hora_inicio: hora }))

    if (hora) {
      setFormData((prev) => ({ ...prev, hora_fim: calcHoraFim(hora, duracaoPadrao) }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!stripHtml(formData.conteudo)) {
      toast.error("O campo Conteudo Ministrado e obrigatorio.")
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      const payload = {
        turma_disciplina_id: turmaDisciplina.id,
        data_aula: formData.data_aula,
        hora_inicio: formData.hora_inicio,
        hora_fim: formData.hora_fim,
        conteudo: formData.conteudo,
        observacoes: formData.observacoes ? stripHtml(formData.observacoes) ? formData.observacoes : null : null,
      }

      let error

      if (isEditing) {
        ;({ error } = await supabase.from("aulas").update(payload).eq("id", aula.id))
      } else {
        ;({ error } = await supabase.from("aulas").insert(payload))
      }

      if (error) throw error

      toast.success(isEditing ? "Aula atualizada com sucesso!" : "Aula registrada com sucesso!")
      router.push(`/diario/${turmaDisciplina.turmas.id}/${turmaDisciplina.disciplinas.id}`)
      router.refresh()
    } catch (error) {
      toast.error(isEditing ? "Erro ao atualizar aula. Tente novamente." : "Erro ao registrar aula. Tente novamente.")
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
            <span className="font-medium">Professor:</span> {turmaDisciplina.professores?.nome_completo || "Sem professor"}
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
            onChange={(e) => handleHoraInicioChange(e.target.value)}
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
        <Label>Conteúdo Ministrado *</Label>
        <RichTextEditor
          value={formData.conteudo}
          onChange={(html) => setFormData((prev) => ({ ...prev, conteudo: html }))}
          placeholder="Descreva o conteúdo que foi ministrado na aula..."
          minHeight={200}
        />
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <RichTextEditor
          value={formData.observacoes}
          onChange={(html) => setFormData((prev) => ({ ...prev, observacoes: html }))}
          placeholder="Observações adicionais sobre a aula (opcional)..."
          minHeight={120}
        />
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={loading} className="bg-cyan-600 hover:bg-cyan-700">
          {loading ? "Salvando..." : isEditing ? "Salvar Alterações" : "Registrar Aula"}
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
