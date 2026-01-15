import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GraduationCap, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import PageHeader from "@/components/page-header"
import Link from "next/link"

async function getAlunos() {
  const supabase = await createServerClient()

  // Buscar alunos ativos
  const { data: alunos, error } = await supabase
    .from("alunos")
    .select("id, nome_completo, matricula, cpf, email, nivel, ativo")
    .eq("ativo", true)
    .order("nome_completo")

  if (error) {
    console.error("Erro ao buscar alunos:", error)
    return []
  }

  return alunos || []
}

export default async function NotasPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const alunos = await getAlunos()

  return (
    <>
      <PageHeader
        icon={GraduationCap}
        title="Gestão de Notas"
        subtitle="Selecione um aluno para visualizar e gerenciar suas notas"
        backHref="/dashboard"
      />
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Alunos</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input placeholder="Buscar aluno..." className="pl-10 w-64" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {alunos.length === 0 ? (
              <div className="text-center py-8">
                <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum aluno encontrado</h3>
                <p className="text-gray-600">Cadastre alunos para começar a gerenciar notas.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Série</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alunos.map((aluno) => (
                    <TableRow key={aluno.id} className="cursor-pointer hover:bg-gray-50">
                      <TableCell className="font-mono text-sm">
                        <Link href={`/notas/aluno/${aluno.id}`} className="block w-full">
                          {aluno.matricula || "-"}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link href={`/notas/aluno/${aluno.id}`} className="block w-full">
                          {aluno.nome_completo}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/notas/aluno/${aluno.id}`} className="block w-full">
                          {aluno.nivel || "-"}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        <Link href={`/notas/aluno/${aluno.id}`} className="block w-full">
                          {aluno.email || "-"}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/notas/aluno/${aluno.id}`} className="block w-full">
                          <Badge variant={aluno.ativo ? "default" : "secondary"}>
                            {aluno.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
