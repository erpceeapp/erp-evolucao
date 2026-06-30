import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, BookOpen } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { TurmasTable } from "@/components/turmas/turmas-table"
import { Suspense } from "react"
import { sanitizeSearchParam, validatePageParam, validateLimitParam } from "@/lib/validate-params"
import { getProfessorFilter } from "@/lib/professor-filter"

interface SearchParams {
  busca?: string
  ano?: string
  status?: string
  page?: string
  limit?: string
}

export default async function TurmasPage({
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

  // Parâmetros de busca
  const busca = sanitizeSearchParam(params.busca)
  const ano = sanitizeSearchParam(params.ano) || String(new Date().getFullYear())
  const status = sanitizeSearchParam(params.status) || "ativo"
  const page = validatePageParam(params.page)
  const itemsPerPage = validateLimitParam(params.limit)

  // Query para buscar turmas com professor responsável
  let query = supabase
    .from("turmas")
    .select(
      `
      *,
      professor_responsavel:professores!turmas_professor_responsavel_id_fkey(nome_completo)
    `,
      { count: "exact" },
    )
    .order("ano_letivo", { ascending: false })
    .order("nome")

  // Aplicar filtros
  if (busca) {
    query = query.or(`nome.ilike.%${busca}%,serie.ilike.%${busca}%`)
  }

  if (ano) {
    query = query.eq("ano_letivo", Number.parseInt(ano))
  }

  if (status !== "todos") {
    query = query.eq("ativo", status === "ativo")
  }

  // Paginação
  const from = (page - 1) * itemsPerPage
  const to = from + itemsPerPage - 1
  query = query.range(from, to)

  const filter = await getProfessorFilter()
  if (filter.isProfessor) {
    if (filter.turmaIds.length > 0) {
      query = query.in("id", filter.turmaIds)
    } else {
      query = query.in("id", [])
    }
  }

  const { data: turmas, count, error: turmasError } = await query

  if (turmasError) {
    console.error("Erro ao buscar turmas:", turmasError)
  }

  // Buscar quantidade de alunos matriculados ativos por turma
  const turmaIds = (turmas || []).map((t) => t.id)
  const alunosCount: Record<string, number> = {}

  if (turmaIds.length > 0) {
    const { data: counts } = await supabase
      .from("matriculas")
      .select("turma_id")
      .eq("status", "ativa")
      .in("turma_id", turmaIds)

    if (counts) {
      for (const row of counts) {
        alunosCount[row.turma_id] = (alunosCount[row.turma_id] || 0) + 1
      }
    }
  }

  const turmasComCount = (turmas || []).map((t) => ({
    ...t,
    alunos_matriculados: alunosCount[t.id] || 0,
  }))

  const totalPages = Math.ceil((count || 0) / itemsPerPage)

  return (
    <>
      <PageHeader
        icon={BookOpen}
        title="Turmas"
        description="Gerencie turmas, disciplinas e suas associações"
        showBackButton={false}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/disciplinas">
                <BookOpen className="h-4 w-4 mr-2" />
                Disciplinas
              </Link>
            </Button>
            {!filter.isProfessor && (
              <Button asChild>
                <Link href="/turmas/nova">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Turma
                </Link>
              </Button>
            )}
          </div>
        }
      />

        <Card>
          <CardHeader>
            <CardTitle>Lista de Turmas</CardTitle>
            <CardDescription>
              {count
                ? `${count} turma${count !== 1 ? "s" : ""} encontrada${count !== 1 ? "s" : ""}`
                : "Nenhuma turma encontrada"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="text-center py-8 text-gray-500">Carregando turmas...</div>}>
              <TurmasTable
                turmas={turmasComCount}
                currentPage={page}
                totalPages={totalPages}
                pageSize={itemsPerPage}
                totalCount={count || 0}
                busca={busca}
                ano={ano}
                status={status}
              />
            </Suspense>
          </CardContent>
        </Card>
    </>
  )
}
