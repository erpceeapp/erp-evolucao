import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { AlunosTable } from "@/components/alunos/alunos-table"
import { Suspense } from "react"
import { sanitizeSearchParam, validatePageParam, validateLimitParam } from "@/lib/validate-params"

interface SearchParams {
  busca?: string
  status?: string
  page?: string
  limit?: string
}

export default async function AlunosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tipo_usuario")
    .eq("id", data.user.id)
    .single()

  const currentUserTipo = profile?.tipo_usuario || ""

  const params = await searchParams
  const busca = sanitizeSearchParam(params.busca)
  const status = sanitizeSearchParam(params.status) || "ativo"
  const page = validatePageParam(params.page)
  const itemsPerPage = validateLimitParam(params.limit)

  // Query para buscar alunos
  let query = supabase.from("alunos").select("*", { count: "exact" }).order("nome_completo")

  // Aplicar filtros
  if (busca) {
    query = query.or(
      `nome_completo.ilike.%${busca}%,cpf.ilike.%${busca}%,email.ilike.%${busca}%,matricula.ilike.%${busca}%`,
    )
  }

  if (status !== "todos") {
    query = query.eq("ativo", status === "ativo")
  }

  // Paginação
  const from = (page - 1) * itemsPerPage
  const to = from + itemsPerPage - 1
  query = query.range(from, to)

  const { data: alunos, count, error: alunosError } = await query

  if (alunosError) {
    console.error("Erro ao buscar alunos:", alunosError)
  }

  const totalPages = Math.ceil((count || 0) / itemsPerPage)

  return (
    <>
      <PageHeader
        icon={Users}
        title="Alunos"
        description="Gerencie o cadastro de alunos da escola"
        showBackButton={false}
        actions={
          <Button asChild>
            <Link href="/alunos/novo">
              <Plus className="h-4 w-4 mr-2" />
              Novo Aluno
            </Link>
          </Button>
        }
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
            <Suspense fallback={<div className="text-center py-8 text-gray-500">Carregando alunos...</div>}>
              <AlunosTable
                alunos={alunos || []}
                currentPage={page}
                totalPages={totalPages}
                pageSize={itemsPerPage}
                totalCount={count || 0}
                busca={busca}
                status={status}
                currentUserTipo={currentUserTipo}
              />
            </Suspense>
          </CardContent>
        </Card>
    </>
  )
}
