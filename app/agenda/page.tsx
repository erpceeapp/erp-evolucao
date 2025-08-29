import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Calendar, Plus, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

async function getEventos() {
  const supabase = await createServerClient()

  const { data: eventos, error } = await supabase.from("eventos").select("*").order("data_evento", { ascending: true })

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
  const eventosProximos = eventos.filter((evento) => evento.data_evento >= hoje).slice(0, 5)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <Calendar className="h-6 w-6 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agenda Escolar</h1>
            <p className="text-gray-600">Gerencie eventos e calendário acadêmico</p>
          </div>
        </div>
        <div className="flex gap-2">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Calendário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia) => (
                  <div key={dia} className="text-center text-sm font-medium text-gray-500 p-2">
                    {dia}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }, (_, i) => {
                  const dia = i - 5 + 1
                  const isToday = dia === new Date().getDate()
                  const hasEvent = eventos.some((evento) => {
                    const eventDate = new Date(evento.data_evento)
                    return eventDate.getDate() === dia
                  })

                  return (
                    <div
                      key={i}
                      className={`
                        aspect-square flex items-center justify-center text-sm rounded-lg cursor-pointer
                        ${isToday ? "bg-cyan-600 text-white" : "hover:bg-gray-100"}
                        ${hasEvent ? "bg-cyan-50 border border-cyan-200" : ""}
                        ${dia <= 0 || dia > 31 ? "text-gray-300" : ""}
                      `}
                    >
                      {dia > 0 && dia <= 31 ? dia : ""}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
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
                          {new Date(evento.data_evento).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Badge variant={evento.tipo === "feriado" ? "destructive" : "default"}>{evento.tipo}</Badge>
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
    </div>
  )
}
