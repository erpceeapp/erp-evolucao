"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Calendar, Plus, Filter, Eye, Grid3X3, List, Clock, Edit2, X, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { AgendaCalendar } from "@/components/agenda/agenda-calendar"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { deleteEvento } from "./actions"

export default function AgendaPage() {
  const [eventos, setEventos] = useState<any[]>([])
  const [selectedEvento, setSelectedEvento] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [eventoToDelete, setEventoToDelete] = useState<any>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadEventos()
  }, [])

  async function loadEventos() {
    const { data, error } = await supabase.from("eventos").select("*").order("data_inicio", { ascending: true })

    if (error) {
      console.error("[v0] Erro ao buscar eventos:", error)
      toast.error("Erro ao carregar eventos")
      return
    }

    setEventos(data || [])
  }

  function handleEventClick(evento: any) {
    setSelectedEvento(evento)
    setIsModalOpen(true)
  }

  function handleEditEvento() {
    if (selectedEvento) {
      router.push(`/agenda/${selectedEvento.id}/editar`)
    }
  }

  async function handleDeleteEvento() {
    if (!eventoToDelete) return

    setIsDeleting(true)

    const result = await deleteEvento(eventoToDelete.id)

    if (result.error) {
      toast.error(result.error)
      setIsDeleting(false)
      return
    }

    toast.success("Evento excluído com sucesso")
    setIsDeleteDialogOpen(false)
    setEventoToDelete(null)
    setIsDeleting(false)

    loadEventos()
  }

  function openDeleteDialog(evento: any, e: React.MouseEvent) {
    e.stopPropagation()
    setEventoToDelete(evento)
    setIsDeleteDialogOpen(true)
  }

  const hoje = new Date().toISOString().split("T")[0]
  const eventosProximos = eventos.filter((evento) => evento.data_inicio >= hoje)

  return (
    <>
      <PageHeader
        icon={Calendar}
        title="Agenda Escolar"
        subtitle="Gerencie eventos e calendário acadêmico"
        backHref="/dashboard"
      />
      <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button asChild className="bg-cyan-600 hover:bg-cyan-700">
            <Link href="/agenda/novo-evento">
              <Plus className="h-4 w-4 mr-2" />
              Novo Evento
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="mes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dia">
              <Eye className="h-4 w-4 mr-2" />
              Dia
            </TabsTrigger>
            <TabsTrigger value="semana">
              <List className="h-4 w-4 mr-2" />
              Semana
            </TabsTrigger>
            <TabsTrigger value="mes">
              <Grid3X3 className="h-4 w-4 mr-2" />
              Mês
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mes" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <AgendaCalendar eventos={eventos} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Todos os Eventos</CardTitle>
              </CardHeader>
              <CardContent>
                {eventosProximos.length > 0 ? (
                  <div className="space-y-3">
                    {eventosProximos.map((evento) => (
                      <div
                        key={evento.id}
                        className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleEventClick(evento)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-gray-900">{evento.titulo}</h4>
                              <Badge variant={evento.tipo_evento === "feriado" ? "destructive" : "default"}>
                                {evento.tipo_evento}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{evento.descricao}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(evento.data_inicio).toLocaleDateString("pt-BR")}
                                {evento.data_fim && evento.data_fim !== evento.data_inicio && (
                                  <> até {new Date(evento.data_fim).toLocaleDateString("pt-BR")}</>
                                )}
                              </span>
                              {evento.hora_inicio && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {evento.hora_inicio}
                                  {evento.hora_fim && <> - {evento.hora_fim}</>}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => openDeleteDialog(evento, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-8">Nenhum evento cadastrado</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="semana">
            <Card>
              <CardHeader>
                <CardTitle>Visualização Semanal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-8 gap-2">
                  <div className="text-sm font-medium text-gray-500 p-2">Horário</div>
                  {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia) => (
                    <div key={dia} className="text-center text-sm font-medium text-gray-500 p-2">
                      {dia}
                    </div>
                  ))}
                  {Array.from({ length: 12 }, (_, i) => {
                    const hora = i + 7
                    return (
                      <React.Fragment key={hora}>
                        <div className="text-xs text-gray-400 p-2">{hora}:00</div>
                        {Array.from({ length: 7 }, (_, j) => (
                          <div
                            key={j}
                            className="border border-gray-100 p-2 min-h-[60px] hover:bg-gray-50 cursor-pointer"
                          >
                            {/* Eventos da semana apareceriam aqui */}
                          </div>
                        ))}
                      </React.Fragment>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dia">
            <Card>
              <CardHeader>
                <CardTitle>Visualização Diária - {new Date().toLocaleDateString("pt-BR")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from({ length: 12 }, (_, i) => {
                    const hora = i + 7
                    const eventosHora = eventos.filter((evento) => {
                      if (!evento.hora_inicio) return false
                      const eventoHora = Number.parseInt(evento.hora_inicio.split(":")[0])
                      return eventoHora === hora
                    })

                    return (
                      <div key={hora} className="flex gap-4 p-3 border rounded-lg hover:bg-gray-50">
                        <div className="text-sm font-medium text-gray-500 w-16">{hora}:00</div>
                        <div className="flex-1">
                          {eventosHora.length > 0 ? (
                            eventosHora.map((evento) => (
                              <div key={evento.id} className="p-2 bg-cyan-50 rounded border-l-4 border-cyan-500">
                                <h4 className="font-medium">{evento.titulo}</h4>
                                <p className="text-sm text-gray-600">{evento.descricao}</p>
                              </div>
                            ))
                          ) : (
                            <div className="text-gray-400 text-sm">Sem eventos neste horário</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Detalhes do Evento</span>
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
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
                    {new Date(selectedEvento.data_inicio).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                {selectedEvento.data_fim && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Data de Término</label>
                    <p className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {new Date(selectedEvento.data_fim).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                )}

                {selectedEvento.hora_inicio && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Horário de Início</label>
                    <p className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {selectedEvento.hora_inicio}
                    </p>
                  </div>
                )}

                {selectedEvento.hora_fim && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Horário de Término</label>
                    <p className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {selectedEvento.hora_fim}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Fechar
                </Button>
                <Button onClick={handleEditEvento} className="bg-cyan-600 hover:bg-cyan-700">
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
    </>
  )
}
