"use client"

import { useMemo } from "react"
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "@/styles/agenda-rbc.css"
import { toRbcEvent, getTipoColor, type DbEvento, type RbcEvent } from "@/lib/agenda/rbc-adapter"

const locales = { "pt-BR": ptBR }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
})

const messages = {
  today: "Hoje",
  previous: "Anterior",
  next: "Próximo",
  month: "Mês",
  week: "Semana",
  day: "Dia",
  agenda: "Agenda",
  date: "Data",
  time: "Horário",
  event: "Evento",
  showMore: (total: number) => `+${total} mais`,
  noEventsInRange: "Nenhum evento neste período",
}

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
  const rbcEvents = useMemo(
    () => eventos.map((e) => toRbcEvent(e as DbEvento)),
    [eventos],
  )

  return (
    <Calendar<RbcEvent>
      localizer={localizer}
      events={rbcEvents}
      defaultView={Views.MONTH}
      views={[Views.MONTH]}
      messages={messages}
      eventPropGetter={(event) => ({
        style: {
          backgroundColor: getTipoColor(event.resource.tipo_evento),
          borderRadius: "6px",
          border: "none",
          fontSize: "0.8rem",
          padding: "2px 4px",
        },
      })}
      onSelectSlot={({ start }) => {
        if (onDayClick) {
          const data = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`
          onDayClick(data)
        }
      }}
      selectable
      popup
      style={{ height: 500 }}
      formats={{
        monthHeaderFormat: (date: Date) =>
          `${format(date, "MMMM", { locale: ptBR })} de ${format(date, "yyyy")}`,
      }}
    />
  )
}
