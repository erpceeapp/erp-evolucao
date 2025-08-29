"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface MatriculasChartProps {
  data: Array<{ created_at: string }>
}

export function MatriculasChart({ data }: MatriculasChartProps) {
  // Processar dados para agrupar por mês
  const processedData = data.reduce((acc: Record<string, number>, item) => {
    const month = new Date(item.created_at).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "short",
    })
    acc[month] = (acc[month] || 0) + 1
    return acc
  }, {})

  const chartData = Object.entries(processedData).map(([month, count]) => ({
    month,
    matriculas: count,
  }))

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="matriculas" fill="#6366f1" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
