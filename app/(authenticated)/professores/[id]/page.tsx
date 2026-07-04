import type React from "react"
import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AtivoStatusBadge } from "@/components/ui/ativo-status-badge"
import { Edit, ArrowLeft, User, Phone, MapPin, Calendar, GraduationCap, DollarSign } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"

export default async function ProfessorDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (id === "novo") {
    redirect("/professores/novo")
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

  // Buscar dados do professor
  const { data: professor, error: professorError } = await supabase
    .from("professores")
    .select("id, nome_completo, email, cpf, rg, data_nascimento, endereco, telefone, formacao, especializacao, registro_profissional, data_admissao, salario, ativo, created_at, updated_at")
    .eq("id", id)
    .single()

  if (professorError || !professor) {
    notFound()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const formatSalary = (salary?: number) => {
    if (!salary) return "-"
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(salary)
  }

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return "-"
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return `${age} anos`
  }

  return (
    <>
      <PageHeader
        icon={GraduationCap}
        title={professor.nome_completo}
        description="Detalhes do professor"
        backHref="/professores"
        actions={
          <div className="flex gap-2">
            <Button asChild>
              <Link href={`/professores/${professor.id}/editar`}>
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
          { label: "Professores", href: "/professores" },
          { label: professor.nome_completo },
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome Completo</Label>
                    <p className="font-medium">{professor.nome_completo}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="font-medium">{professor.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>CPF</Label>
                    <p className="font-medium">{professor.cpf || "-"}</p>
                  </div>
                  <div>
                    <Label>RG</Label>
                    <p className="font-medium">{professor.rg || "-"}</p>
                  </div>
                  <div>
                    <Label>Idade</Label>
                    <p className="font-medium">{calculateAge(professor.data_nascimento)}</p>
                  </div>
                </div>

                {professor.endereco && (
                  <div>
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Endereço
                    </Label>
                    <p className="font-medium">{professor.endereco}</p>
                  </div>
                )}

                {professor.telefone && (
                  <div>
                    <Label className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Telefone
                    </Label>
                    <p className="font-medium">{professor.telefone}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Dados Profissionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Formação</Label>
                  <p className="font-medium">{professor.formacao || "-"}</p>
                </div>

                {professor.especializacao && (
                  <div>
                    <Label>Especialização</Label>
                    <p className="font-medium">{professor.especializacao}</p>
                  </div>
                )}

                {professor.registro_profissional && (
                  <div>
                    <Label>Registro Profissional</Label>
                    <p className="font-medium">{professor.registro_profissional}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {professor.data_admissao && (
                    <div>
                      <Label>Data de Admissão</Label>
                      <p className="font-medium">{formatDate(professor.data_admissao)}</p>
                    </div>
                  )}
                  <div>
                    <Label className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Salário
                    </Label>
                    <p className="font-medium">{formatSalary(professor.salario)}</p>
                  </div>
                </div>
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
                <AtivoStatusBadge ativo={professor.ativo} className="text-sm" />
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
                  <p className="text-sm font-medium">{formatDate(professor.created_at)}</p>
                </div>
                <div>
                  <Label>Última atualização</Label>
                  <p className="text-sm font-medium">{formatDate(professor.updated_at)}</p>
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
