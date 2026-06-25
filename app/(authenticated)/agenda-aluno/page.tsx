import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookUser } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { AgendaAlunoTable } from "@/components/agenda-aluno/agenda-aluno-table"
import { sanitizeSearchParam, validatePageParam, validateLimitParam } from "@/lib/validate-params"

interface SearchParams {
  busca?: string
  turma?: string
  page?: string
  limit?: string
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

  let query = supabase
    .from("alunos")
    .select(
      `
      id, nome_completo, cpf,
      matriculas!matriculas_aluno_id_fkey(
        turma_id,
        turmas!matriculas_turma_id_fkey(nome)
      )
    `,
      { count: "exact" },
    )
    .eq("ativo", true)
    .order("nome_completo")

  if (busca) {
    query = query.or(`nome_completo.ilike.%${busca}%,cpf.ilike.%${busca}%`)
  }

  if (turmaFilter) {
    query = query.eq("matriculas.turma_id", turmaFilter)
  }

  const from = (page - 1) * itemsPerPage
  const to = from + itemsPerPage - 1
  query = query.range(from, to)

  const { data: alunos, count, error: alunosError } = await query

  if (alunosError) {
    console.error("Erro ao buscar alunos:", alunosError)
  }

  const totalPages = Math.ceil((count || 0) / itemsPerPage)

  const { data: turmas } = await supabase
    .from("turmas")
    .select("id, nome")
    .order("nome")

  return (
    <>
      <PageHeader
        icon={BookUser}
        title="Agenda do Aluno"
        subtitle="Registre avisos, ocorrências e comunicados individuais para os alunos"
        backHref="/dashboard"
      />

      <Card>
        <CardHeader>
          <CardTitle>Lista de Alunos</CardTitle>
          <CardDescription>
            {count
              ? `${count} aluno${count !== 1 ? "s" : ""} encontrado${count !== 1 ? "s" : ""}`
              : "Nenhum aluno encontrado"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AgendaAlunoTable
            alunos={alunos || []}
            turmas={turmas || []}
            currentPage={page}
            totalPages={totalPages}
            pageSize={itemsPerPage}
            totalCount={count || 0}
            busca={busca}
            turmaFilter={turmaFilter}
          />
        </CardContent>
      </Card>
    </>
  )
}
