"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { History, ArrowRight } from "lucide-react"
import { MatriculaStatusBadge } from "@/components/ui/matricula-status-badge"
import { cn } from "@/lib/utils"

interface HistoricoRegistro {
  id: string
  tipo: string
  status_anterior: string | null
  status_novo: string | null
  turma_anterior: string | null
  turma_nova: string | null
  alterado_por_nome: string | null
  alterado_em: string
}

const TIPO_CONFIG: Record<string, { label: string; className: string }> = {
  criacao: { label: "Criação", className: "bg-blue-100 text-blue-700" },
  alteracao_status: { label: "Alteração de status", className: "bg-yellow-100 text-yellow-700" },
  mudanca_turma: { label: "Mudança de turma", className: "bg-orange-100 text-orange-700" },
  transferencia: { label: "Transferência", className: "bg-purple-100 text-purple-700" },
}

interface MatriculaHistoricoProps {
  registros: HistoricoRegistro[]
}

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return value
  }
}

export function MatriculaHistorico({ registros }: MatriculaHistoricoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Histórico da Matrícula
        </CardTitle>
      </CardHeader>
      <CardContent>
        {registros.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma alteração registrada.</p>
        ) : (
          <ol className="relative space-y-6">
            {registros.map((reg, index) => {
              const config = TIPO_CONFIG[reg.tipo] || {
                label: reg.tipo,
                className: "bg-gray-100 text-gray-800",
              }
              const isLast = index === registros.length - 1
              return (
                <li key={reg.id} className="relative pl-8">
                  {!isLast && (
                    <span className="absolute left-2 top-6 bottom-[-24px] w-px bg-border" aria-hidden="true" />
                  )}
                  <span
                    className={cn(
                      "absolute left-0 top-1.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-background",
                      "bg-primary/10"
                    )}
                    aria-hidden="true"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={config.className}>{config.label}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(reg.alterado_em)}
                      {reg.alterado_por_nome ? ` · por ${reg.alterado_por_nome}` : ""}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                    {reg.status_anterior && reg.status_novo && (
                      <div className="flex items-center gap-2">
                        <MatriculaStatusBadge status={reg.status_anterior} />
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        <MatriculaStatusBadge status={reg.status_novo} />
                      </div>
                    )}
                    {reg.turma_anterior && reg.turma_nova && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Badge variant="outline">{reg.turma_anterior}</Badge>
                        <ArrowRight className="h-3.5 w-3.5" />
                        <Badge variant="outline">{reg.turma_nova}</Badge>
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}