import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { UsuariosTable } from "@/components/usuarios/usuarios-table"
import { sanitizeSearchParam, validatePageParam, validateLimitParam } from "@/lib/validate-params"

interface SearchParams {
  busca?: string
  tipo?: string
  sortBy?: string
  sortOrder?: string
  page?: string
  limit?: string
}

const ALLOWED_ROLES = ["admin", "diretor", "coordenacao", "secretaria"]

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tipo_usuario")
    .eq("id", user.id)
    .single()

  if (!profile || !ALLOWED_ROLES.includes(profile.tipo_usuario)) {
    redirect("/dashboard")
  }

  const params = await searchParams
  const busca = sanitizeSearchParam(params.busca)
  const tipo = sanitizeSearchParam(params.tipo)
  const sortBy = sanitizeSearchParam(params.sortBy) || "nome_completo"
  const sortOrder = sanitizeSearchParam(params.sortOrder) || "asc"
  const page = validatePageParam(params.page)
  const itemsPerPage = validateLimitParam(params.limit)

  const validSortColumns = ["nome_completo", "email", "tipo_usuario", "created_at"]
  const finalSortBy = validSortColumns.includes(sortBy) ? sortBy : "nome_completo"
  const finalSortOrder = sortOrder === "desc" ? false : true

  let query = supabase
    .from("profiles")
    .select("id, nome_completo, email, tipo_usuario, created_at", { count: "exact" })
    .order(finalSortBy, { ascending: finalSortOrder })

  if (profile.tipo_usuario !== "admin") {
    query = query.neq("tipo_usuario", "admin")
  }

  if (busca) {
    query = query.or(`nome_completo.ilike.%${busca}%,email.ilike.%${busca}%`)
  }

  if (tipo && tipo !== "todos") {
    query = query.eq("tipo_usuario", tipo)
  }

  const from = (page - 1) * itemsPerPage
  const to = from + itemsPerPage - 1
  query = query.range(from, to)

  const { data: usuarios, count, error: usuariosError } = await query

  if (usuariosError) {
    console.error("Erro ao buscar usuarios:", usuariosError)
  }

  const totalPages = Math.ceil((count || 0) / itemsPerPage)

  const showCreateButton = ["admin", "diretor", "coordenacao", "secretaria"].includes(profile.tipo_usuario)

  return (
    <>
      <PageHeader
        icon={Users}
        title="Usuários"
        description="Gerencie os usuários que têm acesso ao sistema"
        actions={
          showCreateButton ? (
            <Button asChild>
              <Link href="/usuarios/novo">
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Link>
            </Button>
          ) : undefined
        }
      />
      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Usuarios" },
        ]}
        className="mt-2"
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Usuários do Sistema</CardTitle>
            <CardDescription>
              {count
                ? `${count} usuário${count !== 1 ? "s" : ""} encontrado${count !== 1 ? "s" : ""}`
                : "Nenhum usuário encontrado"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UsuariosTable
              usuarios={usuarios || []}
              currentPage={page}
              totalPages={totalPages}
              pageSize={itemsPerPage}
              totalCount={count || 0}
              busca={busca}
              tipo={tipo}
              sortBy={finalSortBy}
              sortOrder={sortOrder}
              currentUserTipo={profile.tipo_usuario}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
