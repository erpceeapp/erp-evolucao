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
  const [presencas, setPresencas] = useState<Record<string, boolean>>(
    Object.fromEntries(alunos.map(a => [a.id, true]))
  )

  const handlePresencaChange = (alunoId: string, presente: boolean) => {
    setPresencas(prev => ({ ...prev, [alunoId]: presente }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('[v0] Iniciando submissão de presença')
    console.log('[v0] Data:', dataAula, 'Horário:', horario)
    console.log('[v0] TurmaDisciplinaId:', turmaDisciplinaId)
    console.log('[v0] Presenças:', presencas)
    
    if (!dataAula || !horario) {
      console.log('[v0] Campos obrigatórios faltando')
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a data e o horário da aula",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      console.log('[v0] Criando cliente Supabase')
      const supabase = createClient()

      console.log('[v0] Inserindo aula no banco')
      const { data: aula, error: aulaError } = await supabase
        .from("aulas")
        .insert({
          turma_disciplina_id: turmaDisciplinaId,
          data_aula: dataAula,
          horario: horario,
          conteudo_ministrado: conteudo || null,
        })
        .select()
        .single()

      if (aulaError) {
        console.error('[v0] Erro ao inserir aula:', aulaError)
        throw aulaError
      }

      console.log('[v0] Aula criada:', aula)

      const presencasData = alunos.map(aluno => ({
        aula_id: aula.id,
        aluno_id: aluno.id,
        presente: presencas[aluno.id] ?? true,
      }))

      console.log('[v0] Inserindo presenças:', presencasData)

      const { error: presencaError } = await supabase
        .from("presencas")
        .insert(presencasData)

      if (presencaError) {
        console.error('[v0] Erro ao inserir presenças:', presencaError)
        throw presencaError
      }

      console.log('[v0] Presenças salvas com sucesso')

      toast({
        title: "Sucesso!",
        description: "Presença registrada com sucesso",
      })

      console.log('[v0] Redirecionando para histórico de presenças')
      router.push(`/diario/${turmaId}/${disciplinaId}/presencas`)
      router.refresh()
    } catch (error) {
      console.error("[v0] Erro ao registrar presença:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível registrar a presença",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalPresentes = Object.values(presencas).filter(p => p === true).length
  const totalAusentes = Object.values(presencas).filter(p => p === false).length

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <div className="flex gap-4 p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600" />
          <span className="font-medium">{totalPresentes} Presentes</span>
        </div>
        <div className="flex items-center gap-2">
          <X className="h-4 w-4 text-red-600" />
          <span className="font-medium">{totalAusentes} Ausentes</span>
        </div>
      </div>

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
                    variant={presencas[aluno.id] === true ? 'default' : 'outline'}
                    onClick={() => handlePresencaChange(aluno.id, true)}
                    className={presencas[aluno.id] === true ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Presente
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={presencas[aluno.id] === false ? 'default' : 'outline'}
                    onClick={() => handlePresencaChange(aluno.id, false)}
                    className={presencas[aluno.id] === false ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Ausente
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? "Salvando..." : "Confirmar Presenças"}
        </Button>
      </div>
    </form>
  )
}
