"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Calendar, Plus, Edit2, Trash2, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataPagination } from "@/components/ui/data-pagination"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { AgendaRbc } from "@/components/agenda/agenda-rbc"
import { AgendaToolbar } from "@/components/agenda/agenda-toolbar"
import { toast } from "sonner"
import { translateError } from "@/lib/error-messages"
import { createEvento, updateEvento, deleteEvento } from "./actions"
import { toDbUpdate, type DbEvento, type RbcEvent } from "@/lib/agenda/rbc-adapter"
import { addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, isSameDay } from "date-fns"
import type { View } from "react-big-calendar"

export default function AgendaPage() {
  const [eventos, setEventos] = useState<DbEvento[]>([])
  const [periodos, setPeriodos] = useState<{ data_inicio: string; data_fim: string }[]>([])
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [calendarView, setCalendarView] = useState<View>("month")
  const [selectedEvento, setSelectedEvento] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [eventoToDelete, setEventoToDelete] = useState<any>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isNewEventOpen, setIsNewEventOpen] = useState(false)
  const [newEventDate, setNewEventDate] = useState("")
  const [newEventForm, setNewEventForm] = useState({
    titulo: "",
    descricao: "",
    data_inicio: "",
    data_fim: "",
    hora_inicio: "",
    hora_fim: "",
    tipo_evento: "",
  })
  const [saving, setSaving] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    titulo: "",
    descricao: "",
    data_inicio: "",
    data_fim: "",
    hora_inicio: "",
    hora_fim: "",
    tipo_evento: "",
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false)
  const [discardTarget, setDiscardTarget] = useState<"new" | "edit" | null>(null)
  const [dayHeaderDate, setDayHeaderDate] = useState<Date | null>(null)
  const [isDayEventsOpen, setIsDayEventsOpen] = useState(false)

  const [tableSearch, setTableSearch] = useState("")
  const [tableTipo, setTableTipo] = useState("todos")
  const [tableDateInicio, setTableDateInicio] = useState("")
  const [tableDateFim, setTableDateFim] = useState("")
  const [tablePage, setTablePage] = useState(1)
  const [tablePageSize, setTablePageSize] = useState(10)

  const filteredEventos = useMemo(() => {
    let items = eventos
    if (tableSearch) {
      const q = tableSearch.toLowerCase()
      items = items.filter((e) => e.titulo.toLowerCase().includes(q) || (e.descricao || "").toLowerCase().includes(q))
    }
    if (tableTipo !== "todos") {
      items = items.filter((e) => e.tipo_evento === tableTipo)
    }
    if (tableDateInicio) {
      items = items.filter((e) => e.data_inicio >= tableDateInicio || (e.data_fim && e.data_fim >= tableDateInicio))
    }
    if (tableDateFim) {
      items = items.filter((e) => e.data_inicio <= tableDateFim)
    }
    return items
  }, [eventos, tableSearch, tableTipo, tableDateInicio, tableDateFim])

  const totalPages = Math.max(1, Math.ceil(filteredEventos.length / tablePageSize))
  const paginatedEventos = filteredEventos.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize)

  const supabase = createClient()

  useEffect(() => {
    loadEventos()
  }, [])

  async function loadEventos() {
    const [eventosRes, periodosRes] = await Promise.all([
      supabase.from("eventos").select("*").order("data_inicio", { ascending: true }),
      supabase.from("periodos_letivos").select("data_inicio, data_fim").eq("ativo", true),
    ])

    if (eventosRes.error) {
      toast.error("Erro ao carregar eventos")
      return
    }

    setEventos(eventosRes.data || [])
    setPeriodos(periodosRes.data || [])
  }

  const handleNavigate = useCallback((action: "TODAY" | "PREV" | "NEXT" | "DATE", date?: Date) => {
    if (action === "TODAY") {
      setCalendarDate(new Date())
    } else if (action === "PREV") {
      setCalendarDate((prev) => {
        if (calendarView === "month") return subMonths(prev, 1)
        if (calendarView === "week") return subWeeks(prev, 1)
        return subDays(prev, 1)
      })
    } else if (action === "NEXT") {
      setCalendarDate((prev) => {
        if (calendarView === "month") return addMonths(prev, 1)
        if (calendarView === "week") return addWeeks(prev, 1)
        return addDays(prev, 1)
      })
    } else if (action === "DATE" && date) {
      setCalendarDate(date)
    }
  }, [calendarView])

  const handleViewChange = useCallback((view: View) => {
    setCalendarView(view)
  }, [])

  function handleClickEvent(rbcEvent: RbcEvent) {
    const evento = eventos.find((e) => e.id === rbcEvent.id)
    if (evento) {
      setSelectedEvento(evento)
      setIsModalOpen(true)
    }
  }

  function openNewEventForDate(date: Date) {
    const data = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    setNewEventDate(data)
    setNewEventForm({
      titulo: "",
      descricao: "",
      data_inicio: data,
      data_fim: data,
      hora_inicio: "",
      hora_fim: "",
      tipo_evento: "",
    })
    setIsNewEventOpen(true)
  }

  function handleSlotClick(start: Date, _end: Date) {
    openNewEventForDate(start)
  }

  async function handleEventDrop(rbcEvent: RbcEvent, start: Date, end: Date) {
    const original = eventos.find((e) => e.id === rbcEvent.id)
    if (!original) return

    const updates = toDbUpdate({ ...rbcEvent, start, end }, original)
    if (Object.keys(updates).length === 0) return

    const result = await updateEvento(rbcEvent.id, {
      titulo: original.titulo,
      descricao: original.descricao,
      data_inicio: updates.data_inicio,
      data_fim: updates.data_fim,
      hora_inicio: updates.hora_inicio,
      hora_fim: updates.hora_fim,
      tipo_evento: original.tipo_evento,
    })

    if (result.error) {
      toast.error(translateError(result.error))
      return
    }

    toast.success("Evento atualizado com sucesso!")
    loadEventos()
  }

  async function handleEventResize(rbcEvent: RbcEvent, start: Date, end: Date) {
    await handleEventDrop(rbcEvent, start, end)
  }

  async function handleCreateEvento() {
    if (!newEventForm.titulo || !newEventForm.tipo_evento) {
      toast.error("Preencha o título e o tipo do evento")
      return
    }

    setSaving(true)
    const result = await createEvento({
      titulo: newEventForm.titulo,
      descricao: newEventForm.descricao || null,
      data_inicio: newEventForm.data_inicio,
      data_fim: newEventForm.data_fim || null,
      hora_inicio: newEventForm.hora_inicio || null,
      hora_fim: newEventForm.hora_fim || null,
      tipo_evento: newEventForm.tipo_evento,
    })

    if (result.error) {
      toast.error(translateError(result.error))
      setSaving(false)
      return
    }

    toast.success("Evento criado com sucesso!")
    setIsNewEventOpen(false)
    setSaving(false)
    loadEventos()
  }

  function openEditModal(evento: any) {
    setEditingId(evento.id)
    setEditForm({
      titulo: evento.titulo || "",
      descricao: evento.descricao || "",
      data_inicio: evento.data_inicio?.split("T")[0] || "",
      data_fim: evento.data_fim?.split("T")[0] || "",
      hora_inicio: evento.hora_inicio || "",
      hora_fim: evento.hora_fim || "",
      tipo_evento: evento.tipo_evento || "",
    })
    setIsModalOpen(false)
    setIsEditModalOpen(true)
  }

  function openEditFromDetail() {
    if (selectedEvento) openEditModal(selectedEvento)
  }

  async function handleUpdateEvento() {
    if (!editingId || !editForm.titulo || !editForm.tipo_evento) {
      toast.error("Preencha o título e o tipo do evento")
      return
    }

    setEditSaving(true)
    const result = await updateEvento(editingId, {
      titulo: editForm.titulo,
      descricao: editForm.descricao || null,
      data_inicio: editForm.data_inicio,
      data_fim: editForm.data_fim || null,
      hora_inicio: editForm.hora_inicio || null,
      hora_fim: editForm.hora_fim || null,
      tipo_evento: editForm.tipo_evento,
    })

    if (result.error) {
      toast.error(translateError(result.error))
      setEditSaving(false)
      return
    }

    toast.success("Evento atualizado com sucesso!")
    setIsEditModalOpen(false)
    setEditingId(null)
    setEditSaving(false)
    loadEventos()
  }

  function handleDiscardConfirm() {
    if (discardTarget === "new") {
      setIsNewEventOpen(false)
    } else if (discardTarget === "edit") {
      setIsEditModalOpen(false)
      setEditingId(null)
    }
    setIsDiscardDialogOpen(false)
    setDiscardTarget(null)
  }

  async function handleDeleteEvento() {
    if (!eventoToDelete) return

    setIsDeleting(true)

    const result = await deleteEvento(eventoToDelete.id)

    if (result.error) {
      toast.error(translateError(result.error))
      setIsDeleting(false)
      return
    }

    toast.success("Evento excluído com sucesso")
    setIsDeleteDialogOpen(false)
    setIsEditModalOpen(false)
    setIsModalOpen(false)
    setEventoToDelete(null)
    setEditingId(null)
    setIsDeleting(false)

    loadEventos()
  }

  function openDeleteDialog(evento: any, e: React.MouseEvent) {
    e.stopPropagation()
    setEventoToDelete(evento)
    setIsDeleteDialogOpen(true)
  }

  return (
    <>
      <PageHeader
        icon={Calendar}
        title="Agenda Escolar"
        subtitle="Gerencie eventos e calendário acadêmico"
        backHref="/dashboard"
        actions={
          <Button
            className="bg-cyan-600 hover:bg-cyan-700"
            onClick={() => {
              const hoje = new Date().toISOString().split("T")[0]
              setNewEventDate(hoje)
              setNewEventForm({
                titulo: "",
                descricao: "",
                data_inicio: hoje,
                data_fim: hoje,
                hora_inicio: "",
                hora_fim: "",
                tipo_evento: "",
              })
              setIsNewEventOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Evento
          </Button>
        }
      />

      <div className="space-y-4">
        <AgendaToolbar
          date={calendarDate}
          view={calendarView}
          views={["month", "week", "day"]}
          onView={handleViewChange}
          onNavigate={handleNavigate}
        />
        <div style={{ height: "calc(100vh - 180px)" }}>
          <AgendaRbc
            eventos={eventos}
            periodos={periodos}
            date={calendarDate}
            view={calendarView}
            onNavigate={(d) => setCalendarDate(d)}
            onViewChange={(v) => setCalendarView(v)}
            onSelectEvent={handleClickEvent}
            onSelectSlot={handleSlotClick}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            draggable
            resizable
            style={{ height: "100%" }}
          />
        </div>
      </div>

      <Dialog open={isDayEventsOpen} onOpenChange={setIsDayEventsOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Eventos — {dayHeaderDate?.toLocaleDateString("pt-BR")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {(() => {
              if (!dayHeaderDate) return null
              const dayEvents = eventos.filter((e) => {
                const inicio = new Date(e.data_inicio + "T00:00:00")
                const fim = e.data_fim ? new Date(e.data_fim + "T23:59:59") : inicio
                return dayHeaderDate >= inicio && dayHeaderDate <= fim
              })
              if (dayEvents.length === 0) {
                return <p className="text-sm text-gray-500 text-center py-8">Nenhum evento neste dia</p>
              }
              return dayEvents.map((evento) => (
                <div
                  key={evento.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer"
                  onClick={() => {
                    setSelectedEvento(evento)
                    setIsDayEventsOpen(false)
                    setIsModalOpen(true)
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{evento.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      <Badge variant={evento.tipo_evento === "feriado" ? "destructive" : "default"} className="mr-2">
                        {evento.tipo_evento}
                      </Badge>
                      {evento.hora_inicio && (
                        <span>{evento.hora_inicio}{evento.hora_fim ? ` - ${evento.hora_fim}` : ""}</span>
                      )}
                    </p>
                  </div>
                </div>
              ))
            })()}
          </div>
          <div className="pt-4 border-t mt-4">
            <Button
              className="bg-cyan-600 hover:bg-cyan-700 w-full"
              onClick={() => {
                if (dayHeaderDate) {
                  openNewEventForDate(dayHeaderDate)
                  setIsDayEventsOpen(false)
                }
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Evento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Todos os Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar eventos..."
                value={tableSearch}
                onChange={(e) => { setTableSearch(e.target.value); setTablePage(1) }}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={tableDateInicio}
                onChange={(e) => { setTableDateInicio(e.target.value); setTablePage(1) }}
                className="w-40"
              />
              <span className="text-muted-foreground">—</span>
              <Input
                type="date"
                value={tableDateFim}
                onChange={(e) => { setTableDateFim(e.target.value); setTablePage(1) }}
                className="w-40"
              />
            </div>
            <Select
              value={tableTipo}
              onValueChange={(v) => { setTableTipo(v); setTablePage(1) }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="aula">Aula</SelectItem>
                <SelectItem value="prova">Prova/Avaliação</SelectItem>
                <SelectItem value="reuniao">Reunião</SelectItem>
                <SelectItem value="evento">Evento Escolar</SelectItem>
                <SelectItem value="feriado">Feriado</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setTableSearch("")
                setTableDateInicio("")
                setTableDateFim("")
                setTableTipo("todos")
                setTablePage(1)
              }}
              title="Limpar filtros"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {paginatedEventos.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEventos.map((evento) => (
                    <TableRow
                      key={evento.id}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedEvento(evento)
                        setIsModalOpen(true)
                      }}
                    >
                      <TableCell className="font-medium">{evento.titulo}</TableCell>
                      <TableCell>
                        <Badge variant={evento.tipo_evento === "feriado" ? "destructive" : "default"}>
                          {evento.tipo_evento}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(evento.data_inicio + "T00:00:00").toLocaleDateString("pt-BR")}
                        {evento.data_fim && evento.data_fim !== evento.data_inicio && (
                          <> — {new Date(evento.data_fim + "T00:00:00").toLocaleDateString("pt-BR")}</>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {evento.hora_inicio && (
                          <>{evento.hora_inicio}{evento.hora_fim && <> - {evento.hora_fim}</>}</>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditModal(evento)
                            }}
                          >
                            <Edit2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => openDeleteDialog(evento, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <DataPagination
                currentPage={tablePage}
                totalPages={totalPages}
                totalCount={filteredEventos.length}
                pageSize={tablePageSize}
                onPageChange={setTablePage}
                onPageSizeChange={(s) => { setTablePageSize(s); setTablePage(1) }}
              />
            </>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">Nenhum evento encontrado</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Evento</DialogTitle>
          </DialogHeader>

          {selectedEvento && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-xl font-semibold">{selectedEvento.titulo}</h3>
                  <Badge variant={selectedEvento.tipo_evento === "feriado" ? "destructive" : "default"}>
                    {selectedEvento.tipo_evento}
                  </Badge>
                </div>
                {selectedEvento.descricao && <p className="text-gray-600">{selectedEvento.descricao}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Data de Início</label>
                  <p className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {new Date(selectedEvento.data_inicio + "T00:00:00").toLocaleDateString("pt-BR")}
                  </p>
                </div>

                {selectedEvento.data_fim && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Data de Término</label>
                    <p className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {new Date(selectedEvento.data_fim + "T00:00:00").toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                )}

                {selectedEvento.hora_inicio && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Horário de Início</label>
                    <p className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {selectedEvento.hora_inicio}
                    </p>
                  </div>
                )}

                {selectedEvento.hora_fim && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Horário de Término</label>
                    <p className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {selectedEvento.hora_fim}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <div className="flex-1">
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      setEventoToDelete(selectedEvento)
                      setIsDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </div>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Fechar
                </Button>
                <Button onClick={openEditFromDetail} className="bg-cyan-600 hover:bg-cyan-700">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Editar Evento
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o evento "{eventoToDelete?.titulo}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvento}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isDiscardDialogOpen} onOpenChange={setIsDiscardDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Descartar alterações?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            As informações preenchidas serão perdidas. Deseja continuar?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDiscardDialogOpen(false)}>
              Continuar editando
            </Button>
            <Button onClick={handleDiscardConfirm} className="bg-red-600 hover:bg-red-700">
              Sim, descartar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewEventOpen} onOpenChange={setIsNewEventOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Evento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="novo-titulo">Título do Evento *</Label>
              <Input
                id="novo-titulo"
                value={newEventForm.titulo}
                onChange={(e) => setNewEventForm({ ...newEventForm, titulo: e.target.value })}
                placeholder="Ex: Reunião de Pais, Prova de Matemática..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="novo-descricao">Descrição</Label>
              <Textarea
                id="novo-descricao"
                value={newEventForm.descricao}
                onChange={(e) => setNewEventForm({ ...newEventForm, descricao: e.target.value })}
                placeholder="Descreva os detalhes do evento..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="novo-data-inicio">Data de Início *</Label>
                <Input
                  id="novo-data-inicio"
                  type="date"
                  value={newEventForm.data_inicio}
                  onChange={(e) => setNewEventForm({ ...newEventForm, data_inicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="novo-data-fim">Data de Fim</Label>
                <Input
                  id="novo-data-fim"
                  type="date"
                  value={newEventForm.data_fim}
                  onChange={(e) => setNewEventForm({ ...newEventForm, data_fim: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="novo-hora-inicio">Hora de Início</Label>
                <Input
                  id="novo-hora-inicio"
                  type="time"
                  value={newEventForm.hora_inicio}
                  onChange={(e) => setNewEventForm({ ...newEventForm, hora_inicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="novo-hora-fim">Hora de Fim</Label>
                <Input
                  id="novo-hora-fim"
                  type="time"
                  value={newEventForm.hora_fim}
                  onChange={(e) => setNewEventForm({ ...newEventForm, hora_fim: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="novo-tipo">Tipo de Evento *</Label>
              <Select
                value={newEventForm.tipo_evento}
                onValueChange={(value) => setNewEventForm({ ...newEventForm, tipo_evento: value })}
              >
                <SelectTrigger id="novo-tipo">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aula">Aula</SelectItem>
                  <SelectItem value="prova">Prova/Avaliação</SelectItem>
                  <SelectItem value="reuniao">Reunião</SelectItem>
                  <SelectItem value="evento">Evento Escolar</SelectItem>
                  <SelectItem value="feriado">Feriado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDiscardTarget("new"); setIsDiscardDialogOpen(true) }} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleCreateEvento} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">
              {saving ? "Salvando..." : "Salvar Evento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Evento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-titulo">Título do Evento *</Label>
              <Input
                id="edit-titulo"
                value={editForm.titulo}
                onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })}
                placeholder="Ex: Reunião de Pais, Prova de Matemática..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Textarea
                id="edit-descricao"
                value={editForm.descricao}
                onChange={(e) => setEditForm({ ...editForm, descricao: e.target.value })}
                placeholder="Descreva os detalhes do evento..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-data-inicio">Data de Início *</Label>
                <Input
                  id="edit-data-inicio"
                  type="date"
                  value={editForm.data_inicio}
                  onChange={(e) => setEditForm({ ...editForm, data_inicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-data-fim">Data de Fim</Label>
                <Input
                  id="edit-data-fim"
                  type="date"
                  value={editForm.data_fim}
                  onChange={(e) => setEditForm({ ...editForm, data_fim: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-hora-inicio">Hora de Início</Label>
                <Input
                  id="edit-hora-inicio"
                  type="time"
                  value={editForm.hora_inicio}
                  onChange={(e) => setEditForm({ ...editForm, hora_inicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-hora-fim">Hora de Fim</Label>
                <Input
                  id="edit-hora-fim"
                  type="time"
                  value={editForm.hora_fim}
                  onChange={(e) => setEditForm({ ...editForm, hora_fim: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-tipo">Tipo de Evento *</Label>
              <Select
                value={editForm.tipo_evento}
                onValueChange={(value) => setEditForm({ ...editForm, tipo_evento: value })}
              >
                <SelectTrigger id="edit-tipo">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aula">Aula</SelectItem>
                  <SelectItem value="prova">Prova/Avaliação</SelectItem>
                  <SelectItem value="reuniao">Reunião</SelectItem>
                  <SelectItem value="evento">Evento Escolar</SelectItem>
                  <SelectItem value="feriado">Feriado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <div className="flex-1">
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => {
                  setEventoToDelete(eventos.find((e) => e.id === editingId))
                  setIsDeleteDialogOpen(true)
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </div>
            <Button variant="outline" onClick={() => { setDiscardTarget("edit"); setIsDiscardDialogOpen(true) }} disabled={editSaving}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateEvento} disabled={editSaving} className="bg-cyan-600 hover:bg-cyan-700">
              {editSaving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
