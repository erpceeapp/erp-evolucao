import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Calendar, Download, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"

async function getFrequenciaRelatorio() {
  const supabase = await createServerClient()

  // Usar a view vw_frequencia_alunos que já calcula a frequência
  const { data: frequencias, error: frequenciasError } = await supabase
    .from("vw_frequencia_alunos")
    .select("*")
    .order("aluno_nome", { ascending: true })

  if (frequenciasError) {
    console.error("[v0] Erro ao buscar frequências:", frequenciasError)
    return []
  }

  return frequencias || []
}

export default async function RelatorioFrequenciaPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const frequencias = await getFrequenciaRelatorio()

  return (
    <>
      <PageHeader
        icon={Calendar}
        title="Relatório de Frequência"
        subtitle="Frequência dos alunos por turma e disciplina"
        backHref="/relatorios"
      />
      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Relatorios", href: "/relatorios" },
          { label: "Frequencia" },
        ]}
        className="mt-2"
      />
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
              <CardTitle>Frequência por Aluno ({frequencias.length} registros)</CardTitle>
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
                  <TableHead className="text-center">Total Aulas</TableHead>
                  <TableHead className="text-center">Presenças</TableHead>
                  <TableHead className="text-center">Faltas</TableHead>
                  <TableHead className="text-center">% Frequência</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {frequencias.map((freq, idx) => {
                  const percentual = Number(freq.percentual_presenca || 0)
                  let statusVariant: "default" | "destructive" | "secondary" = "default"
                  let statusText = "Adequado"

                  if (percentual < 75) {
                    statusVariant = "destructive"
                    statusText = "Crítico"
                  } else if (percentual < 85) {
                    statusVariant = "secondary"
                    statusText = "Atenção"
                  }

                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{freq.aluno_nome}</TableCell>
                      <TableCell>{freq.turma_nome}</TableCell>
                      <TableCell>{freq.disciplina_nome}</TableCell>
                      <TableCell className="text-center">{freq.total_aulas}</TableCell>
                      <TableCell className="text-center text-green-600">{freq.presencas}</TableCell>
                      <TableCell className="text-center text-red-600">{freq.faltas}</TableCell>
                      <TableCell className="text-center font-medium">{percentual.toFixed(1)}%</TableCell>
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
    </>
  )
}
