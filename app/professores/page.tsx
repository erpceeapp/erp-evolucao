import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, GraduationCap } from "lucide-react"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"

export default async function ProfessoresPage() {
  const supabase = await createServerClient()

  const { data: professores, error } = await supabase.from("professores").select("*").order("nome", { ascending: true })

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Professores</h2>
          <p className="text-gray-600 mt-1">Gerencie os professores da instituição</p>
        </div>
        <Link href="/professores/novo">
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Novo Professor
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Professores</CardTitle>
              <CardDescription>{professores?.length || 0} professor(es) cadastrado(s)</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Buscar professor..." className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-red-600 p-4 bg-red-50 rounded-lg">Erro ao carregar professores: {error.message}</div>
          )}

          {!error && professores && professores.length === 0 && (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum professor cadastrado</h3>
              <p className="text-gray-600 mb-4">Comece cadastrando o primeiro professor da instituição</p>
              <Link href="/professores/novo">
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Professor
                </Button>
              </Link>
            </div>
          )}

          {!error && professores && professores.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Nome</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">CPF</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Telefone</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Especialidade</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {professores.map((professor) => (
                    <tr key={professor.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{professor.nome}</td>
                      <td className="py-3 px-4">{professor.cpf}</td>
                      <td className="py-3 px-4">{professor.email}</td>
                      <td className="py-3 px-4">{professor.telefone}</td>
                      <td className="py-3 px-4">{professor.especialidade || "-"}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            professor.status === "ativo" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {professor.status}
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
