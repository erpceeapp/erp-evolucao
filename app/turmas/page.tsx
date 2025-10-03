import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, BookOpen } from "lucide-react"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"

export default async function TurmasPage() {
  const supabase = await createServerClient()

  const { data: turmas, error } = await supabase
    .from("turmas")
    .select("*, cursos(nome)")
    .order("nome", { ascending: true })

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Turmas</h2>
          <p className="text-gray-600 mt-1">Gerencie as turmas da instituição</p>
        </div>
        <Link href="/turmas/nova">
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Nova Turma
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Turmas</CardTitle>
              <CardDescription>{turmas?.length || 0} turma(s) cadastrada(s)</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Buscar turma..." className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-red-600 p-4 bg-red-50 rounded-lg">Erro ao carregar turmas: {error.message}</div>
          )}

          {!error && turmas && turmas.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma turma cadastrada</h3>
              <p className="text-gray-600 mb-4">Comece criando a primeira turma da instituição</p>
              <Link href="/turmas/nova">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Turma
                </Button>
              </Link>
            </div>
          )}

          {!error && turmas && turmas.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Nome</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Curso</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Ano Letivo</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Turno</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Vagas</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {turmas.map((turma) => (
                    <tr key={turma.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{turma.nome}</td>
                      <td className="py-3 px-4">{turma.cursos?.nome || "-"}</td>
                      <td className="py-3 px-4">{turma.ano_letivo}</td>
                      <td className="py-3 px-4 capitalize">{turma.turno}</td>
                      <td className="py-3 px-4">
                        {turma.vagas_disponiveis}/{turma.vagas_totais}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            turma.status === "ativa" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {turma.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm">
                          Ver Detalhes
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
