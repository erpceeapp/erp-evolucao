import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: number
  icon: LucideIcon
  color: string
}

export function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${color} rounded-lg`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface DashboardStatsProps {
  stats: {
    totalAlunos: number
    totalProfessores: number
    totalTurmas: number
    totalDisciplinas: number
    matriculasAtivas: number
    aulasHoje: number
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* Stats cards would go here */}
    </div>
  )
}
