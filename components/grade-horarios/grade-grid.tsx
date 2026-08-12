"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import type { GradeSlot } from "@/types/entities"

interface GradeGridProps {
  slots: GradeSlot[]
  filtroTipo: "turma" | "professor"
  onCellClick: (diaSemana: number, hora: string) => void
  onSlotClick: (slot: GradeSlot) => void
  duracaoPadrao: number
  readOnly?: boolean
}

const DIAS = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
]

function getDisciplinaColor(nome: string): string {
  let hash = 0
  for (let i = 0; i < nome.length; i++) {
    hash = nome.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colors = [
    "bg-blue-100 border-blue-300 text-blue-800",
    "bg-green-100 border-green-300 text-green-800",
    "bg-purple-100 border-purple-300 text-purple-800",
    "bg-orange-100 border-orange-300 text-orange-800",
    "bg-pink-100 border-pink-300 text-pink-800",
    "bg-teal-100 border-teal-300 text-teal-800",
    "bg-indigo-100 border-indigo-300 text-indigo-800",
    "bg-rose-100 border-rose-300 text-rose-800",
  ]
  return colors[Math.abs(hash) % colors.length]
}

function parseHora(h: string): number {
  const [hora, min] = h.split(":").map(Number)
  return hora * 60 + min
}

function gerarHorarios(duracao: number): string[] {
  const horarios: string[] = []
  for (let min = 7 * 60; min <= 22 * 60; min += duracao) {
    if (min >= 12 * 60 && min < 13 * 60) continue
    if (min >= 18 * 60 && min < 19 * 60) continue
    horarios.push(`${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`)
  }
  return horarios
}

export function GradeGrid({ slots, filtroTipo, onCellClick, onSlotClick, duracaoPadrao, readOnly = false }: GradeGridProps) {
  const HORARIOS = useMemo(() => gerarHorarios(duracaoPadrao), [duracaoPadrao])
  const slotMap = useMemo(() => {
    const map = new Map<string, GradeSlot[]>()
    for (const slot of slots) {
      const key = `${slot.dia_semana}-${slot.hora_inicio.slice(0, 5)}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(slot)
    }
    return map
  }, [slots])

  const mergedUpTo = useMemo(() => {
    const map = new Map<string, number>()
    for (const slot of slots) {
      const startMin = parseHora(slot.hora_inicio)
      const endMin = parseHora(slot.hora_fim)
      for (let m = startMin + duracaoPadrao; m < endMin; m += duracaoPadrao) {
        const hh = Math.floor(m / 60)
        const mm = m % 60
        const hiddenKey = `${slot.dia_semana}-${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
        map.set(hiddenKey, parseHora(slot.hora_inicio))
      }
    }
    return map
  }, [slots, duracaoPadrao])

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="w-16 border-b bg-muted p-2 text-left text-sm font-medium text-muted-foreground">
              Horário
            </th>
            {DIAS.map((dia) => (
              <th
                key={dia.value}
                className="border-b bg-muted p-2 text-center text-sm font-medium text-muted-foreground"
              >
                {dia.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HORARIOS.map((hora) => {
            const hiddenFrom = mergedUpTo.get(hora)
            if (hiddenFrom !== undefined) return null

            return (
              <tr key={hora}>
                <td className="border-r p-2 text-xs text-muted-foreground align-top">{hora}</td>
                {DIAS.map((dia) => {
                  const key = `${dia.value}-${hora}`
                  const cellSlots = slotMap.get(key) || []
                  return (
                    <td
                      key={dia.value}
                      className={cn(
                        "border-b border-r p-1 align-top",
                        !readOnly && "cursor-pointer transition-colors hover:bg-muted/50",
                      )}
                      onClick={() => {
                        if (cellSlots.length === 0) onCellClick(dia.value, hora)
                      }}
                    >
                      {cellSlots.length > 0
                        ? cellSlots.map((slot) => {
                            const startMin = parseHora(slot.hora_inicio)
                            const endMin = parseHora(slot.hora_fim)
                            const rowspan = Math.max(1, Math.ceil((endMin - startMin) / duracaoPadrao))
                            const colorClass = getDisciplinaColor(slot.disciplina_nome)

                            return (
                              <div
                                key={slot.id}
                                className={cn(
                                  "rounded border px-2 py-1 text-xs",
                                  !readOnly && "cursor-pointer hover:opacity-80",
                                  colorClass,
                                )}
                                style={{ minHeight: `${rowspan * 2.5}rem` }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onSlotClick(slot)
                                }}
                              >
                                <div className="font-medium">{slot.disciplina_nome}</div>
                                <div className="text-[10px] opacity-75">
                                  {filtroTipo === "professor" ? slot.turma_nome : slot.professor_nome || "Sem professor"}
                                </div>
                                <div className="text-[10px] opacity-60">
                                  {slot.hora_inicio.slice(0, 5)}-{slot.hora_fim.slice(0, 5)}
                                </div>
                              </div>
                            )
                          })
                        : // empty cell
                          <div className={cn("h-8", !readOnly && "cursor-pointer")} />}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
