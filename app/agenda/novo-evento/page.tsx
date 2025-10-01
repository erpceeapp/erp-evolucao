import { Suspense } from "react"
import { NovoEventoForm } from "@/components/agenda/novo-evento-form"
import { Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NovoEventoPage() {
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-cyan-100 rounded-lg">
          <Calendar className="h-6 w-6 text-cyan-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Evento</h1>
          <p className="text-gray-600">Adicione um novo evento ao calendário escolar</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Evento</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-center py-8 text-gray-500">Carregando formulário...</div>}>
            <NovoEventoForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
