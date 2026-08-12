import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Users } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { AlunosPorTurmaView } from "@/components/relatorios/alunos-por-turma-view"
import { sanitizeSearchParam } from "@/lib/validate-params"

interface TurmaOption {
  id: string
  nome: string
  serie: string | null
  turno: string | null
  ano_letivo: number | null
}

interface AlunoLinha {
  nome_completo: string
  matricula: string | null
  cpf: string | null
  data_nascimento: string | null
}

export default async function RelatorioAlunosPorTurmaPage({
  searchParams,
}: {
  searchParams: Promise<{ turma?: string }>
}) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const params = await searchParams
  const turmaId = sanitizeSearchParam(params.turma)

  // Turmas ativas para o seletor
  const { data: turmasData } = await supabase
    .from("turmas")
    .select("id, nome, serie, turno, ano_letivo")
    .eq("ativo", true)
    .order("ano_letivo", { ascending: false })
    .order("nome")

  const turmas: TurmaOption[] = turmasData || []

  let turmaSelecionada: TurmaOption | null = null
  let alunos: AlunoLinha[] = []

  if (turmaId) {
    turmaSelecionada = turmas.find((t) => t.id === turmaId) || null

    const { data: matriculasData } = await supabase
      .from("matriculas")
      .select(
        `
        aluno_id,
        alunos!matriculas_aluno_id_fkey(nome_completo, cpf, data_nascimento, matricula)
      `,
      )
      .eq("turma_id", turmaId)
      .eq("status", "ativa")

    alunos = (matriculasData || [])
      .map((m: any) => ({
        nome_completo: m.alunos?.nome_completo ?? "",
        matricula: m.alunos?.matricula ?? null,
        cpf: m.alunos?.cpf ?? null,
        data_nascimento: m.alunos?.data_nascimento ?? null,
      }))
      .filter((a) => a.nome_completo)
      .sort((a, b) => a.nome_completo.localeCompare(b.nome_completo, "pt-BR"))
  }

  return (
    <>
      <PageHeader
        icon={Users}
        title="Relatório de Alunos por Turma"
        subtitle="Lista de alunos matriculados em uma turma específica"
        backHref="/relatorios"
      />
      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Relatorios", href: "/relatorios" },
          { label: "Alunos por Turma" },
        ]}
        className="mt-2"
      />
      <AlunosPorTurmaView
        turmas={turmas}
        turmaSelecionadaId={turmaSelecionada?.id ?? null}
        turmaSelecionada={turmaSelecionada}
        alunos={alunos}
      />
    </>
  )
}
