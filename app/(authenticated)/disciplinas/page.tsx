import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { TurmasHeader } from "@/components/turmas/turmas-header"
import { DisciplinasTable } from "@/components/disciplinas/disciplinas-table"
import { Suspense } from "react"

interface SearchParams {
  busca?: string
  status?: string
  page?: string
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
  const busca = params.busca || ""
  const status = params.status || "todos"
  const page = Number.parseInt(params.page || "1")
  const itemsPerPage = 10

  // Query para buscar disciplinas
  let query = supabase.from("disciplinas").select("*", { count: "exact" }).order("nome")

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
    <div className="min-h-screen bg-gray-50">
      <TurmasHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Disciplinas</h1>
            <p className="text-gray-600 mt-1">Gerencie as disciplinas oferecidas pela escola</p>
          </div>
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
        </div>

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
