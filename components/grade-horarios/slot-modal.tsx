"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { translateError } from "@/lib/error-messages"
import { salvarSlot, removerSlot } from "@/app/(authenticated)/grade-horarios/actions"
import type { TurmaDisciplinaInfo, GradeSlot } from "@/types/entities"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface SlotModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  slot: GradeSlot | null
  diaSemana: number
  horaSugerida: string
  disciplinasDisponiveis: TurmaDisciplinaInfo[]
  duracaoPadrao: number
}

const DIAS_SEMANA = ["", "Segunda", "Terça", "Quarta", "Quinta", "Sexta"]

function calcHoraFim(inicio: string, duracaoMin: number): string {
  const [h, m] = inicio.split(":").map(Number)
  const totalMin = h * 60 + m + duracaoMin
  const nh = Math.floor(totalMin / 60)
  const nm = totalMin % 60
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`
}

export function SlotModal({
  open,
  onOpenChange,
  onSaved,
  slot,
  diaSemana,
  horaSugerida,
  disciplinasDisponiveis,
  duracaoPadrao,
}: SlotModalProps) {
  const [turmaDisciplinaId, setTurmaDisciplinaId] = useState(slot?.turma_disciplina_id || "")
  const [horaInicio, setHoraInicio] = useState(slot?.hora_inicio.slice(0, 5) || horaSugerida)
  const [horaFim, setHoraFim] = useState(
    slot?.hora_fim.slice(0, 5) || calcHoraFim(horaSugerida, duracaoPadrao),
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setTurmaDisciplinaId(slot?.turma_disciplina_id || "")
      setHoraInicio(slot?.hora_inicio.slice(0, 5) || horaSugerida)
      setHoraFim(slot?.hora_fim.slice(0, 5) || calcHoraFim(horaSugerida, duracaoPadrao))
      setSaving(false)
    }
  }, [open, slot, horaSugerida, duracaoPadrao])

  async function handleSave() {
    if (!turmaDisciplinaId) {
      toast.error("Selecione uma disciplina")
      return
    }
    if (!horaInicio || !horaFim) {
      toast.error("Preencha os horários")
      return
    }
    if (horaFim <= horaInicio) {
      toast.error("Hora fim deve ser maior que hora início")
      return
    }

    setSaving(true)
    try {
      await salvarSlot({
        turma_disciplina_id: turmaDisciplinaId,
        dia_semana: diaSemana,
        hora_inicio: `${horaInicio}:00`,
        hora_fim: `${horaFim}:00`,
      })
      toast.success(slot ? "Horário atualizado" : "Horário adicionado")
      onSaved()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(translateError(err.message || "Erro ao salvar horário"))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!slot) return
    setSaving(true)
    try {
      await removerSlot(slot.id)
      toast.success("Horário removido")
      onSaved()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(translateError(err.message || "Erro ao remover horário"))
    } finally {
      setSaving(false)
    }
  }

  const disciplinasComProfessor = disciplinasDisponiveis.filter((d) => d.tem_professor)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{slot ? "Editar Horário" : "Adicionar Horário"}</DialogTitle>
          <DialogDescription>
            {DIAS_SEMANA[diaSemana]} — {horaInicio}h às {horaFim}h
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="disciplina">Disciplina</Label>
            <Select value={turmaDisciplinaId} onValueChange={setTurmaDisciplinaId} disabled={!!slot}>
              <SelectTrigger id="disciplina" className="w-full min-w-0">
                <SelectValue placeholder="Selecione uma disciplina" />
              </SelectTrigger>
              <SelectContent>
                {disciplinasComProfessor.length === 0 && (
                  <SelectItem value="__none__" disabled>
                    Nenhuma disciplina disponível
                  </SelectItem>
                )}
                {disciplinasComProfessor.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.disciplina_nome} — {d.turma_nome} — {d.professor_nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="horaInicio">Hora início</Label>
              <Input
                id="horaInicio"
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="horaFim">Hora fim</Label>
              <Input id="horaFim" type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <div>
            {slot && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" type="button">
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir horário?</AlertDialogTitle>
                    <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
