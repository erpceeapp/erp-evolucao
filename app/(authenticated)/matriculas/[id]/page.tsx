import type React from "react"
import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, ArrowLeft, User, GraduationCap, Calendar, FileText, Hash, UserCheck } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { DeleteMatriculaButton } from "@/components/matriculas/delete-matricula-button"

export default async function MatriculaDetalhePage({ params }: { params: { id: string } }) {
  if (params.id === "nova") {
    redirect("/matriculas/nova")
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tipo_usuario")
    .eq("id", data.user.id)
    .single()

  if (!profile || !["admin", "secretaria", "diretor", "coordenacao", "professor"].includes(profile.tipo_usuario)) {
    redirect("/dashboard")
  }

  // Buscar dados da matrícula com relacionamentos
  const { data: matricula, error: matriculaError } = await supabase
    .from("matriculas")
    .select(
      `
      *,
      aluno:alunos(*),
      turma:turmas(*, professor_responsavel:professores(nome_completo))
    `,
    )
    .eq("id", params.id)
    .single()

  if (matriculaError || !matricula) {
    notFound()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      ativa: { label: "Ativa", variant: "default" },
      transferida: { label: "Transferida", variant: "secondary" },
      cancelada: { label: "Cancelada", variant: "destructive" },
      concluida: { label: "Concluída", variant: "secondary" },
    }

    const config = statusConfig[status] || { label: status, variant: "secondary" }
    return (
      <Badge variant={config.variant} className="capitalize text-sm">
        {config.label}
      </Badge>
    )
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  return (
    <>
      <PageHeader
        icon={UserCheck}
        title={`Matrícula #${matricula.numero_matricula}`}
        description="Detalhes da matrícula"
        backHref="/matriculas"
        actions={
          <div className="flex gap-2">
            <DeleteMatriculaButton
              matriculaId={matricula.id}
              numeroMatricula={matricula.numero_matricula}
              isDisabled={matricula.status === "cancelada"}
            />
            <Button asChild>
              <Link href={`/matriculas/${matricula.id}/editar`}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações Principais */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Dados da Matrícula
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Número da Matrícula</Label>
                    <p className="font-mono text-lg font-medium">{matricula.numero_matricula}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div className="mt-1">{getStatusBadge(matricula.status)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Data da Matrícula</Label>
                    <p className="font-medium">{formatDate(matricula.data_matricula)}</p>
                  </div>
                  <div>
                    <Label>Ano Letivo</Label>
                    <p className="font-medium">{matricula.ano_letivo}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados do Aluno
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome Completo</Label>
                    <p className="font-medium">{matricula.aluno.nome_completo}</p>
                  </div>
                  <div>
                    <Label>Idade</Label>
                    <p className="font-medium">{calculateAge(matricula.aluno.data_nascimento)} anos</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>CPF</Label>
                    <p className="font-medium">{matricula.aluno.cpf || "-"}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="font-medium">{matricula.aluno.email || "-"}</p>
                  </div>
                </div>

                {matricula.aluno.nome_responsavel && (
                  <div>
                    <Label>Responsável</Label>
                    <p className="font-medium">{matricula.aluno.nome_responsavel}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Dados da Turma
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome da Turma</Label>
                    <p className="font-medium">{matricula.turma.nome}</p>
                  </div>
                  <div>
                    <Label>Série</Label>
                    <p className="font-medium">{matricula.turma.serie}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Turno</Label>
                    <p className="font-medium capitalize">{matricula.turma.turno}</p>
                  </div>
                  <div>
                    <Label>Capacidade Máxima</Label>
                    <p className="font-medium">{matricula.turma.capacidade_maxima || "-"}</p>
                  </div>
                </div>

                {matricula.turma.professor_responsavel && (
                  <div>
                    <Label>Professor Responsável</Label>
                    <p className="font-medium">{matricula.turma.professor_responsavel.nome_completo}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {matricula.observacoes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Observações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{matricula.observacoes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Informações do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Criada em</Label>
                  <p className="text-sm font-medium">{formatDate(matricula.created_at)}</p>
                </div>
                <div>
                  <Label>Última atualização</Label>
                  <p className="text-sm font-medium">{formatDate(matricula.updated_at)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                  <Link href={`/alunos/${matricula.aluno.id}`}>Ver Perfil do Aluno</Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                  <Link href={`/turmas/${matricula.turma.id}`}>Ver Detalhes da Turma</Link>
                </Button>
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
