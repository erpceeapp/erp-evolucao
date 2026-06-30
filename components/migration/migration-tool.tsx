"use client"

import { useCallback, useEffect, useState } from "react"
import { EntityCard } from "./entity-card"
import { loadMapping, clearMapping } from "@/lib/migration/mapping"
import type { IdMapping, EntityType } from "@/lib/migration/types"
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"

const ENTITIES: { type: EntityType; label: string; ordem: number; descricao: string }[] = [
  { type: "usuarios", label: "Usuarios", ordem: 1, descricao: "Auth + Profiles" },
  { type: "professores", label: "Professores", ordem: 2, descricao: "Dados de professores (user_id vinculado ao passo 1)" },
  { type: "disciplinas", label: "Disciplinas", ordem: 3, descricao: "Disciplinas (professor_id vinculado ao passo 2)" },
  { type: "turmas", label: "Turmas", ordem: 4, descricao: "Turmas + disciplinas (professor_responsavel vinculado ao passo 2, disciplinas ao passo 3)" },
  { type: "alunos", label: "Alunos", ordem: 5, descricao: "Alunos + matriculas (turmas vinculadas ao passo 4)" },
  { type: "matriculas", label: "Matriculas", ordem: 6, descricao: "Associacao alunos-turmas (alunos vinculados ao passo 5, turmas ao passo 4)" },
]

export function MigrationTool() {
  const [mapping, setMapping] = useState<IdMapping | null>(null)
  const [readySteps, setReadySteps] = useState<EntityType[]>([])
  const [resultados, setResultados] = useState<Record<EntityType, string | null>>({
    usuarios: null,
    professores: null,
    disciplinas: null,
    turmas: null,
    alunos: null,
    matriculas: null,
  })

  useEffect(() => {
    const m = loadMapping()
    if (m) setMapping(m)
  }, [])

  const isUnlocked = useCallback(
    (type: EntityType): boolean => {
      if (type === "usuarios") return true
      if (type === "professores") return readySteps.includes("usuarios")
      if (type === "disciplinas") return readySteps.includes("professores")
      if (type === "turmas") return readySteps.includes("disciplinas")
      if (type === "alunos") return readySteps.includes("turmas")
      if (type === "matriculas") return readySteps.includes("alunos")
      return false
    },
    [readySteps],
  )

  const handleImportComplete = useCallback(
    (type: EntityType, result: string) => {
      setResultados((prev) => ({ ...prev, [type]: result }))
      setReadySteps((prev) => {
        if (prev.includes(type)) return prev
        return [...prev, type]
      })
      const m = loadMapping()
      if (m) setMapping(m)
    },
    [],
  )

  const handleReset = useCallback(() => {
    clearMapping()
    setMapping(null)
    setReadySteps([])
    setResultados({ usuarios: null, professores: null, disciplinas: null, turmas: null, alunos: null, matriculas: null })
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="font-medium">Sessao:</span>
          {mapping ? (
            <span className="text-green-600">Mapping ativo ({Object.keys(mapping.profiles).length} usuarios importados)</span>
          ) : (
            <span className="text-amber-600">Nenhum mapping ativo</span>
          )}
        </div>
        {mapping && (
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Limpar Sessao
          </Button>
        )}
      </div>

      {ENTITIES.map((entity) => (
        <EntityCard
          key={entity.type}
          type={entity.type}
          label={entity.label}
          ordem={entity.ordem}
          descricao={entity.descricao}
          totalSteps={ENTITIES.length}
          unlocked={isUnlocked(entity.type)}
          onImportComplete={(result) => handleImportComplete(entity.type, result)}
          resultado={resultados[entity.type]}
        />
      ))}
    </div>
  )
}
