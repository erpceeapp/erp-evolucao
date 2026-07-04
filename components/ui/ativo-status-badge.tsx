import { Badge } from "@/components/ui/badge"

interface AtivoStatusBadgeProps {
  ativo: boolean
  labelAtivo?: string
  labelInativo?: string
  className?: string
}

export function AtivoStatusBadge({
  ativo,
  labelAtivo = "Ativo",
  labelInativo = "Inativo",
  className,
}: AtivoStatusBadgeProps) {
  return (
    <Badge className={`${ativo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-800"}${className ? ` ${className}` : ""}`}>
      {ativo ? labelAtivo : labelInativo}
    </Badge>
  )
}
