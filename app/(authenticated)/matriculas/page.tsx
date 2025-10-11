import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { MatriculasHeader } from "@/components/matriculas/matriculas-header"
import { MatriculasTable } from "@/components/matriculas/matriculas-table"
import { Suspense } from "react"

interface SearchParams {
  busca?: string
  status?: string
  ano?: string
  turma?: string
  page?: string
}

export default async function MatriculasPage({
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
  const ano = searchParams.ano || ""
  const turma = searchParams.turma || ""
  const page = Number.parseInt(searchParams.page || "1")
  const itemsPerPage = 10

  let query = supabase
    .from("matriculas")
    .select(
      `
      *,
      aluno:alunos!matriculas_aluno_id_fkey(nome_completo, cpf),
      turma:turmas!matriculas_turma_id_fkey(nome, serie, ano_letivo)
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })

  // Aplicar filtros
  if (busca) {
    query = query.or(`numero_matricula.ilike.%${busca}%`)
  }

  if (status !== "todos") {
    query = query.eq("status", status)
  }

  if (ano) {
    query = query.eq("ano_letivo", Number.parseInt(ano))
  }

  // Paginação
  const from = (page - 1) * itemsPerPage
  const to = from + itemsPerPage - 1
  query = query.range(from, to)

  const { data: matriculas, count, error: matriculasError } = await query

  if (matriculasError) {
    console.error("Erro ao buscar matrículas:", matriculasError)
  }

  // Buscar turmas para filtro
  const { data: turmas } = await supabase.from("turmas").select("id, nome, serie").eq("ativo", true).order("nome")

  const totalPages = Math.ceil((count || 0) / itemsPerPage)

  return (
    <div className="min-h-screen bg-gray-50">
      <MatriculasHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sistema de Matrículas</h1>
            <p className="text-gray-600 mt-1">Gerencie matrículas, transferências e rematrículas</p>
          </div>
          <Button asChild>
            <Link href="/matriculas/nova">
              <Plus className="h-4 w-4 mr-2" />
              Nova Matrícula
            </Link>
          </Button>
        </div>

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
                busca={busca}
                status={status}
                ano={ano}
                turma={turma}
              />
            </Suspense>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
