import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Users, Download, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AtivoStatusBadge } from "@/components/ui/ativo-status-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"

async function getProfessoresRelatorio() {
  const supabase = await createServerClient()

  // Buscar todos os professores
  const { data: professores, error: professoresError } = await supabase
    .from("professores")
    .select("id, nome_completo, email, telefone, formacao, ativo")
    .order("nome_completo", { ascending: true })

  if (professoresError) {
    console.error("[v0] Erro ao buscar professores:", professoresError)
    return []
  }

  if (!professores || professores.length === 0) return []

  // Buscar disciplinas dos professores usando a view
  const { data: profDisciplinas, error: profDisciplinasError } = await supabase
    .from("vw_professores_disciplinas")
    .select("professor_id, disciplina_nome")

  if (profDisciplinasError) {
    console.error("[v0] Erro ao buscar disciplinas dos professores:", profDisciplinasError)
  }

  // Combinar os dados
  return professores.map((professor) => {
    const disciplinas = profDisciplinas?.filter((pd) => pd.professor_id === professor.id) || []

    return {
      ...professor,
      disciplinas,
    }
  })
}

export default async function RelatorioProfessoresPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const professores = await getProfessoresRelatorio()

  return (
    <>
      <PageHeader
        icon={Users}
        title="Relatório de Professores"
        subtitle="Lista completa de professores cadastrados"
        backHref="/relatorios"
      />
      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Relatorios", href: "/relatorios" },
          { label: "Professores" },
        ]}
        className="mt-2"
      />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Professores Cadastrados ({professores.length})</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input placeholder="Buscar professor..." className="pl-10 w-64" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Formação</TableHead>
                  <TableHead>Disciplinas</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {professores.map((professor) => (
                  <TableRow key={professor.id}>
                    <TableCell className="font-medium">{professor.nome_completo}</TableCell>
                    <TableCell>{professor.email || "-"}</TableCell>
                    <TableCell>{professor.telefone || "-"}</TableCell>
                    <TableCell>{professor.formacao || "-"}</TableCell>
                    <TableCell>
                      {professor.disciplinas.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {professor.disciplinas.slice(0, 3).map((disc: any, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {disc.disciplina_nome}
                            </Badge>
                          ))}
                          {professor.disciplinas.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{professor.disciplinas.length - 3}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <AtivoStatusBadge ativo={professor.ativo} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
