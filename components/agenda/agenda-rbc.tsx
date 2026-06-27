"use client"

import { useMemo, useCallback } from "react"
import { Calendar, dateFnsLocalizer, Views, type View, type EventPropGetter } from "react-big-calendar"
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop"
import { format, parse, startOfWeek, getDay, isWithinInterval } from "date-fns"
import { ptBR } from "date-fns/locale"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "@/styles/agenda-rbc.css"
import { toRbcEvent, getTipoColor, type DbEvento, type RbcEvent } from "@/lib/agenda/rbc-adapter"

const locales = { "pt-BR": ptBR }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 0 }),
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

function CalendarHeader({ label }: { label: string }) {
  return (
    <div className="px-4 pt-3 pb-1 border-b">
      <span className="text-base font-semibold capitalize">{label}</span>
    </div>
  )
}

const DragAndDropCalendar = withDragAndDrop(Calendar)

type PeriodoLetivo = {
  data_inicio: string
  data_fim: string
}

interface AgendaRbcProps {
  eventos: DbEvento[]
  date: Date
  view: View
  onNavigate: (date: Date) => void
  onViewChange: (view: View) => void
  onSelectEvent?: (evento: RbcEvent) => void
  onSelectSlot?: (start: Date, end: Date) => void
  onEventDrop?: (evento: RbcEvent, start: Date, end: Date) => void
  onEventResize?: (evento: RbcEvent, start: Date, end: Date) => void
  draggable?: boolean
  resizable?: boolean
  style?: React.CSSProperties
  periodos?: PeriodoLetivo[]
}

export function AgendaRbc({
  eventos,
  date,
  view,
  onNavigate,
  onViewChange,
  onSelectEvent,
  onSelectSlot,
  onEventDrop,
  onEventResize,
  draggable = false,
  resizable = false,
  style,
  periodos,
}: AgendaRbcProps) {
  const rbcEvents = useMemo(() => eventos.map(toRbcEvent), [eventos])

  const eventPropGetter: EventPropGetter<RbcEvent> = (event) => ({
    style: {
      backgroundColor: getTipoColor(event.resource.tipo_evento),
      borderRadius: "6px",
      border: "none",
      fontSize: "0.8rem",
      padding: "2px 4px",
    },
  })

  const dayPropGetter = useCallback(
    (date: Date) => {
      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      if (isWeekend || !periodos?.length) return {}
      const inPeriodo = periodos.some((p) => {
        const inicio = new Date(p.data_inicio + "T00:00:00")
        const fim = new Date(p.data_fim + "T23:59:59")
        return isWithinInterval(date, { start: inicio, end: fim })
      })
      if (inPeriodo) {
        return { style: { backgroundColor: "#dcfce7" } }
      }
      return {}
    },
    [periodos],
  )

  const commonProps = {
    localizer,
    culture: "pt-BR",
    events: rbcEvents,
    date,
    view,
    views: [Views.MONTH, Views.WEEK, Views.DAY],
    messages,
    eventPropGetter: eventPropGetter as any,
    dayPropGetter: dayPropGetter as any,
    onSelectEvent: onSelectEvent as any,
    onSelectSlot: ({ start, end }: { start: Date; end: Date }) => onSelectSlot?.(start, end),
    onNavigate,
    onView: onViewChange,
    selectable: true,
    popup: true,
    components: { toolbar: CalendarHeader },
    formats: {
      dayFormat: (d: Date) => format(d, "EEE", { locale: ptBR }),
      weekdayFormat: (d: Date) => format(d, "EEE", { locale: ptBR }),
      monthHeaderFormat: (d: Date) => `${format(d, "MMMM", { locale: ptBR })} de ${format(d, "yyyy")}`,
      dayHeaderFormat: (d: Date) =>
        `${format(d, "EEEE", { locale: ptBR })} - ${format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
      agendaHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
        `${format(start, "dd/MM", { locale: ptBR })} - ${format(end, "dd/MM/yyyy", { locale: ptBR })}`,
    },
    tooltipAccessor: (event: any) => {
      const parts = [event.title]
      if (event.resource.descricao) parts.push(`\n${event.resource.descricao}`)
      if (event.resource.hora_inicio) {
        parts.push(`\n${event.resource.hora_inicio}${event.resource.hora_fim ? ` - ${event.resource.hora_fim}` : ""}`)
      }
      return parts.join("")
    },
  }

  const calendar = !draggable ? (
    <Calendar {...commonProps} />
  ) : (
    <DragAndDropCalendar
      {...commonProps}
      onEventDrop={({ event, start, end }: any) => onEventDrop?.(event, start, end)}
      onEventResize={({ event, start, end }: any) => onEventResize?.(event, start, end)}
      draggableAccessor={() => true}
      resizableAccessor={() => true}
    />
  )

  return <div style={{ height: 600, ...style }}>{calendar}</div>
}