import { Badge } from "@/components/ui/badge"

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  ativa: { label: "Ativa", className: "bg-green-100 text-green-700" },
  transferida: { label: "Transferida", className: "bg-purple-100 text-purple-700" },
  cancelada: { label: "Cancelada", className: "bg-orange-100 text-orange-700" },
  concluida: { label: "Concluída", className: "bg-blue-100 text-blue-700" },
}

interface MatriculaStatusBadgeProps {
  status: string
}

export function MatriculaStatusBadge({ status }: MatriculaStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { label: status, className: "bg-gray-100 text-gray-800" }
  return <Badge className={config.className}>{config.label}</Badge>
}
