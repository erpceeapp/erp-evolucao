"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

export function AgendaCalendar({ eventos, onDayClick }: AgendaCalendarProps) {
  const router = useRouter()

  const handleDayClick = (dia: number) => {
    if (dia > 0 && dia <= 31) {
      const data = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
      if (onDayClick) {
        onDayClick(data)
      } else {
        router.push(`/agenda/novo-evento?data=${data}`)
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendário - Dezembro 2024</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia) => (
            <div key={dia} className="text-center text-sm font-medium text-gray-500 p-2">
              {dia}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }, (_, i) => {
            const dia = i - 5 + 1
            const isToday = dia === new Date().getDate()
            const hasEvent = eventos.some((evento) => {
              const eventDate = new Date(evento.data_inicio)
              return eventDate.getDate() === dia
            })

            return (
              <Button
                key={i}
                variant="ghost"
                className={`
                  aspect-square flex items-center justify-center text-sm rounded-lg cursor-pointer
                  ${isToday ? "bg-cyan-600 text-white hover:bg-cyan-700" : "hover:bg-gray-100"}
                  ${hasEvent ? "bg-cyan-50 border border-cyan-200" : ""}
                  ${dia <= 0 || dia > 31 ? "text-gray-300" : ""}
                `}
                onClick={() => handleDayClick(dia)}
              >
                {dia > 0 && dia <= 31 ? dia : ""}
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
