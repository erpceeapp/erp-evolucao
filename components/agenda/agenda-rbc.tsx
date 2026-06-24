"use client"

import { useMemo } from "react"
import { Calendar, dateFnsLocalizer, Views, type View, type EventPropGetter } from "react-big-calendar"
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "@/styles/agenda-rbc.css"
import { AgendaToolbar } from "@/components/agenda/agenda-toolbar"
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

const DragAndDropCalendar = withDragAndDrop(Calendar)

interface AgendaRbcProps {
  eventos: DbEvento[]
  defaultView?: View
  onSelectEvent?: (evento: RbcEvent) => void
  onSelectSlot?: (start: Date, end: Date) => void
  onEventDrop?: (evento: RbcEvent, start: Date, end: Date) => void
  onEventResize?: (evento: RbcEvent, start: Date, end: Date) => void
  draggable?: boolean
  resizable?: boolean
  style?: React.CSSProperties
}

export function AgendaRbc({
  eventos,
  defaultView = Views.MONTH,
  onSelectEvent,
  onSelectSlot,
  onEventDrop,
  onEventResize,
  draggable = false,
  resizable = false,
  style,
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

  if (!draggable) {
    return (
      <Calendar
        localizer={localizer}
        culture="pt-BR"
        events={rbcEvents}
        defaultView={defaultView}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        messages={messages}
        eventPropGetter={eventPropGetter}
        onSelectEvent={onSelectEvent}
        onSelectSlot={({ start, end }) => onSelectSlot?.(start, end)}
        selectable
        popup
        components={{ toolbar: AgendaToolbar }}
        style={{ height: 600, ...style }}
        formats={{
          dayFormat: (date: Date) => format(date, "EEE", { locale: ptBR }),
          weekdayFormat: (date: Date) => format(date, "EEE", { locale: ptBR }),
          monthHeaderFormat: (date: Date) => `${format(date, "MMMM", { locale: ptBR })} de ${format(date, "yyyy")}`,
          dayHeaderFormat: (date: Date) =>
            `${format(date, "EEEE", { locale: ptBR })} - ${format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
          agendaHeaderFormat: ({ start, end }) =>
            `${format(start, "dd/MM", { locale: ptBR })} - ${format(end, "dd/MM/yyyy", { locale: ptBR })}`,
        }}
        tooltipAccessor={(event: any) => {
          const parts = [event.title]
          if (event.resource.descricao) parts.push(`\n${event.resource.descricao}`)
          if (event.resource.hora_inicio) {
            parts.push(`\n${event.resource.hora_inicio}${event.resource.hora_fim ? ` - ${event.resource.hora_fim}` : ""}`)
          }
          return parts.join("")
        }}
      />
    )
  }

  return (
    <DragAndDropCalendar
      localizer={localizer}
      culture="pt-BR"
      events={rbcEvents}
      defaultView={defaultView}
      views={[Views.MONTH, Views.WEEK, Views.DAY]}
      messages={messages}
      eventPropGetter={eventPropGetter as any}
      onSelectEvent={onSelectEvent as any}
      onSelectSlot={({ start, end }: { start: Date; end: Date }) => onSelectSlot?.(start, end)}
      selectable
      popup
      components={{ toolbar: AgendaToolbar }}
      style={{ height: 600, ...style }}
      formats={{
        dayFormat: (date: Date) => format(date, "EEE", { locale: ptBR }),
        weekdayFormat: (date: Date) => format(date, "EEE", { locale: ptBR }),
        monthHeaderFormat: (date: Date) => `${format(date, "MMMM", { locale: ptBR })} de ${format(date, "yyyy")}`,
        dayHeaderFormat: (date: Date) =>
          `${format(date, "EEEE", { locale: ptBR })} - ${format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
        agendaHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
          `${format(start, "dd/MM", { locale: ptBR })} - ${format(end, "dd/MM/yyyy", { locale: ptBR })}`,
      }}
      tooltipAccessor={(event: any) => {
        const parts = [event.title]
        if (event.resource.descricao) parts.push(`\n${event.resource.descricao}`)
        if (event.resource.hora_inicio) {
          parts.push(`\n${event.resource.hora_inicio}${event.resource.hora_fim ? ` - ${event.resource.hora_fim}` : ""}`)
        }
        return parts.join("")
      }}
      onEventDrop={({ event, start, end }: any) => onEventDrop?.(event, start, end)}
      onEventResize={({ event, start, end }: any) => onEventResize?.(event, start, end)}
      draggableAccessor={() => true}
      resizableAccessor={() => true}
    />
  )
}