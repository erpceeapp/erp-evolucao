import React from "react"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Calendar, Plus, Filter, Eye, Grid3X3, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { AgendaCalendar } from "@/components/agenda/agenda-calendar"

async function getEventos() {
  const supabase = await createServerClient()

  const { data: eventos, error } = await supabase.from("eventos").select("*").order("data_inicio", { ascending: true })

  if (error) {
    console.error("Erro ao buscar eventos:", error)
    return []
  }

  return eventos || []
}

export default async function AgendaPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const eventos = await getEventos()
  const hoje = new Date().toISOString().split("T")[0]
  const eventosProximos = eventos.filter((evento) => evento.data_inicio >= hoje).slice(0, 5)

  return (
    <>
      <PageHeader
        icon={Calendar}
        title="Agenda Escolar"
        subtitle="Gerencie eventos e calendário acadêmico"
        backHref="/dashboard"
      />
      <div className="container mx-auto p-6 space-y-6">
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

          <TabsContent value="mes">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AgendaCalendar eventos={eventos} />
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Próximos Eventos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {eventosProximos.length > 0 ? (
                      eventosProximos.map((evento) => (
                        <div key={evento.id} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{evento.titulo}</h4>
                              <p className="text-sm text-gray-600">{evento.descricao}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(evento.data_inicio).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                            <Badge variant={evento.tipo_evento === "feriado" ? "destructive" : "default"}>
                              {evento.tipo_evento}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">Nenhum evento próximo</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ações Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                      <Link href="/diario">
                        <Calendar className="h-4 w-4 mr-2" />
                        Diário de Classe
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                      <Link href="/presenca">
                        <Calendar className="h-4 w-4 mr-2" />
                        Registrar Presença
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                      <Link href="/notas">
                        <Calendar className="h-4 w-4 mr-2" />
                        Lançar Notas
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
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
      </div>
    </>
  )
}
