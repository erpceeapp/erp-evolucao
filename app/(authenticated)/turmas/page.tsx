import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, BookOpen } from "lucide-react"
import Link from "next/link"
import { TurmasHeader } from "@/components/turmas/turmas-header"
import { TurmasTable } from "@/components/turmas/turmas-table"
import { Suspense } from "react"

interface SearchParams {
  busca?: string
  ano?: string
  status?: string
  page?: string
}

export default async function TurmasPage({
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
  const ano = searchParams.ano || ""
  const status = searchParams.status || "todos"
  const page = Number.parseInt(searchParams.page || "1")
  const itemsPerPage = 10

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

  const { data: turmas, count, error: turmasError } = await query

  if (turmasError) {
    console.error("Erro ao buscar turmas:", turmasError)
  }

  const totalPages = Math.ceil((count || 0) / itemsPerPage)

  return (
    <div className="min-h-screen bg-gray-50">
      <TurmasHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Turmas e Disciplinas</h1>
            <p className="text-gray-600 mt-1">Gerencie turmas, disciplinas e suas associações</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/disciplinas">
                <BookOpen className="h-4 w-4 mr-2" />
                Disciplinas
              </Link>
            </Button>
            <Button asChild>
              <Link href="/turmas/nova">
                <Plus className="h-4 w-4 mr-2" />
                Nova Turma
              </Link>
            </Button>
          </div>
        </div>

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
                turmas={turmas || []}
                currentPage={page}
                totalPages={totalPages}
                busca={busca}
                ano={ano}
                status={status}
              />
            </Suspense>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
