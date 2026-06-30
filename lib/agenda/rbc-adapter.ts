export interface DbEvento {
  id: string
  titulo: string
  descricao: string | null
  data_inicio: string
  data_fim: string | null
  hora_inicio: string | null
  hora_fim: string | null
  tipo_evento: string
  local: string | null
}

export interface RbcEvent {
  id: string
  title: string
  start: Date
  end: Date
  allDay: boolean
  resource: {
    descricao: string | null
    tipo_evento: string
    local: string | null
    hora_inicio: string | null
    hora_fim: string | null
  }
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("T")[0].split("-").map(Number)
  return new Date(y, m - 1, d)
}

function parseLocalDateTime(dateStr: string, timeStr: string): Date {
  const [y, m, d] = dateStr.split("T")[0].split("-").map(Number)
  const [hh, mm] = timeStr.split(":").map(Number)
  return new Date(y, m - 1, d, hh, mm)
}

export function toRbcEvent(evento: DbEvento): RbcEvent {
  const dataInicio = evento.data_inicio.split("T")[0]

  if (!evento.hora_inicio) {
    const start = parseLocalDate(dataInicio)
    const dataFim = evento.data_fim || evento.data_inicio
    const endBase = dataFim.split("T")[0]
    const end = parseLocalDate(endBase)
    end.setDate(end.getDate() + 1)
    return {
      id: evento.id,
      title: evento.titulo,
      start,
      end,
      allDay: true,
      resource: {
        descricao: evento.descricao,
        tipo_evento: evento.tipo_evento,
        local: evento.local,
        hora_inicio: null,
        hora_fim: null,
      },
    }
  }

  const start = parseLocalDateTime(dataInicio, evento.hora_inicio)
  const dataFim = evento.data_fim || evento.data_inicio
  const endDate = dataFim.split("T")[0]
  if (evento.hora_fim) {
    const end = parseLocalDateTime(endDate, evento.hora_fim)
    return {
      id: evento.id,
      title: evento.titulo,
      start,
      end: end <= start ? new Date(end.getTime() + 86400000) : end,
      allDay: false,
      resource: {
        descricao: evento.descricao,
        tipo_evento: evento.tipo_evento,
        local: evento.local,
        hora_inicio: evento.hora_inicio,
        hora_fim: evento.hora_fim,
      },
    }
  }

  const end = new Date(start.getTime() + 3600000)
  return {
    id: evento.id,
    title: evento.titulo,
    start,
    end,
    allDay: false,
    resource: {
      descricao: evento.descricao,
      tipo_evento: evento.tipo_evento,
      local: evento.local,
      hora_inicio: evento.hora_inicio,
      hora_fim: null,
    },
  }
}

export function toDbUpdate(
  rbcEvent: RbcEvent,
  _original: DbEvento,
): {
  data_inicio: string
  data_fim: string | null
  hora_inicio: string | null
  hora_fim: string | null
} {
  const startDate = formatDate(rbcEvent.start)
  const startTime = rbcEvent.allDay ? null : formatTime(rbcEvent.start)

  let endDate = formatDate(rbcEvent.end)
  if (rbcEvent.allDay) {
    const adjusted = new Date(rbcEvent.end)
    adjusted.setDate(adjusted.getDate() - 1)
    endDate = formatDate(adjusted)
  }

  const endTime = rbcEvent.allDay
    ? null
    : rbcEvent.resource.hora_fim
      ? formatTime(rbcEvent.end)
      : null

  return {
    data_inicio: startDate,
    data_fim: endDate !== startDate ? endDate : null,
    hora_inicio: startTime,
    hora_fim:
      startTime && endTime && endTime !== startTime ? endTime : null,
  }
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}

export const TIPO_CORES: Record<string, string> = {
  feriado: "#dc2626",
  reuniao: "#2563eb",
  prova: "#9333ea",
  evento: "#0891b2",
  aviso: "#ca8a04",
  out: "#6b7280",
}

export function getTipoColor(tipo: string): string {
  return TIPO_CORES[tipo] || "#0891b2"
}
