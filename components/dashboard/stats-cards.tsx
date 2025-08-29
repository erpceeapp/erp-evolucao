import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, GraduationCap, BookOpen, UserCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export async function StatsCards() {
  const supabase = await createClient()

  // Buscar estatísticas
  const [{ count: totalAlunos }, { count: totalProfessores }, { count: totalTurmas }, { count: totalMatriculas }] =
    await Promise.all([
      supabase.from("alunos").select("*", { count: "exact", head: true }),
      supabase.from("professores").select("*", { count: "exact", head: true }),
      supabase.from("turmas").select("*", { count: "exact", head: true }),
      supabase.from("matriculas").select("*", { count: "exact", head: true }),
    ])

  const stats = [
    {
      title: "Total de Alunos",
      value: totalAlunos || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total de Professores",
      value: totalProfessores || 0,
      icon: GraduationCap,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total de Turmas",
      value: totalTurmas || 0,
      icon: BookOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Total de Matrículas",
      value: totalMatriculas || 0,
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
}
