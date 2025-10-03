import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Users, Download, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

async function getAlunosRelatorio() {
  const supabase = await createServerClient()

  const { data: alunos, error } = await supabase
    .from("alunos")
    .select(`
      *,
      matriculas (
        id,
        status,
        turmas (nome, serie)
      )
    `)
    .order("nome_completo", { ascending: true })

  if (error) {
    console.error("Erro ao buscar alunos:", error)
    return []
  }

  return alunos || []
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Relatório de Alunos</h1>
            <p className="text-gray-600">Lista completa de alunos cadastrados</p>
          </div>
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
                const matriculaAtiva = aluno.matriculas?.find((m) => m.status === "ativa")
                return (
                  <TableRow key={aluno.id}>
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
    </div>
  )
}
