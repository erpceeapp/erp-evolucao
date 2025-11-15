'use client'

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Check, X, Save } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

type Aluno = {
  id: string
  nome_completo: string
  numero_matricula: string
  matricula_id: string
}

type Props = {
  alunos: Aluno[]
  turmaDisciplinaId: string
  turmaId: string
  disciplinaId: string
}

export default function RegistrarPresencaForm({ alunos, turmaDisciplinaId, turmaId, disciplinaId }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [dataAula, setDataAula] = useState(new Date().toISOString().split('T')[0])
  const [horario, setHorario] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [presencas, setPresencas] = useState<Record<string, 'presente' | 'ausente' | 'justificado'>>(
    Object.fromEntries(alunos.map(a => [a.id, 'presente']))
  )

  const handlePresencaChange = (alunoId: string, status: 'presente' | 'ausente' | 'justificado') => {
    setPresencas(prev => ({ ...prev, [alunoId]: status }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!dataAula || !horario) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a data e o horário da aula",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()

      // 1. Criar o registro da aula
      const { data: aula, error: aulaError } = await supabase
        .from("aulas")
        .insert({
          turma_disciplina_id: turmaDisciplinaId,
          data_aula: dataAula,
          horario,
          conteudo_ministrado: conteudo || null,
        })
        .select()
        .single()

      if (aulaError) throw aulaError

      // 2. Registrar presenças
      const presencasData = alunos.map(aluno => ({
        aula_id: aula.id,
        aluno_id: aluno.id,
        status: presencas[aluno.id] || 'presente',
      }))

      const { error: presencaError } = await supabase
        .from("presencas")
        .insert(presencasData)

      if (presencaError) throw presencaError

      toast({
        title: "Sucesso!",
        description: "Presença registrada com sucesso",
      })

      router.push(`/diario/${turmaId}/${disciplinaId}`)
      router.refresh()
    } catch (error) {
      console.error("Erro ao registrar presença:", error)
      toast({
        title: "Erro",
        description: "Não foi possível registrar a presença",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalPresentes = Object.values(presencas).filter(p => p === 'presente').length
  const totalAusentes = Object.values(presencas).filter(p => p === 'ausente').length
  const totalJustificados = Object.values(presencas).filter(p => p === 'justificado').length

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Dados da Aula */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="data_aula">Data da Aula *</Label>
          <Input
            id="data_aula"
            type="date"
            value={dataAula}
            onChange={(e) => setDataAula(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="horario">Horário *</Label>
          <Input
            id="horario"
            type="time"
            value={horario}
            onChange={(e) => setHorario(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="conteudo">Conteúdo Ministrado</Label>
        <Textarea
          id="conteudo"
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          placeholder="Descreva o conteúdo abordado na aula..."
          rows={3}
        />
      </div>

      {/* Resumo de Presenças */}
      <div className="flex gap-4 p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600" />
          <span className="font-medium">{totalPresentes} Presentes</span>
        </div>
        <div className="flex items-center gap-2">
          <X className="h-4 w-4 text-red-600" />
          <span className="font-medium">{totalAusentes} Ausentes</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-yellow-600" />
          <span className="font-medium">{totalJustificados} Justificados</span>
        </div>
      </div>

      {/* Lista de Alunos */}
      <div className="space-y-3">
        <Label>Chamada dos Alunos</Label>
        <div className="space-y-2">
          {alunos.map((aluno) => (
            <Card key={aluno.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{aluno.numero_matricula}</Badge>
                  <span className="font-medium">{aluno.nome_completo}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={presencas[aluno.id] === 'presente' ? 'default' : 'outline'}
                    onClick={() => handlePresencaChange(aluno.id, 'presente')}
                    className={presencas[aluno.id] === 'presente' ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={presencas[aluno.id] === 'ausente' ? 'default' : 'outline'}
                    onClick={() => handlePresencaChange(aluno.id, 'ausente')}
                    className={presencas[aluno.id] === 'ausente' ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={presencas[aluno.id] === 'justificado' ? 'default' : 'outline'}
                    onClick={() => handlePresencaChange(aluno.id, 'justificado')}
                    className={presencas[aluno.id] === 'justificado' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? "Salvando..." : "Salvar Presença"}
        </Button>
      </div>
    </form>
  )
}
