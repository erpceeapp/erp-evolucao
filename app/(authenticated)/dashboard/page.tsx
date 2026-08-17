import { StatsCards } from "@/components/dashboard/stats-cards"
import { Button } from "@/components/ui/button"
import { Users, GraduationCap, BookOpen, UserCheck, LayoutDashboard } from 'lucide-react'
import Link from "next/link"
import { LinksDocumentosCard } from "@/components/dashboard/links-documentos-card"
import { AniversariantesCard } from "@/components/dashboard/aniversariantes-card"
import { TurmasVagaCard } from "@/components/dashboard/turmas-vaga-card"
import { AlunosSemMatriculaCard } from "@/components/dashboard/alunos-sem-matricula-card"
import { MatriculasPendentesCard } from "@/components/dashboard/matriculas-pendentes-card"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const { data: profile } = userData.user
    ? await supabase.from("profiles").select("tipo_usuario").eq("id", userData.user.id).single()
    : { data: null }
  const isProfessor = profile?.tipo_usuario === "professor"

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
    <>
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description="Visão geral do sistema"
      />
      <BreadcrumbNav
        items={[
          { label: "Inicio" },
        ]}
        className="mt-2"
      />
      <div className="space-y-8">
        <StatsCards />

        {!isProfessor && (
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
        )}

        <LinksDocumentosCard />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AniversariantesCard />
          <TurmasVagaCard />
          <AlunosSemMatriculaCard />
          <MatriculasPendentesCard />
        </div>
      </div>
    </>
  )
}
