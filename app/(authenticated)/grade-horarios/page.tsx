"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GradeFilter } from "@/components/grade-horarios/grade-filter"
import { GradeGrid } from "@/components/grade-horarios/grade-grid"
import { SlotModal } from "@/components/grade-horarios/slot-modal"
import { SemProfessorList } from "@/components/grade-horarios/sem-professor-list"
import { ExportGradePDF } from "@/components/grade-horarios/export-grade-pdf"
import { listarGrade, listarTurmaDisciplinas } from "./actions"
import type { GradeSlot, TurmaDisciplinaInfo } from "@/types/entities"
import { CalendarRange } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function GradeHorariosPage() {
  const [filtroTipo, setFiltroTipo] = useState<"turma" | "professor">("turma")
  const [filtroId, setFiltroId] = useState<string | null>(null)
  const [slots, setSlots] = useState<GradeSlot[]>([])
  const [disciplinas, setDisciplinas] = useState<TurmaDisciplinaInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<GradeSlot | null>(null)
  const [modalDiaSemana, setModalDiaSemana] = useState(1)
  const [modalHora, setModalHora] = useState("07:00")

  const gridWrapperRef = useRef<HTMLDivElement>(null)
  const [filtroNome, setFiltroNome] = useState("")

  const [isProfessor, setIsProfessor] = useState(false)
  const [professorNome, setProfessorNome] = useState("")

  useEffect(() => {
    async function checkProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from("profiles")
        .select("tipo_usuario")
        .eq("id", user.id)
        .single()
      if (profile?.tipo_usuario === "professor") {
        const { data: professor } = await supabase
          .from("professores")
          .select("id, nome_completo")
          .eq("user_id", user.id)
          .single()
        if (professor) {
          setIsProfessor(true)
          setProfessorNome(professor.nome_completo)
          setFiltroTipo("professor")
          setFiltroId(professor.id)
          setFiltroNome(professor.nome_completo)
        }
      }
    }
    checkProfile()
  }, [])

  const [duracaoPadrao, setDuracaoPadrao] = useState(() => {
    if (typeof window !== "undefined") {
      return Number(localStorage.getItem("grade_duracao_padrao")) || 50
    }
    return 50
  })
  const [duracaoDraft, setDuracaoDraft] = useState(duracaoPadrao)

  const loadGrade = useCallback(async () => {
    if (!filtroId) return
    setLoading(true)
    setError(null)
    try {
      const [gradeData, discData] = await Promise.all([
        listarGrade(filtroTipo, filtroId),
        filtroTipo === "turma" ? listarTurmaDisciplinas(filtroId) : Promise.resolve([]),
      ])
      setSlots(gradeData)
      if (filtroTipo === "turma") {
        setDisciplinas(discData)
      } else {
        setDisciplinas([])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filtroTipo, filtroId])

  useEffect(() => {
    loadGrade()
  }, [loadGrade])

  function handleFilterChange(tipo: "turma" | "professor", id: string | null, label?: string) {
    setFiltroTipo(tipo)
    setFiltroId(id)
    setFiltroNome(label || "")
    setSlots([])
    setDisciplinas([])
  }

  function handleCellClick(diaSemana: number, hora: string) {
    if (filtroTipo !== "turma" || isProfessor) return
    setSelectedSlot(null)
    setModalDiaSemana(diaSemana)
    setModalHora(hora)
    setModalOpen(true)
  }

  function handleSlotClick(slot: GradeSlot) {
    if (isProfessor) return
    setSelectedSlot(slot)
    setModalDiaSemana(slot.dia_semana)
    setModalHora(slot.hora_inicio.slice(0, 5))
    setModalOpen(true)
  }

  function handleSaved() {
    loadGrade()
  }

  function handleDuracaoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number(e.target.value)
    if (val > 0) {
      setDuracaoDraft(val)
    }
  }

  function handleDuracaoApply() {
    setDuracaoPadrao(duracaoDraft)
    localStorage.setItem("grade_duracao_padrao", String(duracaoDraft))
  }

  const hasDisciplinasComProfessor = disciplinas.some((d) => d.tem_professor)

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalendarRange}
        title="Grade de Horários"
        description="Visualize e gerencie os horários das turmas e professores"
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        {isProfessor ? (
          <div className="text-lg font-semibold text-muted-foreground">
            Minha Grade de Horários
          </div>
        ) : (
          <GradeFilter filtroTipo={filtroTipo} filtroId={filtroId} onChange={handleFilterChange} />
        )}
        <div className="flex items-center gap-2">
          {filtroId && (
            <ExportGradePDF wrapperRef={gridWrapperRef} filtroTipo={filtroTipo} filtroNome={filtroNome} />
          )}
          <Label htmlFor="duracao" className="text-sm text-muted-foreground whitespace-nowrap">
            Duração padrão:
          </Label>
          <Input
            id="duracao"
            type="number"
            min={1}
            max={240}
            value={duracaoDraft}
            onChange={handleDuracaoChange}
            className="w-20 h-8"
          />
          <Button variant="outline" size="sm" onClick={handleDuracaoApply}>
            Aplicar
          </Button>
          <span className="text-sm text-muted-foreground">min</span>
        </div>
      </div>

      {!filtroId ? (
        <Card className="flex items-center justify-center p-12 text-muted-foreground">
          Selecione {filtroTipo === "turma" ? "uma turma" : "um professor"} para visualizar a grade
        </Card>
      ) : loading ? (
        <Card className="flex items-center justify-center p-12 text-muted-foreground">Carregando...</Card>
      ) : error ? (
        <Card className="flex items-center justify-center p-12 text-destructive">{error}</Card>
      ) : (
        <>
          <div ref={gridWrapperRef}>
            <GradeGrid
              slots={slots}
              filtroTipo={filtroTipo}
              onCellClick={handleCellClick}
              onSlotClick={handleSlotClick}
              duracaoPadrao={duracaoPadrao}
            />
            {filtroTipo === "turma" && <SemProfessorList disciplinas={disciplinas} />}
          </div>

          {slots.length === 0 && !hasDisciplinasComProfessor && filtroTipo === "turma" && (
            <Card className="flex items-center justify-center p-8 text-muted-foreground">
              Nenhuma disciplina com professor disponível. Vincule professores às disciplinas para criar a grade.
            </Card>
          )}

          {slots.length === 0 && hasDisciplinasComProfessor && filtroTipo === "turma" && (
            <Card className="flex items-center justify-center p-8 text-muted-foreground">
              Nenhum horário cadastrado. Clique em uma célula da grade para adicionar.
            </Card>
          )}
        </>
      )}

      {!isProfessor && (
        <SlotModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onSaved={handleSaved}
          slot={selectedSlot}
          diaSemana={modalDiaSemana}
          horaSugerida={modalHora}
          disciplinasDisponiveis={disciplinas}
          duracaoPadrao={duracaoPadrao}
        />
      )}
    </div>
  )
}
