"use client"

import { Button } from "@/components/ui/button"
import { FileDown } from 'lucide-react'
import { generateAlunoPDF } from "@/lib/pdf-generator"
import type { Database } from "@/types/supabase"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

type Aluno = Database["public"]["Tables"]["alunos"]["Row"]

interface ExportAlunoPDFButtonProps {
  aluno: Aluno
}

export function ExportAlunoPDFButton({ aluno }: ExportAlunoPDFButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    try {
      setIsExporting(true)
      await generateAlunoPDF(aluno)
      toast({
        title: "PDF exportado com sucesso",
        description: "O documento foi baixado para seu computador.",
      })
    } catch (error) {
      console.error("Erro ao exportar PDF:", error)
      toast({
        title: "Erro ao exportar PDF",
        description: "Ocorreu um erro ao gerar o documento. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button onClick={handleExport} disabled={isExporting} variant="outline">
      <FileDown className="h-4 w-4 mr-2" />
      {isExporting ? "Exportando..." : "Exportar PDF"}
    </Button>
  )
}
