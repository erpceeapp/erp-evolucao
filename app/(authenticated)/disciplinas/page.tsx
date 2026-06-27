import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft, Book } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { DisciplinasTable } from "@/components/disciplinas/disciplinas-table"
import { Suspense } from "react"
import { sanitizeSearchParam, validatePageParam, validateLimitParam } from "@/lib/validate-params"

interface SearchParams {
  busca?: string
  status?: string
  sortBy?: string
  sortOrder?: string
  page?: string
  limit?: string
}

export default async function DisciplinasPage({
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
  const status = sanitizeSearchParam(params.status) || "ativo"
  const page = validatePageParam(params.page)
  const itemsPerPage = validateLimitParam(params.limit)
  const sortBy = sanitizeSearchParam(params.sortBy) || "nome"
  const sortOrder = sanitizeSearchParam(params.sortOrder) || "asc"

  const validSortColumns = ["nome", "codigo", "carga_horaria", "professor", "ativo"]
  const finalSortBy = validSortColumns.includes(sortBy) ? sortBy : "nome"
  const finalSortOrder = sortOrder === "desc" ? false : true

  // Query para buscar disciplinas
  let query = supabase.from("disciplinas").select("*, professores(id, nome_completo)", { count: "exact" })

  if (finalSortBy === "professor") {
    query = query.order("professores(nome_completo)", { ascending: finalSortOrder, nullsFirst: false })
  } else {
    query = query.order(finalSortBy, { ascending: finalSortOrder })
  }

  // Aplicar filtros
  if (busca) {
    query = query.or(`nome.ilike.%${busca}%,codigo.ilike.%${busca}%,descricao.ilike.%${busca}%`)
  }

  if (status !== "todos") {
    query = query.eq("ativo", status === "ativo")
  }

  // Paginação
  const from = (page - 1) * itemsPerPage
  const to = from + itemsPerPage - 1
  query = query.range(from, to)

  const { data: disciplinas, count, error: disciplinasError } = await query

  if (disciplinasError) {
    console.error("Erro ao buscar disciplinas:", disciplinasError)
  }

  const totalPages = Math.ceil((count || 0) / itemsPerPage)

  return (
    <>
      <PageHeader
        icon={Book}
        title="Disciplinas"
        description="Gerencie as disciplinas oferecidas pela escola"
        showBackButton={false}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/turmas">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Turmas
              </Link>
            </Button>
            <Button asChild>
              <Link href="/disciplinas/nova">
                <Plus className="h-4 w-4 mr-2" />
                Nova Disciplina
              </Link>
            </Button>
          </div>
        }
      />

        <Card>
          <CardHeader>
            <CardTitle>Lista de Disciplinas</CardTitle>
            <CardDescription>
              {count
                ? `${count} disciplina${count !== 1 ? "s" : ""} encontrada${count !== 1 ? "s" : ""}`
                : "Nenhuma disciplina encontrada"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="text-center py-8 text-gray-500">Carregando disciplinas...</div>}>
              <DisciplinasTable
                disciplinas={disciplinas || []}
                currentPage={page}
                totalPages={totalPages}
                pageSize={itemsPerPage}
                totalCount={count || 0}
                busca={busca}
                status={status}
                sortBy={finalSortBy}
                sortOrder={sortOrder}
              />
            </Suspense>
          </CardContent>
        </Card>
    </>
  )
}
