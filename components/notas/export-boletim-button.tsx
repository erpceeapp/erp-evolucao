"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import { toast } from "sonner"

type Disciplina = {
  id: string
  nome: string
  codigo: string
  notas: {
    1?: { nota: number }
    2?: { nota: number }
    3?: { nota: number }
    4?: { nota: number }
  }
  media: string
}

type AlunoBoletim = {
  nome_completo: string
  matricula: string | null
  nivel: string | null
  turma?: string
  ano_letivo?: number
}

type EscolaInfo = {
  nome: string
  endereco?: string
  telefone?: string
  email?: string
}

interface ExportBoletimButtonProps {
  aluno: AlunoBoletim
  disciplinas: Disciplina[]
  escola?: EscolaInfo | null
  variant?: "default" | "outline" | "secondary" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function ExportBoletimButton({
  aluno,
  disciplinas,
  escola,
  variant = "outline",
  size = "default",
  className,
}: ExportBoletimButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (disciplinas.length === 0) {
      toast.error("Nao ha disciplinas para gerar o boletim")
      return
    }

    try {
      setIsExporting(true)
      const { generateBoletimPDF } = await import("@/lib/boletim-pdf-generator")
      await generateBoletimPDF(aluno, disciplinas, escola)
      toast.success("Boletim exportado com sucesso!")
    } catch (error) {
      toast.error("Erro ao exportar boletim. Tente novamente.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting || disciplinas.length === 0}
      variant={variant}
      size={size}
      className={className}
    >
      <FileDown className="h-4 w-4 mr-2" />
      {isExporting ? "Gerando..." : "Baixar Boletim"}
    </Button>
  )
}
