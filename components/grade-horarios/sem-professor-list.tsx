"use client"

import { AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { TurmaDisciplinaInfo } from "@/types/entities"

interface SemProfessorListProps {
  disciplinas: TurmaDisciplinaInfo[]
}

export function SemProfessorList({ disciplinas }: SemProfessorListProps) {
  const semProfessor = disciplinas.filter((d) => !d.tem_professor)

  if (semProfessor.length === 0) return null

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          Disciplinas sem professor ({semProfessor.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {semProfessor.map((d) => (
            <Badge key={d.id} variant="secondary" className="text-xs">
              {d.disciplina_nome} — {d.turma_nome}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
