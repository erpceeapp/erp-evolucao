import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { FileText, Download, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"

async function getMatriculasRelatorio() {
  const supabase = await createServerClient()

  // Usar a view vw_alunos_matriculados que já tem as informações combinadas
  const { data: matriculas, error: matriculasError } = await supabase
    .from("vw_alunos_matriculados")
    .select("matricula_id, nome_completo, numero_matricula, turma_nome, serie, turno, ano_letivo, status_matricula")
    .order("nome_completo", { ascending: true })

  if (matriculasError) {
    console.error("[v0] Erro ao buscar matrículas:", matriculasError)
    return []
  }

  return matriculas || []
}

export default async function RelatorioMatriculasPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const matriculas = await getMatriculasRelatorio()

  const ativas = matriculas.filter((m) => m.status_matricula === "ativa").length
  const inativas = matriculas.filter((m) => m.status_matricula !== "ativa").length

  return (
    <>
      <PageHeader
        icon={FileText}
        title="Relatório de Matrículas"
        subtitle="Matrículas por período, turma e status"
        backHref="/relatorios"
      />
      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Relatorios", href: "/relatorios" },
          { label: "Matriculas" },
        ]}
        className="mt-2"
      />
      <div className="flex items-center justify-between">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{matriculas.length}</div>
                <p className="text-sm text-gray-600">Total de Matrículas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{ativas}</div>
                <p className="text-sm text-gray-600">Matrículas Ativas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-gray-400">{inativas}</div>
                <p className="text-sm text-gray-600">Matrículas Inativas</p>
              </CardContent>
            </Card>
          </div>
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
              <CardTitle>Lista de Matrículas ({matriculas.length})</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input placeholder="Buscar matrícula..." className="pl-10 w-64" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Matrícula</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Série</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Ano Letivo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matriculas.map((matricula) => (
                  <TableRow key={matricula.matricula_id}>
                    <TableCell className="font-medium">{matricula.numero_matricula || "-"}</TableCell>
                    <TableCell>{matricula.nome_completo}</TableCell>
                    <TableCell>{matricula.turma_nome}</TableCell>
                    <TableCell>{matricula.serie}</TableCell>
                    <TableCell className="capitalize">{matricula.turno}</TableCell>
                    <TableCell>{matricula.ano_letivo}</TableCell>
                    <TableCell>
                      <Badge variant={matricula.status_matricula === "ativa" ? "default" : "secondary"}>
                        {matricula.status_matricula || "Pendente"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </>
  )
}
