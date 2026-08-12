import type React from "react"
import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MatriculaStatusBadge } from "@/components/ui/matricula-status-badge"
import { Edit, ArrowLeft, User, GraduationCap, Calendar, FileText, Hash, UserCheck, ArrowRightLeft } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { DeleteMatriculaButton } from "@/components/matriculas/delete-matricula-button"
import { MatriculaHistorico } from "@/components/matriculas/matricula-historico"
import { DeclaracaoMatriculaButton } from "@/components/matriculas/declaracao-matricula-button"

export default async function MatriculaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (id === "nova") {
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
      id, numero_matricula, status, data_matricula, ano_letivo, observacoes, created_at, updated_at,
      aluno:alunos!matriculas_aluno_id_fkey(id, nome_completo, data_nascimento, cpf, email, nome_responsavel),
      turma:turmas!matriculas_turma_id_fkey(id, nome, serie, turno, capacidade_maxima, professor_responsavel:professores!turmas_professor_responsavel_fkey(nome_completo))
    `,
    )
    .eq("id", id)
    .single() as any

  if (matriculaError || !matricula) {
    notFound()
  }

  // Buscar dados da escola para a declaração
  const { data: escola } = await supabase
    .from("escola")
    .select("nome, cnpj, endereco, telefone, email")
    .limit(1)
    .maybeSingle()

  // Buscar histórico da matrícula
  const { data: historico } = await supabase
    .from("matricula_historico")
    .select(
      `
      id, tipo, status_anterior, status_novo, alterado_em,
      turma_anterior:turmas!matricula_historico_turma_anterior_fkey(nome),
      turma_nova:turmas!matricula_historico_turma_nova_fkey(nome),
      alterado_por:profiles!matricula_historico_alterado_por_fkey(nome_completo)
    `,
    )
    .eq("matricula_id", id)
    .order("alterado_em", { ascending: false })

  interface HistoricoRow {
    id: string
    tipo: string
    status_anterior: string | null
    status_novo: string | null
    alterado_em: string
    turma_anterior: { nome: string } | null
    turma_nova: { nome: string } | null
    alterado_por: { nome_completo: string } | null
  }

  const registrosHistoricos = ((historico as unknown as HistoricoRow[]) || []).map((h) => ({
    id: h.id,
    tipo: h.tipo,
    status_anterior: h.status_anterior,
    status_novo: h.status_novo,
    turma_anterior: h.turma_anterior?.nome ?? null,
    turma_nova: h.turma_nova?.nome ?? null,
    alterado_por_nome: h.alterado_por?.nome_completo ?? null,
    alterado_em: h.alterado_em,
  }))

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const getStatusBadge = (status: string) => <MatriculaStatusBadge status={status} />

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
            <DeclaracaoMatriculaButton
              escola={{
                nome: escola?.nome ?? null,
                cnpj: escola?.cnpj ?? null,
                endereco: escola?.endereco ?? null,
                telefone: escola?.telefone ?? null,
                email: escola?.email ?? null,
              }}
              aluno={{
                nome_completo: matricula.aluno.nome_completo,
                cpf: matricula.aluno.cpf,
                data_nascimento: matricula.aluno.data_nascimento,
              }}
              turma={{
                nome: matricula.turma.nome,
                serie: matricula.turma.serie,
                turno: matricula.turma.turno,
              }}
              numero_matricula={matricula.numero_matricula}
              ano_letivo={matricula.ano_letivo}
            />
            {matricula.status === "ativa" && (
              <Button asChild>
                <Link href={`/matriculas/${matricula.id}/transferir`}>
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Transferir
                </Link>
              </Button>
            )}
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

      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Matriculas", href: "/matriculas" },
          { label: "Detalhes da Matricula" },
        ]}
        className="mt-2"
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

            <MatriculaHistorico registros={registrosHistoricos} />
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
