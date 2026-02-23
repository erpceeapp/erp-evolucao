"use client"

import React, { useState, useEffect } from "react"
import { BookUser, Calendar, Clock, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AgendaCalendar } from "@/components/agenda/agenda-calendar"

const categorias = [
  { value: "comportamento", label: "Comportamento" },
  { value: "reuniao", label: "Reuniao" },
  { value: "aviso", label: "Aviso aos Pais" },
  { value: "ocorrencia", label: "Ocorrencia" },
  { value: "elogio", label: "Elogio" },
  { value: "outro", label: "Outro" },
]

const categoriaCores: Record<string, string> = {
  comportamento: "bg-orange-100 text-orange-700 border-orange-200",
  reuniao: "bg-blue-100 text-blue-700 border-blue-200",
  aviso: "bg-yellow-100 text-yellow-700 border-yellow-200",
  ocorrencia: "bg-red-100 text-red-700 border-red-200",
  elogio: "bg-green-100 text-green-700 border-green-200",
  outro: "bg-gray-100 text-gray-700 border-gray-200",
}

export default function ResponsavelAgendaPage() {
  const [aluno, setAluno] = useState<any>(null)
  const [avisos, setAvisos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAviso, setSelectedAviso] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

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
      }
    } catch (err) {
      console.error("[v0] Erro ao carregar agenda:", err)
    } finally {
      setLoading(false)
    }
  }

  const eventosCalendario = avisos.map((aviso) => ({
    id: aviso.id,
    titulo: aviso.titulo,
    descricao: aviso.descricao,
    data_inicio: aviso.data_aviso,
    data_fim: aviso.data_aviso,
    hora_inicio: aviso.hora_aviso,
    tipo_evento: aviso.tipo_aviso,
  }))

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
          <h1 className="text-2xl font-bold text-gray-900">Agenda do Aluno</h1>
          {aluno && (
            <p className="text-sm text-gray-500">{aluno.nome_completo}</p>
          )}
        </div>
      </div>

      {/* Calendario */}
      <Card>
        <CardContent className="pt-6">
          <AgendaCalendar
            eventos={eventosCalendario}
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
                            className={categoriaCores[aviso.tipo_aviso] || categoriaCores.outro}
                          >
                            {categorias.find((c) => c.value === aviso.tipo_aviso)?.label || aviso.tipo_aviso}
                          </Badge>
                        </div>
                        {aviso.descricao && (
                          <p className="text-sm text-gray-600 line-clamp-2">{aviso.descricao}</p>
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
                        className={categoriaCores[aviso.tipo_aviso] || categoriaCores.outro}
                      >
                        {categorias.find((c) => c.value === aviso.tipo_aviso)?.label || aviso.tipo_aviso}
                      </Badge>
                    </div>
                    {aviso.descricao && (
                      <p className="text-sm text-gray-600 line-clamp-2">{aviso.descricao}</p>
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

      {/* Modal de detalhes (somente leitura) */}
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
                className={categoriaCores[selectedAviso.tipo_aviso] || categoriaCores.outro}
              >
                {categorias.find((c) => c.value === selectedAviso.tipo_aviso)?.label || selectedAviso.tipo_aviso}
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
                  <p className="mt-1 text-gray-700 whitespace-pre-wrap">{selectedAviso.descricao}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
