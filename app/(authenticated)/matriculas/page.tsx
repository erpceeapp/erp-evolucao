import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, UserCheck } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { MatriculasTable } from "@/components/matriculas/matriculas-table"
import { Suspense } from "react"
import { sanitizeSearchParam, validatePageParam, validateLimitParam } from "@/lib/validate-params"

interface SearchParams {
  busca?: string
  status?: string
  page?: string
  ano?: string
  turma?: string
  limit?: string
}

export default async function MatriculasPage({
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
  const status = sanitizeSearchParam(params.status) || "ativa"
  const ano = sanitizeSearchParam(params.ano)
  const turma = sanitizeSearchParam(params.turma)
  const page = validatePageParam(params.page)
  const itemsPerPage = validateLimitParam(params.limit)

  let query = supabase
    .from("matriculas")
    .select(
      `
      id, numero_matricula, status, data_matricula, ano_letivo, created_at,
      aluno:alunos!matriculas_aluno_id_fkey(nome_completo, cpf),
      turma:turmas!matriculas_turma_id_fkey(nome, serie, ano_letivo)
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })

  // Aplicar filtros
  if (busca) {
    // Buscar alunos por nome ou CPF para filtrar as matrículas por aluno_id
    const { data: alunosBusca } = await supabase
      .from("alunos")
      .select("id")
      .or(`nome_completo.ilike.%${busca}%,cpf.ilike.%${busca}%`)

    const alunoIds = (alunosBusca || []).map((a) => a.id)

    if (alunoIds.length > 0) {
      query = query.or(
        `numero_matricula.ilike.%${busca}%,aluno_id.in.(${alunoIds.join(",")})`,
      )
    } else {
      query = query.or(`numero_matricula.ilike.%${busca}%`)
    }
  }

  if (status !== "todos") {
    query = query.eq("status", status)
  }

  if (ano) {
    query = query.eq("ano_letivo", Number.parseInt(ano))
  }

  if (turma) {
    query = query.eq("turma_id", turma)
  }

  // Paginação
  const from = (page - 1) * itemsPerPage
  const to = from + itemsPerPage - 1
  query = query.range(from, to)

  const { data: matriculas, count, error: matriculasError } = await (query as any)

  if (matriculasError) {
    console.error("Erro ao buscar matrículas:", matriculasError)
  }

  // Buscar turmas para filtro
  const { data: turmas } = await supabase.from("turmas").select("id, nome, serie").eq("ativo", true).order("nome")

  const totalPages = Math.ceil((count || 0) / itemsPerPage)

  return (
    <>
      <PageHeader
        icon={UserCheck}
        title="Matrículas"
        description="Gerencie matrículas, transferências e rematrículas"
        showBackButton={false}
        actions={
          <Button asChild>
            <Link href="/matriculas/nova">
              <Plus className="h-4 w-4 mr-2" />
              Nova Matrícula
            </Link>
          </Button>
        }
      />

      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Matriculas" },
        ]}
        className="mt-2"
      />

        <Card>
          <CardHeader>
            <CardTitle>Lista de Matrículas</CardTitle>
            <CardDescription>
              {count
                ? `${count} matrícula${count !== 1 ? "s" : ""} encontrada${count !== 1 ? "s" : ""}`
                : "Nenhuma matrícula encontrada"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="text-center py-8 text-gray-500">Carregando matrículas...</div>}>
              <MatriculasTable
                matriculas={matriculas || []}
                turmas={turmas || []}
                currentPage={page}
                totalPages={totalPages}
                pageSize={itemsPerPage}
                totalCount={count || 0}
                busca={busca}
                status={status}
                ano={ano}
                turma={turma}
              />
            </Suspense>
          </CardContent>
        </Card>
    </>
  )
}
