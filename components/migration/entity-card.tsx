"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Upload, CheckCircle2, Lock, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { importUsuarios, importProfessores, importTurmas, importAlunos } from "@/app/(authenticated)/ferramentas/export-import/actions/import"
import { exportUsuarios, exportProfessores, exportTurmas, exportAlunos } from "@/app/(authenticated)/ferramentas/export-import/actions/export"
import { ImportDialog } from "./import-dialog"
import type { EntityType } from "@/lib/migration/types"
import { saveMapping, loadMapping } from "@/lib/migration/mapping"

interface EntityCardProps {
  type: EntityType
  label: string
  ordem: number
  descricao: string
  totalSteps: number
  unlocked: boolean
  resultado: string | null
  onImportComplete: (result: string) => void
}

const exportFns = {
  usuarios: exportUsuarios,
  professores: exportProfessores,
  turmas: exportTurmas,
  alunos: exportAlunos,
} as const

const importFns = {
  usuarios: importUsuarios,
  professores: importProfessores,
  turmas: importTurmas,
  alunos: importAlunos,
} as const

export function EntityCard({
  type,
  label,
  ordem,
  descricao,
  totalSteps,
  unlocked,
  resultado,
  onImportComplete,
}: EntityCardProps) {
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  const handleExport = useCallback(async () => {
    setExporting(true)
    setExportError(null)
    try {
      const fn = exportFns[type]
      const result = await fn()
      if (result.error) {
        setExportError(result.error)
        return
      }
      if (result.data) {
        const blob = new Blob([result.data], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${type}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
    } finally {
      setExporting(false)
    }
  }, [type])

  const handleImport = useCallback(async (jsonData: string, conflictStrategy: "skip" | "overwrite" = "skip") => {
    const parsed = JSON.parse(jsonData)
    const currentMapping = loadMapping()
    const fn = importFns[type]
    const result = await fn(parsed.data || parsed, currentMapping || { profiles: {}, auth_users: {}, professores: {}, turmas: {} }, conflictStrategy)
    saveMapping(result.mapping)

    const resumo = [
      `--- Resultado da Importacao: ${label} ---`,
      `Total no arquivo: ${result.total}`,
      `Importados: ${result.importados}`,
      `Pulados: ${result.pulados}`,
      `Erros: ${result.erros}`,
      ...result.logs.filter((l) => l.status === "erro").map((l) => `  - "${l.nome}" (${l.identificador}): ${l.mensagem}`),
    ].join("\n")

    onImportComplete(resumo)
    return result
  }, [type, label, onImportComplete])

  return (
    <>
      <Card className={!unlocked ? "opacity-60" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg flex items-center gap-2">
                {ordem}. {label}
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {ordem}o de {totalSteps}
              </Badge>
              {unlocked && resultado && (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Importado
                </Badge>
              )}
            </div>
            {!unlocked && (
              <Lock className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <CardDescription>{descricao}</CardDescription>
        </CardHeader>
        <CardContent>
          {exportError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3 text-sm text-red-700">
              {exportError}
            </div>
          )}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Exportar JSON
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setImportDialogOpen(true)}
              disabled={!unlocked}
              title={!unlocked ? `Importe a entidade anterior primeiro` : undefined}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        entityName={label}
        onImport={handleImport}
      />
    </>
  )
}
