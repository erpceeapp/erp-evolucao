import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { AlunosHeader } from "@/components/alunos/alunos-header"
import { AlunosTable } from "@/components/alunos/alunos-table"
import { Suspense } from "react"

interface SearchParams {
  busca?: string
  status?: string
  page?: string
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

  const params = await searchParams
  const busca = params.busca || ""
  const status = params.status || "todos"
  const page = Number.parseInt(params.page || "1")
  const itemsPerPage = 10

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
    <div className="min-h-screen bg-gray-50">
      <AlunosHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Alunos</h1>
            <p className="text-gray-600 mt-1">Gerencie o cadastro de alunos da escola</p>
          </div>
          <Button asChild>
            <Link href="/alunos/novo">
              <Plus className="h-4 w-4 mr-2" />
              Novo Aluno
            </Link>
          </Button>
        </div>

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
                busca={busca}
                status={status}
              />
            </Suspense>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
