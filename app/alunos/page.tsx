import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Users } from "lucide-react"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"

export default async function AlunosPage() {
  const supabase = await createServerClient()

  const { data: alunos, error } = await supabase.from("alunos").select("*").order("nome", { ascending: true })

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Alunos</h2>
          <p className="text-gray-600 mt-1">Gerencie os alunos da instituição</p>
        </div>
        <Link href="/alunos/novo">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Novo Aluno
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Alunos</CardTitle>
              <CardDescription>{alunos?.length || 0} aluno(s) cadastrado(s)</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Buscar aluno..." className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-red-600 p-4 bg-red-50 rounded-lg">Erro ao carregar alunos: {error.message}</div>
          )}

          {!error && alunos && alunos.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum aluno cadastrado</h3>
              <p className="text-gray-600 mb-4">Comece cadastrando o primeiro aluno da instituição</p>
              <Link href="/alunos/novo">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Aluno
                </Button>
              </Link>
            </div>
          )}

          {!error && alunos && alunos.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Nome</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">CPF</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Telefone</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {alunos.map((aluno) => (
                    <tr key={aluno.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{aluno.nome}</td>
                      <td className="py-3 px-4">{aluno.cpf}</td>
                      <td className="py-3 px-4">{aluno.email}</td>
                      <td className="py-3 px-4">{aluno.telefone}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            aluno.status === "ativo" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {aluno.status}
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
