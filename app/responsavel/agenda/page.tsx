"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { BookUser, Calendar, Clock, School } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AgendaCalendar } from "@/components/agenda/agenda-calendar"

const categoriasAviso = [
  { value: "comportamento", label: "Comportamento" },
  { value: "reuniao", label: "Reuniao" },
  { value: "aviso", label: "Aviso aos Pais" },
  { value: "ocorrencia", label: "Ocorrencia" },
  { value: "elogio", label: "Elogio" },
  { value: "outro", label: "Outro" },
]

const categoriasEvento = [
  { value: "aula", label: "Aula" },
  { value: "prova", label: "Prova" },
  { value: "reuniao", label: "Reuniao" },
  { value: "evento", label: "Evento" },
  { value: "feriado", label: "Feriado" },
  { value: "aviso_pais", label: "Aviso aos Pais" },
]

const categoriaCoresAviso: Record<string, string> = {
  comportamento: "bg-orange-100 text-orange-700 border-orange-200",
  reuniao: "bg-blue-100 text-blue-700 border-blue-200",
  aviso: "bg-yellow-100 text-yellow-700 border-yellow-200",
  ocorrencia: "bg-red-100 text-red-700 border-red-200",
  elogio: "bg-green-100 text-green-700 border-green-200",
  outro: "bg-gray-100 text-gray-700 border-gray-200",
}

const categoriaCoresEvento: Record<string, string> = {
  aula: "bg-blue-100 text-blue-700 border-blue-200",
  prova: "bg-purple-100 text-purple-700 border-purple-200",
  reuniao: "bg-blue-100 text-blue-700 border-blue-200",
  evento: "bg-cyan-100 text-cyan-700 border-cyan-200",
  feriado: "bg-red-100 text-red-700 border-red-200",
  aviso_pais: "bg-yellow-100 text-yellow-700 border-yellow-200",
}

export default function ResponsavelAgendaPage() {
  const searchParams = useSearchParams()
  const [aluno, setAluno] = useState<any>(null)
  const [avisos, setAvisos] = useState<any[]>([])
  const [eventos, setEventos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAviso, setSelectedAviso] = useState<any>(null)
  const [selectedEvento, setSelectedEvento] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "aluno")

  useEffect(() => {
    setActiveTab(searchParams.get("tab") || "aluno")
  }, [searchParams])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch("/api/responsavel/agenda")
      if (res.ok) {
        const data = await res.json()
        setAluno(data.aluno)
        setAvisos(data.avisos || [])
        setEventos(data.eventos || [])
      }
    } catch (err) {
      toast.error("Erro ao carregar agenda")
    } finally {
      setLoading(false)
    }
  }

  const eventosCalendarioAluno = avisos.map((aviso) => ({
    id: aviso.id,
    titulo: aviso.titulo,
    descricao: aviso.descricao,
    data_inicio: aviso.data_aviso,
    data_fim: aviso.data_aviso,
    hora_inicio: aviso.hora_aviso,
    hora_fim: null,
    tipo_evento: aviso.tipo_aviso,
    local: null,
    created_at: aviso.created_at,
  })) as any[]

  const eventosCalendarioEscolar = eventos.map((evento) => ({
    id: evento.id,
    titulo: evento.titulo,
    descricao: evento.descricao,
    data_inicio: evento.data_inicio,
    data_fim: evento.data_fim,
    hora_inicio: evento.hora_inicio,
    hora_fim: evento.hora_fim,
    tipo_evento: evento.tipo_evento,
    local: evento.local,
  })) as any[]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com dados do aluno */}
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 p-2 rounded-full">
          <BookUser className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          {aluno && (
            <p className="text-sm text-gray-500">{aluno.nome_completo}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="aluno" className="flex items-center gap-2">
            <BookUser className="h-4 w-4" />
            Agenda do Aluno
          </TabsTrigger>
          <TabsTrigger value="escola" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            Agenda Escolar
          </TabsTrigger>
        </TabsList>

        {/* Tab: Agenda do Aluno */}
        <TabsContent value="aluno" className="space-y-6 mt-6">
          {/* Calendario */}
          <Card>
            <CardContent className="pt-6">
              <AgendaCalendar
                eventos={eventosCalendarioAluno}
                onDayClick={(data) => setSelectedDate(selectedDate === data ? null : data)}
              />
            </CardContent>
          </Card>

          {/* Avisos do dia selecionado */}
          {selectedDate && (
            <Card className="border-blue-200 bg-blue-50/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Avisos de {new Date(selectedDate + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                  </CardTitle>
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Fechar
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {avisos.filter((a) => a.data_aviso === selectedDate).length === 0 ? (
                  <p className="text-center text-gray-500 py-6">Nenhum aviso registrado nesta data.</p>
                ) : (
                  <div className="space-y-3">
                    {avisos
                      .filter((a) => a.data_aviso === selectedDate)
                      .map((aviso) => (
                        <div
                          key={aviso.id}
                          onClick={() => setSelectedAviso(aviso)}
                          className="flex items-start gap-3 p-3 rounded-lg bg-white border hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900 truncate">{aviso.titulo}</h4>
                              <Badge
                                variant="outline"
                                className={categoriaCoresAviso[aviso.tipo_aviso] || categoriaCoresAviso.outro}
                              >
                                {categoriasAviso.find((c) => c.value === aviso.tipo_aviso)?.label || aviso.tipo_aviso}
                              </Badge>
                            </div>
                            {aviso.descricao && (
                              <div className="text-sm text-gray-600 line-clamp-2 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: aviso.descricao }} />
                            )}
                            {aviso.hora_aviso && (
                              <span className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                {aviso.hora_aviso}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Lista de todos os avisos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Todos os Avisos</CardTitle>
            </CardHeader>
            <CardContent>
              {avisos.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhum aviso registrado.</p>
              ) : (
                <div className="space-y-3">
                  {avisos.map((aviso) => (
                    <div
                      key={aviso.id}
                      onClick={() => setSelectedAviso(aviso)}
                      className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 truncate">{aviso.titulo}</h4>
                          <Badge
                            variant="outline"
                            className={categoriaCoresAviso[aviso.tipo_aviso] || categoriaCoresAviso.outro}
                          >
                            {categoriasAviso.find((c) => c.value === aviso.tipo_aviso)?.label || aviso.tipo_aviso}
                          </Badge>
                        </div>
                        {aviso.descricao && (
                          <div className="text-sm text-gray-600 line-clamp-2 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: aviso.descricao }} />
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(aviso.data_aviso + "T00:00:00").toLocaleDateString("pt-BR")}
                          </span>
                          {aviso.hora_aviso && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {aviso.hora_aviso}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Agenda Escolar */}
        <TabsContent value="escola" className="space-y-6 mt-6">
          {/* Calendario */}
          <Card>
            <CardContent className="pt-6">
              <AgendaCalendar
                eventos={eventosCalendarioEscolar}
                onDayClick={(data) => setSelectedDate(selectedDate === data ? null : data)}
              />
            </CardContent>
          </Card>

          {/* Eventos do dia selecionado */}
          {selectedDate && (
            <Card className="border-blue-200 bg-blue-50/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Eventos de {new Date(selectedDate + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                  </CardTitle>
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Fechar
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {eventos.filter((e) => {
                  const dataInicio = e.data_inicio.split("T")[0]
                  const dataFim = (e.data_fim || e.data_inicio).split("T")[0]
                  return selectedDate >= dataInicio && selectedDate <= dataFim
                }).length === 0 ? (
                  <p className="text-center text-gray-500 py-6">Nenhum evento registrado nesta data.</p>
                ) : (
                  <div className="space-y-3">
                    {eventos
                      .filter((e) => {
                        const dataInicio = e.data_inicio.split("T")[0]
                        const dataFim = (e.data_fim || e.data_inicio).split("T")[0]
                        return selectedDate >= dataInicio && selectedDate <= dataFim
                      })
                      .map((evento) => (
                        <div
                          key={evento.id}
                          onClick={() => setSelectedEvento(evento)}
                          className="flex items-start gap-3 p-3 rounded-lg bg-white border hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900 truncate">{evento.titulo}</h4>
                              <Badge
                                variant="outline"
                                className={categoriaCoresEvento[evento.tipo_evento] || categoriaCoresEvento.evento}
                              >
                                {categoriasEvento.find((c) => c.value === evento.tipo_evento)?.label || evento.tipo_evento}
                              </Badge>
                            </div>
                            {evento.descricao && (
                              <div className="text-sm text-gray-600 line-clamp-2 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: evento.descricao }} />
                            )}
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                              {evento.hora_inicio && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {evento.hora_inicio}{evento.hora_fim ? ` - ${evento.hora_fim}` : ""}
                                </span>
                              )}
                              {evento.local && (
                                <span>{evento.local}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Lista de todos os eventos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Todos os Eventos Escolares</CardTitle>
            </CardHeader>
            <CardContent>
              {eventos.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhum evento registrado.</p>
              ) : (
                <div className="space-y-3">
                  {eventos.map((evento) => (
                    <div
                      key={evento.id}
                      onClick={() => setSelectedEvento(evento)}
                      className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 truncate">{evento.titulo}</h4>
                          <Badge
                            variant="outline"
                            className={categoriaCoresEvento[evento.tipo_evento] || categoriaCoresEvento.evento}
                          >
                            {categoriasEvento.find((c) => c.value === evento.tipo_evento)?.label || evento.tipo_evento}
                          </Badge>
                        </div>
                        {evento.descricao && (
                          <div className="text-sm text-gray-600 line-clamp-2 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: evento.descricao }} />
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(evento.data_inicio + "T00:00:00").toLocaleDateString("pt-BR")}
                            {evento.data_fim && evento.data_fim !== evento.data_inicio && (
                              <> - {new Date(evento.data_fim + "T00:00:00").toLocaleDateString("pt-BR")}</>
                            )}
                          </span>
                          {evento.hora_inicio && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {evento.hora_inicio}{evento.hora_fim ? ` - ${evento.hora_fim}` : ""}
                            </span>
                          )}
                          {evento.local && (
                            <span>{evento.local}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de detalhes do aviso */}
      <Dialog open={!!selectedAviso} onOpenChange={() => setSelectedAviso(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAviso?.titulo}
            </DialogTitle>
          </DialogHeader>
          {selectedAviso && (
            <div className="space-y-4">
              <Badge
                variant="outline"
                className={categoriaCoresAviso[selectedAviso.tipo_aviso] || categoriaCoresAviso.outro}
              >
                {categoriasAviso.find((c) => c.value === selectedAviso.tipo_aviso)?.label || selectedAviso.tipo_aviso}
              </Badge>

              <div>
                <label className="text-sm font-medium text-gray-500">Data</label>
                <p className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {new Date(selectedAviso.data_aviso + "T00:00:00").toLocaleDateString("pt-BR")}
                </p>
              </div>

              {selectedAviso.hora_aviso && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Horario</label>
                  <p className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {selectedAviso.hora_aviso}
                  </p>
                </div>
              )}

              {selectedAviso.descricao && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Descricao</label>
                  <div className="mt-1 prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: selectedAviso.descricao }} />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de detalhes do evento escolar */}
      <Dialog open={!!selectedEvento} onOpenChange={() => setSelectedEvento(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvento?.titulo}
            </DialogTitle>
          </DialogHeader>
          {selectedEvento && (
            <div className="space-y-4">
              <Badge
                variant="outline"
                className={categoriaCoresEvento[selectedEvento.tipo_evento] || categoriaCoresEvento.evento}
              >
                {categoriasEvento.find((c) => c.value === selectedEvento.tipo_evento)?.label || selectedEvento.tipo_evento}
              </Badge>

              <div>
                <label className="text-sm font-medium text-gray-500">Data</label>
                <p className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {new Date(selectedEvento.data_inicio + "T00:00:00").toLocaleDateString("pt-BR")}
                  {selectedEvento.data_fim && selectedEvento.data_fim !== selectedEvento.data_inicio && (
                    <> - {new Date(selectedEvento.data_fim + "T00:00:00").toLocaleDateString("pt-BR")}</>
                  )}
                </p>
              </div>

              {selectedEvento.hora_inicio && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Horario</label>
                  <p className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {selectedEvento.hora_inicio}{selectedEvento.hora_fim ? ` - ${selectedEvento.hora_fim}` : ""}
                  </p>
                </div>
              )}

              {selectedEvento.local && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Local</label>
                  <p className="mt-1">{selectedEvento.local}</p>
                </div>
              )}

              {selectedEvento.descricao && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Descricao</label>
                  <div className="mt-1 prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: selectedEvento.descricao }} />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
