"use client"

import { useState, useRef, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, Copy } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { ImportResult } from "@/lib/migration/types"

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityName: string
  onImport: (jsonData: string, conflictStrategy: "skip" | "overwrite") => Promise<ImportResult>
}

export function ImportDialog({ open, onOpenChange, entityName, onImport }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ total: number; firstItems: string[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [conflictStrategy, setConflictStrategy] = useState<"skip" | "overwrite">("skip")
  const [copied, setCopied] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return

    setError(null)
    setResult(null)
    setFile(f)

    try {
      const text = await f.text()
      setFileContent(text)
      const parsed = JSON.parse(text)

      if (!parsed.data || !Array.isArray(parsed.data)) {
        setError("JSON invalido: campo 'data' deve ser um array")
        setPreview(null)
        return
      }

      setPreview({
        total: parsed.data.length,
        firstItems: parsed.data.slice(0, 5).map((item: any) => item.nome_completo || item.nome || "-"),
      })
    } catch {
      setError("Arquivo JSON invalido. Verifique o formato.")
      setPreview(null)
    }
  }, [])

  const handleImport = useCallback(async () => {
    if (!fileContent) return
    setImporting(true)
    setError(null)
    try {
      const r = await onImport(fileContent, conflictStrategy)
      setResult(r)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setImporting(false)
    }
  }, [fileContent, onImport, conflictStrategy])

  const handleClose = useCallback(() => {
    if (!importing) {
      onOpenChange(false)
      setFile(null)
      setFileContent(null)
      setPreview(null)
      setError(null)
      setResult(null)
    }
  }, [importing, onOpenChange])

  const resultText = useCallback((r: ImportResult) => [
    `Total no arquivo: ${r.total}`,
    `Importados: ${r.importados}`,
    `Pulados: ${r.pulados}`,
    `Erros: ${r.erros}`,
    ...r.logs.filter((l) => l.status === "erro").map((l) => `"${l.nome}": ${l.mensagem}`),
  ].join("\n"), [])

  const handleCopy = useCallback(async (r: ImportResult) => {
    try {
      await navigator.clipboard.writeText(resultText(r))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /**/ }
  }, [resultText])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar {entityName}</DialogTitle>
          <DialogDescription>
            Selecione um arquivo JSON exportado anteriormente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!result && (
            <div>
              <Input
                ref={fileRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {preview && !result && (
            <div className="bg-gray-50 rounded-md p-3 text-sm space-y-1">
              <p className="font-medium text-gray-700">
                <FileText className="h-4 w-4 inline mr-1" />
                {preview.total} registro{preview.total !== 1 ? "s" : ""} encontrado{preview.total !== 1 ? "s" : ""}
              </p>
              {preview.firstItems.length > 0 && (
                <ul className="list-disc list-inside text-gray-600">
                  {preview.firstItems.map((name, i) => (
                    <li key={i}>{name}</li>
                  ))}
                  {preview.total > 5 && <li className="text-gray-400">...e mais {preview.total - 5}</li>}
                </ul>
              )}
            </div>
          )}

          {preview && !result && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Conflitos:</p>
              <RadioGroup value={conflictStrategy} onValueChange={(v: "skip" | "overwrite") => setConflictStrategy(v)} className="flex flex-row gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="skip" id="cs-skip" />
                  <Label htmlFor="cs-skip" className="font-normal text-sm cursor-pointer">Pular duplicatas</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="overwrite" id="cs-overwrite" />
                  <Label htmlFor="cs-overwrite" className="font-normal text-sm cursor-pointer">Sobrescrever duplicatas</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Resultado da Importacao
                <Button variant="ghost" size="sm" className="ml-auto h-6 text-xs" onClick={() => handleCopy(result)}>
                  <Copy className="h-3 w-3 mr-1" />
                  {copied ? "Copiado" : "Copiar"}
                </Button>
              </div>
              <div className="bg-gray-50 rounded-md p-3 text-sm space-y-1 font-mono text-gray-700 whitespace-pre-wrap">
                {resultText(result)}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {!result ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={importing}>
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={!fileContent || importing}>
                {importing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {importing ? "Importando..." : "Confirmar Importacao"}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>Fechar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
