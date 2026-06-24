"use client"

import { useRef } from "react"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { View } from "react-big-calendar"

function formatLabel(date: Date, view: string): string {
  if (view === "month") {
    return `${format(date, "MMMM", { locale: ptBR })} de ${format(date, "yyyy")}`
  }
  if (view === "week") {
    const start = new Date(date)
    const day = date.getDay()
    start.setDate(date.getDate() - day)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return `${format(start, "dd/MM", { locale: ptBR })} - ${format(end, "dd/MM/yyyy", { locale: ptBR })}`
  }
  if (view === "day") {
    return `${format(date, "EEEE", { locale: ptBR })} - ${format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`
  }
  return format(date, "dd/MM/yyyy")
}

const viewNames: Record<string, string> = {
  month: "Mês",
  week: "Semana",
  day: "Dia",
}

export function AgendaToolbar({ date, view, views, label: _label, onNavigate, onView }: any) {
  const dateInputRef = useRef<HTMLInputElement>(null)

  const dateValue = format(date, "yyyy-MM-dd")

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    if (!val) return
    const [y, m, d] = val.split("-").map(Number)
    onNavigate("DATE", new Date(y, m - 1, d))
  }

  return (
    <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onNavigate("TODAY")}>
          Hoje
        </Button>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="size-7" onClick={() => onNavigate("PREV")}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="size-7" onClick={() => onNavigate("NEXT")}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <span className="ml-1 text-base font-semibold capitalize">{formatLabel(date, view)}</span>

        <div className="relative ml-2">
          <CalendarIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={dateInputRef}
            type="date"
            value={dateValue}
            onChange={handleDateChange}
            className="h-8 w-40 pl-8 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        {(Array.isArray(views) ? views : Object.keys(views)).map((viewName) => {
          const name = typeof viewName === "string" ? viewName : String(viewName)
          return (
            <Button
              key={name}
              variant={view === name ? "default" : "outline"}
              size="sm"
              onClick={() => onView(name as View)}
              className={view !== name ? "text-muted-foreground" : ""}
            >
              {viewNames[name as keyof typeof viewNames] || name}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
