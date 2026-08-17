import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Users } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { AlunosRelatorioTable, type AlunoRelatorio } from "./alunos-relatorio-table"

async function getAlunosRelatorio() {
  const supabase = await createServerClient()

  const { data: alunos, error: alunosError } = await supabase
    .from("alunos")
    .select("*")
    .order("nome_completo", { ascending: true })

  if (alunosError) {
    console.error("[v0] Erro ao buscar alunos:", alunosError)
    return []
  }

  if (!alunos || alunos.length === 0) return []

  // Buscar matrículas separadamente
  const { data: matriculas, error: matriculasError } = await supabase
    .from("matriculas")
    .select("id, aluno_id, turma_id, status")

  if (matriculasError) {
    console.error(
      "[v0] Erro ao buscar matrículas:",
      matriculasError.message,
      matriculasError.code,
      matriculasError.details,
      matriculasError.hint,
    )
  }

  const alunoIds = new Set(alunos.map((aluno) => aluno.id))
  const matriculasDosAlunos = matriculas?.filter((matricula) => alunoIds.has(matricula.aluno_id)) || []

  // Buscar turmas das matrículas
  const turmaIds = matriculasDosAlunos.map((m) => m.turma_id).filter(Boolean) || []
  let turmas: { id: string; nome: string; serie: string | null }[] = []
  if (turmaIds.length > 0) {
    const { data: turmasData, error: turmasError } = await supabase
      .from("turmas")
      .select("id, nome, serie")
      .in("id", turmaIds)

    if (turmasError) {
      console.error("[v0] Erro ao buscar turmas:", turmasError)
    } else {
      turmas = turmasData || []
    }
  }

  // Combinar os dados
  return alunos.map((aluno): AlunoRelatorio => {
    const alunoMatriculas = matriculasDosAlunos.filter((m) => m.aluno_id === aluno.id)
    const matriculasComTurma = alunoMatriculas.map((mat) => ({
      ...mat,
      turmas: turmas.find((t) => t.id === mat.turma_id),
    }))

    return {
      ...aluno,
      matriculas: matriculasComTurma,
    }
  })
}

export default async function RelatorioAlunosPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const alunos = await getAlunosRelatorio()

  return (
    <>
      <PageHeader
        icon={Users}
        title="Relatório de Alunos"
        subtitle="Lista completa de alunos cadastrados"
        backHref="/relatorios"
      />
      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Relatorios", href: "/relatorios" },
          { label: "Alunos" },
        ]}
        className="mt-2"
      />
      <div className="space-y-6">
        <AlunosRelatorioTable alunos={alunos} />
      </div>
    </>
  )
}
