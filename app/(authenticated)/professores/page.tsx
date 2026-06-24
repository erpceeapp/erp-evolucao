import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, GraduationCap } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { ProfessoresTable } from "@/components/professores/professores-table"
import { Suspense } from "react"
import { sanitizeSearchParam, validatePageParam, validateLimitParam } from "@/lib/validate-params"

interface SearchParams {
  busca?: string
  status?: string
  page?: string
  limit?: string
}

export default async function ProfessoresPage({
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

  // Query para buscar professores
  let query = supabase.from("professores").select("*", { count: "exact" }).order("nome_completo")

  // Aplicar filtros
  if (busca) {
    query = query.or(
      `nome_completo.ilike.%${busca}%,cpf.ilike.%${busca}%,email.ilike.%${busca}%,formacao.ilike.%${busca}%`,
    )
  }

  if (status !== "todos") {
    query = query.eq("ativo", status === "ativo")
  }

  // Paginação
  const from = (page - 1) * itemsPerPage
  const to = from + itemsPerPage - 1
  query = query.range(from, to)

  const { data: professores, count, error: professoresError } = await query

  if (professoresError) {
    console.error("Erro ao buscar professores:", professoresError)
  }

  const totalPages = Math.ceil((count || 0) / itemsPerPage)

  return (
    <>
      <PageHeader
        icon={GraduationCap}
        title="Professores"
        description="Gerencie o cadastro de professores da escola"
        showBackButton={false}
        actions={
          <Button asChild>
            <Link href="/professores/novo">
              <Plus className="h-4 w-4 mr-2" />
              Novo Professor
            </Link>
          </Button>
        }
      />

        <Card>
          <CardHeader>
            <CardTitle>Lista de Professores</CardTitle>
            <CardDescription>
              {count
                ? `${count} professor${count !== 1 ? "es" : ""} encontrado${count !== 1 ? "s" : ""}`
                : "Nenhum professor encontrado"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="text-center py-8 text-gray-500">Carregando professores...</div>}>
              <ProfessoresTable
                professores={professores || []}
                currentPage={page}
                totalPages={totalPages}
                pageSize={itemsPerPage}
                totalCount={count || 0}
                busca={busca}
                status={status}
              />
            </Suspense>
          </CardContent>
        </Card>
    </>
  )
}
