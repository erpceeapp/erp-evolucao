"use client"

import { Button } from "@/components/ui/button"
import { FileDown } from 'lucide-react'
import type { Database } from "@/types/supabase"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

type Aluno = Database["public"]["Tables"]["alunos"]["Row"]

type NotasDisciplina = {
  nome: string
  codigo: string
  notas: {
    1?: number
    2?: number
    3?: number
    4?: number
  }
  media: string
}

interface ExportAlunoPDFButtonProps {
  aluno: Aluno
  includeNotas?: boolean
}

export function ExportAlunoPDFButton({ aluno, includeNotas = true }: ExportAlunoPDFButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const fetchNotas = async (): Promise<NotasDisciplina[]> => {
    const supabase = createClient()

    // Buscar matriculas do aluno
    const { data: matriculas } = await supabase
      .from("matriculas")
      .select("id, turma_id, status")
      .eq("aluno_id", aluno.id)

    const matriculasAtivas = (matriculas || []).filter(
      (m) => m.status !== "cancelado" && m.status !== "cancelada" && m.status !== "inativo" && m.status !== "inativa"
    )

    if (matriculasAtivas.length === 0) return []

    const turmaIds = matriculasAtivas.map((m) => m.turma_id)

    // Buscar turma_disciplinas
    const { data: turmaDisciplinas } = await supabase
      .from("turma_disciplinas")
      .select("disciplina_id")
      .in("turma_id", turmaIds)

    if (!turmaDisciplinas || turmaDisciplinas.length === 0) return []

    const disciplinaIds = [...new Set(turmaDisciplinas.map((td) => td.disciplina_id))]

    // Buscar disciplinas
    const { data: disciplinas } = await supabase
      .from("disciplinas")
      .select("id, nome, codigo")
      .in("id", disciplinaIds)

    // Buscar notas
    const matriculaIds = matriculasAtivas.map((m) => m.id)
    const { data: notas } = await supabase
      .from("notas")
      .select("disciplina_id, bimestre, nota")
      .in("matricula_id", matriculaIds)

    // Organizar notas por disciplina
    return (disciplinas || []).map((disciplina) => {
      const notasDisciplina = (notas || []).filter((n) => n.disciplina_id === disciplina.id)

      const notasPorBimestre: { 1?: number; 2?: number; 3?: number; 4?: number } = {}
      notasDisciplina.forEach((n) => {
        if (n.bimestre >= 1 && n.bimestre <= 4) {
          notasPorBimestre[n.bimestre as 1 | 2 | 3 | 4] = Number(n.nota)
        }
      })

      const notasValidas = notasDisciplina.filter((n) => n.nota != null).map((n) => Number(n.nota))
      const media = notasValidas.length > 0 
        ? (notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length).toFixed(2) 
        : "-"

      return {
        nome: disciplina.nome,
        codigo: disciplina.codigo,
        notas: notasPorBimestre,
        media,
      }
    })
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      
      let notas: NotasDisciplina[] | undefined
      if (includeNotas) {
        notas = await fetchNotas()
      }

      const { generateAlunoPDF } = await import("@/lib/pdf-generator")
      await generateAlunoPDF(aluno, notas)
      
      toast({
        title: "PDF exportado com sucesso",
        description: "O documento foi baixado para seu computador.",
      })
    } catch (error) {
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
