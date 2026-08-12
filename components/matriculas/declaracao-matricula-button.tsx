"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollText } from "lucide-react"
import { toast } from "sonner"

interface DeclaracaoMatriculaButtonProps {
  escola: {
    nome: string | null
    cnpj: string | null
    endereco: string | null
    telefone: string | null
    email: string | null
  }
  aluno: {
    nome_completo: string
    cpf: string | null
    data_nascimento: string | null
  }
  turma: {
    nome: string
    serie: string | null
    turno: string | null
  }
  numero_matricula: string
  ano_letivo: number
}

export function DeclaracaoMatriculaButton({
  escola,
  aluno,
  turma,
  numero_matricula,
  ano_letivo,
}: DeclaracaoMatriculaButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    try {
      setIsGenerating(true)
      const { generateDeclaracaoMatriculaPDF } = await import("@/lib/declaracao-matricula-pdf")
      await generateDeclaracaoMatriculaPDF({
        escola,
        aluno,
        turma,
        numero_matricula,
        ano_letivo,
      })
      toast.success("Declaracao de matricula gerada com sucesso")
    } catch {
      toast.error("Erro ao gerar a declaracao de matricula")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleGenerate} disabled={isGenerating}>
      <ScrollText className="h-4 w-4 mr-2" />
      {isGenerating ? "Gerando..." : "Declaracao"}
    </Button>
  )
}
