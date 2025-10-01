import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { ProfessoresHeader } from "@/components/professores/professores-header"
import { ProfessoresTable } from "@/components/professores/professores-table"
import { Suspense } from "react"

interface SearchParams {
  busca?: string
  status?: string
  page?: string
}

export default async function ProfessoresPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Parâmetros de busca
  const busca = searchParams.busca || ""
  const status = searchParams.status || "todos"
  const page = Number.parseInt(searchParams.page || "1")
  const itemsPerPage = 10

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
    <div className="min-h-screen bg-gray-50">
      <ProfessoresHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Professores</h1>
            <p className="text-gray-600 mt-1">Gerencie o cadastro de professores da escola</p>
          </div>
          <Button asChild>
            <Link href="/professores/novo">
              <Plus className="h-4 w-4 mr-2" />
              Novo Professor
            </Link>
          </Button>
        </div>

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
