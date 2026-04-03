"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface Evento {
  id: string
  titulo: string
  descricao: string | null
  data_inicio: string
  data_fim: string | null
  hora_inicio: string | null
  hora_fim: string | null
  tipo_evento: string
  local: string | null
  created_at: string
}

interface AgendaCalendarProps {
  eventos: Evento[]
  onDayClick?: (data: string) => void
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

export function AgendaCalendar({ eventos, onDayClick }: AgendaCalendarProps) {
  const router = useRouter()
  const today = new Date()

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth()) // 0-indexed

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const handleDayClick = (day: number) => {
    const data = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    if (onDayClick) {
      onDayClick(data)
    } else {
      router.push(`/agenda/novo-evento?data=${data}`)
    }
  }

  // Primeiro dia da semana do mes (0 = Dom, 6 = Sab)
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay()
  // Total de dias no mes
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  // Total de celulas no grid (completar semanas)
  const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            {MESES[viewMonth]} {viewYear}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={() => { setViewMonth(today.getMonth()); setViewYear(today.getFullYear()) }}
            >
              Hoje
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Cabecalho dos dias da semana */}
        <div className="grid grid-cols-7 mb-2">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Grid de dias */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: totalCells }, (_, i) => {
            const day = i - firstDayOfMonth + 1
            const isCurrentMonth = day >= 1 && day <= daysInMonth
            const isToday =
              isCurrentMonth &&
              day === today.getDate() &&
              viewMonth === today.getMonth() &&
              viewYear === today.getFullYear()

            const dateStr = isCurrentMonth
              ? `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              : null

            const hasEvent =
              isCurrentMonth &&
              eventos.some((ev) => {
                const evDate = ev.data_inicio?.split("T")[0]
                return evDate === dateStr
              })

            return (
              <button
                key={i}
                type="button"
                disabled={!isCurrentMonth}
                onClick={() => isCurrentMonth && handleDayClick(day)}
                className={`
                  relative flex flex-col items-center justify-center rounded-lg text-sm h-10 w-full transition-colors
                  ${!isCurrentMonth ? "text-gray-200 cursor-default" : "cursor-pointer"}
                  ${isToday ? "bg-cyan-600 text-white font-semibold hover:bg-cyan-700" : ""}
                  ${!isToday && isCurrentMonth ? "hover:bg-gray-100 text-gray-800" : ""}
                `}
              >
                {isCurrentMonth ? day : ""}
                {hasEvent && !isToday && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-cyan-500" />
                )}
                {hasEvent && isToday && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
