import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { NotasTurmasTable } from "@/components/notas/notas-turmas-table"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Suspense } from "react"
import { sanitizeSearchParam, validatePageParam, validateLimitParam } from "@/lib/validate-params"
import { getProfessorFilter } from "@/lib/professor-filter"

interface SearchParams {
  busca?: string
  ano?: string
  page?: string
  limit?: string
}

export default async function NotasPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const busca = sanitizeSearchParam(params.busca)
  const ano = sanitizeSearchParam(params.ano) || String(new Date().getFullYear())
  const page = validatePageParam(params.page)
  const itemsPerPage = validateLimitParam(params.limit)

  let query = supabase
    .from("turmas")
    .select("id, nome, serie, turno, ano_letivo", { count: "exact" })
    .eq("ativo", true)
    .order("nome")

  if (busca) {
    query = query.ilike("nome", `%${busca}%`)
  }

  if (ano) {
    query = query.eq("ano_letivo", Number.parseInt(ano))
  }

  const filter = await getProfessorFilter()
  if (filter.isProfessor) {
    if (filter.turmaIds.length > 0) {
      query = query.in("id", filter.turmaIds)
    } else {
      query = query.in("id", [])
    }
  }

  const from = (page - 1) * itemsPerPage
  const to = from + itemsPerPage - 1
  query = query.range(from, to)

  const { data: turmas, count } = await query

  if (!turmas || turmas.length === 0) {
    return (
      <>
        <PageHeader
          icon={GraduationCap}
          title="Gestao de Notas"
          subtitle="Selecione uma turma e disciplina para lancar notas"
          backHref="/dashboard"
        />
        <BreadcrumbNav
          items={[
            { label: "Inicio", href: "/dashboard" },
            { label: "Notas" },
          ]}
          className="mt-2"
        />
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma turma encontrada</h3>
            <p className="text-gray-600">Cadastre turmas e vincule disciplinas para comecar a lancar notas.</p>
          </CardContent>
        </Card>
      </>
    )
  }

  const turmaIds = turmas.map((t) => t.id)

  const [tdResult, matResult] = await Promise.all([
    supabase
      .from("turma_disciplinas")
      .select("id, turma_id, disciplina_id")
      .in("turma_id", turmaIds),
    supabase
      .from("matriculas")
      .select("turma_id")
      .in("turma_id", turmaIds)
      .eq("status", "ativa"),
  ])

  const turmaDisciplinas = tdResult.data || []
  const matriculas = matResult.data || []

  const disciplinaIds = [...new Set(turmaDisciplinas.map((td) => td.disciplina_id))]

  const { data: disciplinas } = await supabase
    .from("disciplinas")
    .select("id, nome, codigo")
    .in("id", disciplinaIds)

  const disciplinasMap = new Map(disciplinas?.map((d) => [d.id, d]) || [])

  const turmasComDados = turmas.map((turma) => {
    const disciplinasDaTurma = turmaDisciplinas
      .filter((td) => td.turma_id === turma.id)
      .map((td) => disciplinasMap.get(td.disciplina_id))
      .filter((d): d is NonNullable<typeof d> => !!d)

    const totalAlunos = matriculas.filter((m) => m.turma_id === turma.id).length

    return { ...turma, disciplinas: disciplinasDaTurma, totalAlunos }
  })

  const totalPages = Math.ceil((count || 0) / itemsPerPage)

  return (
    <>
      <PageHeader
        icon={GraduationCap}
        title="Gestao de Notas"
          subtitle="Selecione uma turma e disciplina para lancar notas"
          backHref="/dashboard"
        />
      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Notas" },
        ]}
        className="mt-2"
      />

      <Card>
        <CardHeader>
          <CardTitle>Turmas</CardTitle>
          <CardDescription>
            {count ? `${count} turma${count !== 1 ? "s" : ""} encontrada${count !== 1 ? "s" : ""}` : "Nenhuma turma encontrada"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-center py-8 text-gray-500">Carregando turmas...</div>}>
            <NotasTurmasTable
              turmas={turmasComDados}
              currentPage={page}
              totalPages={totalPages}
              pageSize={itemsPerPage}
              totalCount={count || 0}
              busca={busca}
              ano={ano}
            />
          </Suspense>
        </CardContent>
      </Card>
    </>
  )
}
