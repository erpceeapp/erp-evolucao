import type React from "react"
import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, BookOpen, Users, Calendar, Clock } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"

export default async function DisciplinaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (id === "nova") {
    redirect("/disciplinas/nova")
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  if (!id || id === "undefined" || id === "null") {
    notFound()
  }

  // Buscar dados da disciplina
  const { data: disciplina, error: disciplinaError } = await supabase
    .from("disciplinas")
    .select("*")
    .eq("id", id)
    .single()

  if (disciplinaError || !disciplina) {
    notFound()
  }

  // Buscar turmas que têm essa disciplina
  const { data: turmasDisciplinas, count: totalTurmas } = await supabase
    .from("turma_disciplinas")
    .select(
      `
      id,
      turma:turmas!turma_disciplinas_turma_id_fkey(nome, serie, turno),
      professor:professores!turma_disciplinas_professor_id_fkey(nome_completo)
    `,
      { count: "exact" },
    )
    .eq("disciplina_id", id)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BookOpen}
        title={disciplina.nome}
        subtitle="Detalhes da disciplina"
        backHref="/disciplinas"
        actions={
          <Button asChild>
            <Link href={`/disciplinas/${disciplina.id}/editar`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Principais */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Informações da Disciplina
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome da Disciplina</Label>
                  <p className="font-medium">{disciplina.nome}</p>
                </div>
                <div>
                  <Label>Código</Label>
                  <p className="font-medium">{disciplina.codigo}</p>
                </div>
              </div>

              {disciplina.descricao && (
                <div>
                  <Label>Descrição</Label>
                  <p className="text-sm text-gray-700">{disciplina.descricao}</p>
                </div>
              )}

              {disciplina.carga_horaria && (
                <div>
                  <Label>Carga Horária</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {disciplina.carga_horaria} horas
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Turmas que têm essa disciplina */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Turmas ({totalTurmas || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {turmasDisciplinas && turmasDisciplinas.length > 0 ? (
                <div className="space-y-3">
                  {turmasDisciplinas.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.turma.nome}</p>
                        <p className="text-sm text-gray-600">
                          {item.turma.serie} • {item.turma.turno}
                        </p>
                        {item.professor && (
                          <p className="text-sm text-gray-500 mt-1">Professor: {item.professor.nome_completo}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhuma turma associada</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={disciplina.ativo ? "default" : "secondary"} className="text-sm">
                {disciplina.ativo ? "Ativa" : "Inativa"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Turmas</span>
                <span className="font-bold text-lg">{totalTurmas || 0}</span>
              </div>
              {disciplina.carga_horaria && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Carga Horária</span>
                  <span className="font-bold text-lg">{disciplina.carga_horaria}h</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Informações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Cadastrada em</Label>
                <p className="text-sm font-medium">{formatDate(disciplina.created_at)}</p>
              </div>
              <div>
                <Label>Última atualização</Label>
                <p className="text-sm font-medium">{formatDate(disciplina.updated_at)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-sm font-medium text-gray-500 ${className}`}>{children}</label>
}
