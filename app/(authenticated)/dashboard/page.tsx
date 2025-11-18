import { StatsCards } from "@/components/dashboard/stats-cards"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, GraduationCap, BookOpen, Calendar, UserCheck } from 'lucide-react'
import Link from "next/link"
import { LinksDocumentosCard } from "@/components/dashboard/links-documentos-card"

export default async function DashboardPage() {
  const quickActions = [
    {
      title: "Novo Aluno",
      description: "Cadastrar novo aluno",
      icon: Users,
      href: "/alunos/novo",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "Novo Professor",
      description: "Cadastrar novo professor",
      icon: GraduationCap,
      href: "/professores/novo",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: "Nova Turma",
      description: "Criar nova turma",
      icon: BookOpen,
      href: "/turmas/nova",
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      title: "Nova Matrícula",
      description: "Realizar nova matrícula",
      icon: UserCheck,
      href: "/matriculas/nova",
      color: "bg-orange-500 hover:bg-orange-600",
    },
  ]

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Visão Geral</h2>
        <StatsCards />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.href} href={action.href}>
                <Button
                  className={`${action.color} w-full h-auto p-4 flex flex-col items-center space-y-2 text-white`}
                  variant="default"
                >
                  <Icon className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs opacity-90">{action.description}</div>
                  </div>
                </Button>
              </Link>
            )
          })}
        </div>
      </div>

      <LinksDocumentosCard />

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividades Recentes</h3>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Últimas Atividades</span>
            </CardTitle>
            <CardDescription>Acompanhe as atividades mais recentes do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Sistema iniciado com sucesso</span>
                <span className="text-gray-400 ml-auto">Agora</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Banco de dados configurado</span>
                <span className="text-gray-400 ml-auto">Há 2 min</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-gray-600">Módulos carregados</span>
                <span className="text-gray-400 ml-auto">Há 5 min</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
