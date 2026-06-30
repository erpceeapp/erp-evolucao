import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Users, Download, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

async function getAlunosRelatorio() {
  const supabase = await createServerClient()

  const { data: alunos, error: alunosError } = await supabase
    .from("alunos")
    .select("*, matriculas(*)")
    .order("nome_completo", { ascending: true })

  if (alunosError) {
    console.error("[v0] Erro ao buscar alunos:", alunosError)
    return []
  }

  if (!alunos || alunos.length === 0) return []

  // Buscar matrículas separadamente
  const { data: matriculas, error: matriculasError } = await supabase
    .from("matriculas")
    .select("id, aluno_id, turma_id, status")
    .in(
      "aluno_id",
      alunos.map((a) => a.id),
    )

  if (matriculasError) {
    console.error("[v0] Erro ao buscar matrículas:", matriculasError)
  }

  // Buscar turmas das matrículas
  const turmaIds = matriculas?.map((m) => m.turma_id).filter(Boolean) || []
  let turmas: { id: string; nome: string; serie: string | null }[] = []
  if (turmaIds.length > 0) {
    const { data: turmasData, error: turmasError } = await supabase
      .from("turmas")
      .select("id, nome, serie")
      .in("id", turmaIds)

    if (turmasError) {
      console.error("[v0] Erro ao buscar turmas:", turmasError)
    } else {
      turmas = turmasData || []
    }
  }

  // Combinar os dados
  return alunos.map((aluno) => {
    const alunoMatriculas = matriculas?.filter((m) => m.aluno_id === aluno.id) || []
    const matriculasComTurma = alunoMatriculas.map((mat) => ({
      ...mat,
      turmas: turmas.find((t) => t.id === mat.turma_id),
    }))

    return {
      ...aluno,
      matriculas: matriculasComTurma,
    }
  })
}

export default async function RelatorioAlunosPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const alunos = await getAlunosRelatorio()

  return (
    <>
      <PageHeader
        icon={Users}
        title="Relatório de Alunos"
        subtitle="Lista completa de alunos cadastrados"
        backHref="/relatorios"
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
            <CardTitle>Alunos Cadastrados ({alunos.length})</CardTitle>
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
                <TableHead>Matrícula</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Data Nascimento</TableHead>
                <TableHead>Turma Atual</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alunos.map((aluno) => {
                const matriculaAtiva = aluno.matriculas?.find((m: any) => m.status === "ativa")
                return (
                  <TableRow key={aluno.id}>
                    <TableCell>
                      <span className="font-mono text-sm font-semibold text-blue-600">{aluno.matricula || "-"}</span>
                    </TableCell>
                    <TableCell className="font-medium">{aluno.nome_completo}</TableCell>
                    <TableCell>{aluno.email}</TableCell>
                    <TableCell>{aluno.cpf}</TableCell>
                    <TableCell>
                      {aluno.data_nascimento ? new Date(aluno.data_nascimento).toLocaleDateString("pt-BR") : "-"}
                    </TableCell>
                    <TableCell>
                      {matriculaAtiva?.turmas ? (
                        <span>
                          {matriculaAtiva.turmas.nome} - {matriculaAtiva.turmas.serie}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={matriculaAtiva ? "default" : "secondary"}>
                        {matriculaAtiva ? "Matriculado" : "Sem Matrícula"}
                      </Badge>
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
