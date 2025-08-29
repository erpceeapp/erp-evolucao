import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BarChart3, Download, FileText, Users, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default async function RelatoriosPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const relatorios = [
    {
      id: "alunos",
      titulo: "Relatório de Alunos",
      descricao: "Lista completa de alunos com dados pessoais e status",
      icon: Users,
      color: "bg-blue-100 text-blue-600",
      href: "/relatorios/alunos",
    },
    {
      id: "professores",
      titulo: "Relatório de Professores",
      descricao: "Lista de professores com formação e disciplinas",
      icon: Users,
      color: "bg-green-100 text-green-600",
      href: "/relatorios/professores",
    },
    {
      id: "matriculas",
      titulo: "Relatório de Matrículas",
      descricao: "Matrículas por período, turma e status",
      icon: FileText,
      color: "bg-orange-100 text-orange-600",
      href: "/relatorios/matriculas",
    },
    {
      id: "frequencia",
      titulo: "Relatório de Frequência",
      descricao: "Frequência dos alunos por turma e disciplina",
      icon: Calendar,
      color: "bg-cyan-100 text-cyan-600",
      href: "/relatorios/frequencia",
    },
    {
      id: "notas",
      titulo: "Relatório de Notas",
      descricao: "Desempenho acadêmico dos alunos",
      icon: BarChart3,
      color: "bg-purple-100 text-purple-600",
      href: "/relatorios/notas",
    },
    {
      id: "turmas",
      titulo: "Relatório de Turmas",
      descricao: "Informações das turmas e disciplinas",
      icon: FileText,
      color: "bg-indigo-100 text-indigo-600",
      href: "/relatorios/turmas",
    },
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <BarChart3 className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
            <p className="text-gray-600">Gere e exporte relatórios do sistema</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatorios.map((relatorio) => (
          <Card key={relatorio.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`p-2 ${relatorio.color} rounded-lg`}>
                  <relatorio.icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">{relatorio.titulo}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{relatorio.descricao}</p>
              <div className="flex gap-2">
                <Button asChild className="flex-1">
                  <Link href={relatorio.href}>
                    <FileText className="h-4 w-4 mr-2" />
                    Visualizar
                  </Link>
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Relatórios Personalizados</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Crie relatórios personalizados com filtros específicos para suas necessidades.
          </p>
          <Button>
            <BarChart3 className="h-4 w-4 mr-2" />
            Criar Relatório Personalizado
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
