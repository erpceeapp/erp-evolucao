import type React from "react"
import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, ArrowLeft, BookOpen, Users, Calendar, User } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { GerenciarAlunosTurma } from "@/components/turmas/gerenciar-alunos-turma"
import { GerenciarDisciplinasTurma } from "@/components/turmas/gerenciar-disciplinas-turma"

export default async function TurmaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (id === "nova") {
    redirect("/turmas/nova")
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  if (!id || id === "undefined" || id === "null") {
    notFound()
  }

  // Buscar dados da turma com professor responsável
  const { data: turma, error: turmaError } = await supabase
    .from("turmas")
    .select(`
      *,
      professor_responsavel:professores!turmas_professor_responsavel_id_fkey(nome_completo, email, telefone)
    `)
    .eq("id", id)
    .single()

  if (turmaError || !turma) {
    notFound()
  }

  // Buscar disciplinas da turma
  const { data: disciplinas } = await supabase
    .from("turma_disciplinas")
    .select(`
      id,
      disciplina:disciplinas!turma_disciplinas_disciplina_id_fkey(nome, codigo, carga_horaria),
      professor:professores!turma_disciplinas_professor_id_fkey(nome_completo)
    `)
    .eq("turma_id", id)

  // Buscar matrículas ativas da turma
  const { data: matriculas, count: totalAlunos } = await supabase
    .from("matriculas")
    .select("id, aluno:alunos!matriculas_aluno_id_fkey(id, nome_completo, cpf)", { count: "exact" })
    .eq("turma_id", id)
    .eq("status", "ativa")

  const { data: todosAlunos } = await supabase
    .from("alunos")
    .select("id, nome_completo, cpf, data_nascimento")
    .eq("ativo", true)
    .order("nome_completo")

  const { data: todasDisciplinas } = await supabase
    .from("disciplinas")
    .select("id, nome, codigo, carga_horaria, professor:professores!disciplinas_professor_id_fkey(id, nome_completo)")
    .eq("ativo", true)
    .order("nome")

  const { data: todosProfessores } = await supabase
    .from("professores")
    .select("id, nome_completo")
    .eq("ativo", true)
    .order("nome_completo")

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const getTurnoLabel = (turno: string) => {
    const turnos: Record<string, string> = {
      matutino: "Manhã",
      vespertino: "Tarde",
      noturno: "Noite",
    }
    return turnos[turno] || turno
  }

  const getTurnoBadgeColor = (turno: string) => {
    const colors: Record<string, string> = {
      matutino: "bg-yellow-100 text-yellow-800",
      vespertino: "bg-orange-100 text-orange-800",
      noturno: "bg-blue-100 text-blue-800",
    }
    return colors[turno] || "bg-gray-100 text-gray-800"
  }

  return (
    <>
      <PageHeader
        icon={BookOpen}
        title={turma.nome}
        description="Detalhes da turma"
        backHref="/turmas"
        actions={
          <Button asChild>
            <Link href={`/turmas/${turma.id}/editar`}>
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
                  Informações da Turma
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome da Turma</Label>
                    <p className="font-medium">{turma.nome}</p>
                  </div>
                  <div>
                    <Label>Série</Label>
                    <p className="font-medium">{turma.serie}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Ano Letivo</Label>
                    <p className="font-medium">{turma.ano_letivo}</p>
                  </div>
                  <div>
                    <Label>Turno</Label>
                    <Badge className={getTurnoBadgeColor(turma.turno)} variant="secondary">
                      {getTurnoLabel(turma.turno)}
                    </Badge>
                  </div>
                  <div>
                    <Label>Capacidade Máxima</Label>
                    <p className="font-medium flex items-center gap-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      {turma.capacidade_maxima || "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {turma.professor_responsavel && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Professor Responsável
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Nome</Label>
                    <p className="font-medium">{turma.professor_responsavel.nome_completo}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Email</Label>
                      <p className="font-medium text-sm">{turma.professor_responsavel.email || "-"}</p>
                    </div>
                    <div>
                      <Label>Telefone</Label>
                      <p className="font-medium">{turma.professor_responsavel.telefone || "-"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Disciplinas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Disciplinas ({disciplinas?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {disciplinas && disciplinas.length > 0 ? (
                  <div className="space-y-3">
                    {disciplinas.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{item.disciplina.nome}</p>
                          <p className="text-sm text-gray-600">
                            Código: {item.disciplina.codigo} • {item.disciplina.carga_horaria}h
                          </p>
                          {item.professor && (
                            <p className="text-sm text-gray-500 mt-1">Professor: {item.professor.nome_completo}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Nenhuma disciplina associada</p>
                )}
              </CardContent>
            </Card>

            {/* Alunos Matriculados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Alunos Matriculados ({totalAlunos || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {matriculas && matriculas.length > 0 ? (
                  <div className="space-y-2">
                    {matriculas.slice(0, 10).map((matricula: any) => (
                      <div key={matricula.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <Users className="h-4 w-4 text-gray-400" />
                        <div className="flex-1">
                          <span className="text-sm font-medium">{matricula.aluno.nome_completo}</span>
                          {matricula.aluno.matricula && (
                            <span className="text-xs text-gray-500 ml-2">• Mat. {matricula.aluno.matricula}</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {(totalAlunos || 0) > 10 && (
                      <p className="text-sm text-gray-500 text-center pt-2">
                        E mais {(totalAlunos || 0) - 10} aluno(s)...
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Nenhum aluno matriculado</p>
                )}
              </CardContent>
            </Card>

            <GerenciarDisciplinasTurma
              turmaId={turma.id}
              disciplinasAtuais={(disciplinas || []) as any[]}
              todasDisciplinas={(todasDisciplinas || []) as any[]}
              todosProfessores={todosProfessores || []}
            />

            <GerenciarAlunosTurma
              turmaId={turma.id}
              capacidadeMaxima={turma.capacidade_maxima}
              alunosMatriculados={(matriculas || []) as any[]}
              todosAlunos={todosAlunos || []}
              totalAlunos={totalAlunos || 0}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={turma.ativo ? "default" : "secondary"} className="text-sm">
                  {turma.ativo ? "Ativa" : "Inativa"}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Alunos matriculados</span>
                  <span className="font-bold text-lg">{totalAlunos || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Capacidade</span>
                  <span className="font-bold text-lg">{turma.capacidade_maxima || "-"}</span>
                </div>
                {turma.capacidade_maxima && (
                  <div className="pt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(((totalAlunos || 0) / turma.capacidade_maxima) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      {Math.round(((totalAlunos || 0) / turma.capacidade_maxima) * 100)}% ocupado
                    </p>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-gray-600">Disciplinas</span>
                  <span className="font-bold text-lg">{disciplinas?.length || 0}</span>
                </div>
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
                  <p className="text-sm font-medium">{formatDate(turma.created_at)}</p>
                </div>
                <div>
                  <Label>Última atualização</Label>
                  <p className="text-sm font-medium">{formatDate(turma.updated_at)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
      </div>
    </>
  )
}

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-sm font-medium text-gray-500 ${className}`}>{children}</label>
}
