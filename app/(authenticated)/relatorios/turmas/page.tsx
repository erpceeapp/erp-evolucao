import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { FileText, Download, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AtivoStatusBadge } from "@/components/ui/ativo-status-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"

async function getTurmasRelatorio() {
  const supabase = await createServerClient()

  // Buscar todas as turmas
  const { data: turmas, error: turmasError } = await supabase
    .from("turmas")
    .select("id, nome, serie, turno, ano_letivo, capacidade_maxima, ativo")
    .order("nome", { ascending: true })

  if (turmasError) {
    console.error("[v0] Erro ao buscar turmas:", turmasError)
    return []
  }

  if (!turmas || turmas.length === 0) return []

  // Buscar disciplinas das turmas
  const { data: turmaDisciplinas, error: turmaDisciplinasError } = await supabase
    .from("turma_disciplinas")
    .select("turma_id, disciplina_id, disciplinas(nome, codigo)")
    .in(
      "turma_id",
      turmas.map((t) => t.id),
    )

  if (turmaDisciplinasError) {
    console.error("[v0] Erro ao buscar disciplinas das turmas:", turmaDisciplinasError)
  }

  // Buscar matrículas das turmas
  const { data: matriculas, error: matriculasError } = await supabase
    .from("matriculas")
    .select("turma_id, status")
    .in(
      "turma_id",
      turmas.map((t) => t.id),
    )

  if (matriculasError) {
    console.error("[v0] Erro ao buscar matrículas:", matriculasError)
  }

  // Combinar os dados
  return turmas.map((turma) => {
    const disciplinas = turmaDisciplinas?.filter((td) => td.turma_id === turma.id) || []
    const turmaMatriculas = matriculas?.filter((m) => m.turma_id === turma.id) || []
    const matriculasAtivas = turmaMatriculas.filter((m) => m.status === "ativa").length

    return {
      ...turma,
      disciplinas,
      total_alunos: matriculasAtivas,
    }
  })
}

export default async function RelatorioTurmasPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const turmas = await getTurmasRelatorio()

  return (
    <>
      <PageHeader
        icon={FileText}
        title="Relatório de Turmas"
        subtitle="Informações das turmas e disciplinas"
        backHref="/relatorios"
      />
      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Relatorios", href: "/relatorios" },
          { label: "Turmas" },
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
              <CardTitle>Turmas Cadastradas ({turmas.length})</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input placeholder="Buscar turma..." className="pl-10 w-64" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Série</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Ano Letivo</TableHead>
                  <TableHead className="text-center">Total Alunos</TableHead>
                  <TableHead className="text-center">Capacidade</TableHead>
                  <TableHead>Disciplinas</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {turmas.map((turma) => {
                  const ocupacao = turma.capacidade_maxima
                    ? Math.round((turma.total_alunos / turma.capacidade_maxima) * 100)
                    : 0

                  return (
                    <TableRow key={turma.id}>
                      <TableCell className="font-medium">{turma.nome}</TableCell>
                      <TableCell>{turma.serie}</TableCell>
                      <TableCell className="capitalize">{turma.turno}</TableCell>
                      <TableCell>{turma.ano_letivo}</TableCell>
                      <TableCell className="text-center">{turma.total_alunos}</TableCell>
                      <TableCell className="text-center">
                        {turma.capacidade_maxima || "-"}
                        {turma.capacidade_maxima && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {ocupacao}%
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {turma.disciplinas.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {turma.disciplinas.slice(0, 2).map((disc: any, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {disc.disciplinas?.codigo || "N/A"}
                              </Badge>
                            ))}
                            {turma.disciplinas.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{turma.disciplinas.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <AtivoStatusBadge ativo={turma.ativo} labelAtivo="Ativa" labelInativo="Inativa" />
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
