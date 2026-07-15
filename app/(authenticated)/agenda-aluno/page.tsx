import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookUser } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { AgendaAlunoTable } from "@/components/agenda-aluno/agenda-aluno-table"
import { sanitizeSearchParam, validatePageParam, validateLimitParam } from "@/lib/validate-params"
import { getProfessorFilter } from "@/lib/professor-filter"

interface SearchParams {
  busca?: string
  turma?: string
  page?: string
  limit?: string
}

interface AlunoComTurma {
  id: string
  nome_completo: string
  cpf: string | null
  turma_id: string | null
  turma_nome: string | null
}

export default async function AgendaAlunoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const busca = sanitizeSearchParam(params.busca)
  const turmaFilter = sanitizeSearchParam(params.turma)
  const page = validatePageParam(params.page)
  const itemsPerPage = validateLimitParam(params.limit)

  // Buscar todas as turmas para o dropdown e lookup
  const filter = await getProfessorFilter()

  let turmasQuery = supabase
    .from("turmas")
    .select("id, nome")
    .eq("ativo", true)
    .order("nome")

  if (filter.isProfessor) {
    if (filter.turmaIds.length > 0) {
      turmasQuery = turmasQuery.in("id", filter.turmaIds)
    } else {
      turmasQuery = turmasQuery.in("id", [])
    }
  }

  const { data: allTurmas } = await turmasQuery

  const turmas = allTurmas || []
  const turmaMap = new Map(turmas.map((t) => [t.id, t.nome]))

  const from = (page - 1) * itemsPerPage
  const to = from + itemsPerPage - 1

  // ── Query única com INNER JOIN via !inner ────────────────────────────────
  // O !inner força exclusão de alunos sem matrícula ativa correspondente
  let query = supabase
    .from("alunos")
    .select(
      `id, nome_completo, cpf,
       matriculas!inner!matriculas_aluno_id_fkey(turma_id)`,
      { count: "exact" },
    )
    .eq("ativo", true)
    .eq("matriculas.status", "ativa")

  if (turmaFilter && turmaFilter !== "todos") {
    query = query.eq("matriculas.turma_id", turmaFilter)
  }

  if (busca) {
    query = query.or(`nome_completo.ilike.%${busca}%,cpf.ilike.%${busca}%`)
  }

  const { data: alunosData, count } = await query
    .order("nome_completo")
    .range(from, to)

  const totalCount = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage))

  // ── Montar estrutura final com nome da turma ────────────────────────────
  interface AlunoRaw {
    id: string
    nome_completo: string
    cpf: string | null
    matriculas: { turma_id: string }[]
  }

  const paginatedAlunos: AlunoComTurma[] = ((alunosData as unknown as AlunoRaw[]) || []).map((a) => {
    const turmaId = a.matriculas?.[0]?.turma_id ?? null
    return {
      id: a.id,
      nome_completo: a.nome_completo,
      cpf: a.cpf,
      turma_id: turmaId,
      turma_nome: turmaId ? (turmaMap.get(turmaId) ?? null) : null,
    }
  })

  return (
    <>
      <PageHeader
        icon={BookUser}
        title="Agenda do Aluno"
        subtitle="Registre avisos, ocorrências e comunicados individuais para os alunos"
        backHref="/dashboard"
      />

      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Agenda do Aluno" },
        ]}
        className="mt-2"
      />

      <Card>
        <CardHeader>
          <CardTitle>Lista de Alunos</CardTitle>
          <CardDescription>
            {totalCount
              ? `${totalCount} aluno${totalCount !== 1 ? "s" : ""} encontrado${totalCount !== 1 ? "s" : ""}`
              : "Nenhum aluno encontrado"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AgendaAlunoTable
            alunos={paginatedAlunos}
            turmas={turmas}
            currentPage={page}
            totalPages={totalPages}
            pageSize={itemsPerPage}
            totalCount={totalCount}
            busca={busca}
            turmaFilter={turmaFilter}
            isProfessor={filter.isProfessor}
          />
        </CardContent>
      </Card>
    </>
  )
}
