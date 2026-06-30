"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import Link from "next/link"

export function NovoEventoForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dataInicial = searchParams.get("data") || new Date().toISOString().split("T")[0]

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    data_inicio: dataInicial,
    data_fim: dataInicial,
    hora_inicio: "",
    hora_fim: "",
    tipo_evento: "",
    turma_id: "",
    professor_id: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.from("eventos").insert([
        {
          titulo: formData.titulo,
          descricao: formData.descricao,
          data_inicio: formData.data_inicio,
          data_fim: formData.data_fim || formData.data_inicio,
          hora_inicio: formData.hora_inicio || null,
          hora_fim: formData.hora_fim || null,
          tipo_evento: formData.tipo_evento,
          turma_id: formData.turma_id || null,
          professor_id: formData.professor_id || null,
        },
      ])

      if (error) throw error

      toast.success("Evento criado com sucesso!")
      router.push("/agenda")
    } catch (error) {
      toast.error("Erro ao criar evento")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="titulo">Título do Evento *</Label>
        <Input
          id="titulo"
          value={formData.titulo}
          onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
          placeholder="Ex: Reunião de Pais, Prova de Matemática..."
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          placeholder="Descreva os detalhes do evento..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="data_inicio">Data de Início *</Label>
          <Input
            id="data_inicio"
            type="date"
            value={formData.data_inicio}
            onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_fim">Data de Fim</Label>
          <Input
            id="data_fim"
            type="date"
            value={formData.data_fim}
            onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="hora_inicio">Hora de Início</Label>
          <Input
            id="hora_inicio"
            type="time"
            value={formData.hora_inicio}
            onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hora_fim">Hora de Fim</Label>
          <Input
            id="hora_fim"
            type="time"
            value={formData.hora_fim}
            onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tipo_evento">Tipo de Evento *</Label>
        <Select
          value={formData.tipo_evento}
          onValueChange={(value) => setFormData({ ...formData, tipo_evento: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo de evento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="aula">Aula</SelectItem>
            <SelectItem value="prova">Prova/Avaliação</SelectItem>
            <SelectItem value="reuniao">Reunião</SelectItem>
            <SelectItem value="evento">Evento Escolar</SelectItem>
            <SelectItem value="feriado">Feriado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={loading} className="bg-cyan-600 hover:bg-cyan-700">
          {loading ? "Salvando..." : "Salvar Evento"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/agenda">Cancelar</Link>
        </Button>
      </div>
    </form>
  )
}
