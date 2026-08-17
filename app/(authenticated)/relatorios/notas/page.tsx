import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BarChart3, Download, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"

async function getNotasRelatorio() {
  const supabase = await createServerClient()

  // Usar a view vw_notas_alunos que já tem as informações combinadas
  const { data: notas, error: notasError } = await supabase
    .from("vw_notas_alunos")
    .select("aluno_nome, turma_nome, disciplina_codigo, disciplina_nome, bimestre, tipo_avaliacao, nota, data_avaliacao")
    .order("aluno_nome", { ascending: true })
    .order("bimestre", { ascending: true })

  if (notasError) {
    console.error("[v0] Erro ao buscar notas:", notasError)
    return []
  }

  return notas || []
}

export default async function RelatorioNotasPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const notas = await getNotasRelatorio()

  return (
    <>
      <PageHeader
        icon={BarChart3}
        title="Relatório de Notas"
        subtitle="Desempenho acadêmico dos alunos"
        backHref="/relatorios"
      />
      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Relatorios", href: "/relatorios" },
          { label: "Notas" },
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
              <CardTitle>Notas por Aluno ({notas.length} registros)</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input placeholder="Buscar aluno..." className="pl-10 w-64" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead className="text-center">Bimestre</TableHead>
                  <TableHead className="text-center">Tipo Avaliação</TableHead>
                  <TableHead className="text-center">Nota</TableHead>
                  <TableHead className="text-center">Data</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notas.map((nota, idx) => {
                  const notaValor = Number(nota.nota || 0)
                  let statusVariant: "default" | "destructive" | "secondary" = "default"
                  let statusText = "Aprovado"

                  if (notaValor < 6) {
                    statusVariant = "destructive"
                    statusText = "Reprovado"
                  } else if (notaValor < 7) {
                    statusVariant = "secondary"
                    statusText = "Recuperação"
                  }

                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{nota.aluno_nome}</TableCell>
                      <TableCell>{nota.turma_nome}</TableCell>
                      <TableCell>
                        {nota.disciplina_codigo} - {nota.disciplina_nome}
                      </TableCell>
                      <TableCell className="text-center">{nota.bimestre}º</TableCell>
                      <TableCell className="text-center capitalize">{nota.tipo_avaliacao || "-"}</TableCell>
                      <TableCell className="text-center font-bold text-lg">{notaValor.toFixed(1)}</TableCell>
                      <TableCell className="text-center">
                        {nota.data_avaliacao ? new Date(nota.data_avaliacao).toLocaleDateString("pt-BR") : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant}>{statusText}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
