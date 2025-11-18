import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, GraduationCap, BookOpen, UserCheck } from 'lucide-react'
import { createClient } from "@/lib/supabase/server"

export async function StatsCards() {
  const supabase = await createClient()

  console.log("[v0] StatsCards - Fetching statistics")

  try {
    // Buscar estatísticas com tratamento de erro individual
    const [alunosResult, professoresResult, turmasResult, matriculasResult] = await Promise.all([
      supabase.from("alunos").select("*", { count: "exact", head: true }),
      supabase.from("professores").select("*", { count: "exact", head: true }),
      supabase.from("turmas").select("*", { count: "exact", head: true }),
      supabase.from("matriculas").select("*", { count: "exact", head: true }),
    ])

    // Log de debug para verificar erros
    if (alunosResult.error) console.error("[v0] Erro ao buscar alunos:", alunosResult.error)
    if (professoresResult.error) console.error("[v0] Erro ao buscar professores:", professoresResult.error)
    if (turmasResult.error) console.error("[v0] Erro ao buscar turmas:", turmasResult.error)
    if (matriculasResult.error) console.error("[v0] Erro ao buscar matrículas:", matriculasResult.error)

    const stats = [
      {
        title: "Total de Alunos",
        value: alunosResult.count || 0,
        icon: Users,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      },
      {
        title: "Total de Professores",
        value: professoresResult.count || 0,
        icon: GraduationCap,
        color: "text-green-600",
        bgColor: "bg-green-100",
      },
      {
        title: "Total de Turmas",
        value: turmasResult.count || 0,
        icon: BookOpen,
        color: "text-purple-600",
        bgColor: "bg-purple-100",
      },
      {
        title: "Total de Matrículas",
        value: matriculasResult.count || 0,
        icon: UserCheck,
        color: "text-orange-600",
        bgColor: "bg-orange-100",
      },
    ]

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  } catch (error) {
    console.error("[v0] StatsCards - Erro ao buscar estatísticas:", error)
    
    // Retornar cards com valores zero em caso de erro
    const defaultStats = [
      {
        title: "Total de Alunos",
        value: 0,
        icon: Users,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      },
      {
        title: "Total de Professores",
        value: 0,
        icon: GraduationCap,
        color: "text-green-600",
        bgColor: "bg-green-100",
      },
      {
        title: "Total de Turmas",
        value: 0,
        icon: BookOpen,
        color: "text-purple-600",
        bgColor: "bg-purple-100",
      },
      {
        title: "Total de Matrículas",
        value: 0,
        icon: UserCheck,
        color: "text-orange-600",
        bgColor: "bg-orange-100",
      },
    ]

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {defaultStats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <p className="text-xs text-red-500 mt-1">Erro ao carregar</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }
}
