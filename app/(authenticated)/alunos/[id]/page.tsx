import type React from "react"
import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AtivoStatusBadge } from "@/components/ui/ativo-status-badge"
import { Edit, ArrowLeft, User, Phone, MapPin, Calendar, FileText, BookUser } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { ExportAlunoPDFWrapper } from "@/components/alunos/export-aluno-pdf-wrapper"

export default async function AlunoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (id === "novo") {
    redirect("/alunos/novo")
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

  if (!id || id === "undefined" || id === "null") {
    notFound()
  }

  // Buscar dados do aluno
  const { data: aluno, error: alunoError } = await supabase.from("alunos").select("*").eq("id", id).single()

  if (alunoError || !aluno) {
    notFound()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
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
        icon={User}
        title={aluno.nome_completo}
        description={`${aluno.matricula ? `Matrícula: ${aluno.matricula} • ` : ""}Detalhes do aluno`}
        backHref="/alunos"
        actions={
          <div className="flex gap-2">
            <ExportAlunoPDFWrapper aluno={aluno} />
            <Button variant="outline" asChild>
              <Link href={`/agenda-aluno/${aluno.id}`}>
                <BookUser className="h-4 w-4 mr-2" />
                Agenda
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/alunos/${aluno.id}/editar`}>
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
          { label: "Alunos", href: "/alunos" },
          { label: aluno.nome_completo },
        ]}
        className="mt-2"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações Principais */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {aluno.matricula && (
                  <div>
                    <Label>Matrícula</Label>
                    <p className="font-mono text-lg font-bold text-blue-600">{aluno.matricula}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome Completo</Label>
                    <p className="font-medium">{aluno.nome_completo}</p>
                  </div>
                  <div>
                    <Label>Data de Nascimento</Label>
                    <p className="font-medium">
                      {formatDate(aluno.data_nascimento)} ({calculateAge(aluno.data_nascimento)} anos)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>CPF</Label>
                    <p className="font-medium">{aluno.cpf || "-"}</p>
                  </div>
                  <div>
                    <Label>RG</Label>
                    <p className="font-medium">{aluno.rg || "-"}</p>
                  </div>
                </div>

                {aluno.endereco && (
                  <div>
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Endereço
                    </Label>
                    <p className="font-medium">{aluno.endereco}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Telefone</Label>
                    <p className="font-medium">{aluno.telefone || "-"}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="font-medium">{aluno.email || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Responsável</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Nome do Responsável</Label>
                  <p className="font-medium">{aluno.nome_responsavel || "-"}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Telefone do Responsável</Label>
                    <p className="font-medium">{aluno.telefone_responsavel || "-"}</p>
                  </div>
                  <div>
                    <Label>Email do Responsável</Label>
                    <p className="font-medium">{aluno.email_responsavel || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {aluno.observacoes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Observações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{aluno.observacoes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <AtivoStatusBadge ativo={aluno.ativo} className="text-sm" />
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
                  <Label>Cadastrado em</Label>
                  <p className="text-sm font-medium">{formatDate(aluno.created_at)}</p>
                </div>
                <div>
                  <Label>Última atualização</Label>
                  <p className="text-sm font-medium">{formatDate(aluno.updated_at)}</p>
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
