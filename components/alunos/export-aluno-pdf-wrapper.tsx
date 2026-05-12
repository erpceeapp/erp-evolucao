"use client"

import dynamic from "next/dynamic"
import type { Database } from "@/types/supabase"

type Aluno = Database["public"]["Tables"]["alunos"]["Row"]

// Import dinâmico com ssr: false para evitar problemas com jsPDF no servidor
const ExportAlunoPDFButton = dynamic(
  () => import("@/components/alunos/export-aluno-pdf-button").then((mod) => mod.ExportAlunoPDFButton),
  { 
    ssr: false,
    loading: () => null
  }
)

interface ExportAlunoPDFWrapperProps {
  aluno: Aluno
}

export function ExportAlunoPDFWrapper({ aluno }: ExportAlunoPDFWrapperProps) {
  return <ExportAlunoPDFButton aluno={aluno} />
}
