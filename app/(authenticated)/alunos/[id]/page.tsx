import type React from "react"
import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AtivoStatusBadge } from "@/components/ui/ativo-status-badge"
import { Edit, ArrowLeft, User, Phone, MapPin, Calendar, FileText, BookUser, ScrollText, Users, Heart, GraduationCap, Wallet, Stethoscope, ShieldCheck } from "lucide-react"
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
  const { data: aluno, error: alunoError } = await supabase
    .from("alunos")
    .select("id, nome_completo, matricula, cpf, rg, data_nascimento, sexo, naturalidade, endereco, endereco_numero, bairro, cidade, uf, cep, telefone, telefone_residencial, telefone_comercial, email, nome_mae, celular_mae, profissao_mae, nome_pai, celular_pai, profissao_pai, nome_responsavel, telefone_responsavel, email_responsavel, responsavel_matricula, certidao_nascimento_numero, certidao_livro, certidao_folha, certidao_cartorio, certidao_uf, certidao_data_emissao, resp_fin_nome, resp_fin_cpf, resp_fin_identidade, resp_fin_orgao_emissor, resp_fin_uf, resp_fin_estado_civil, resp_fin_grau_parentesco, resp_fin_data_nascimento, resp_fin_endereco, resp_fin_bairro, resp_fin_cidade, resp_fin_uf_endereco, resp_fin_cep, resp_fin_telefone, uso_medicamento_continuo, medicamento_continuo_qual, alergia_medicamento, alergia_medicamento_qual, alergia_alimento, alergia_alimento_qual, nivel, periodo_letivo, turno_preferencial, observacoes, ativo, created_at, updated_at")
    .eq("id", id)
    .single()

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
                    <Label>Sexo</Label>
                    <p className="font-medium">{aluno.sexo || "-"}</p>
                  </div>
                  <div>
                    <Label>Naturalidade</Label>
                    <p className="font-medium">{aluno.naturalidade || "-"}</p>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Documentação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Certidão - Número</Label>
                    <p className="font-medium">{aluno.certidao_nascimento_numero || "-"}</p>
                  </div>
                  <div>
                    <Label>Livro</Label>
                    <p className="font-medium">{aluno.certidao_livro || "-"}</p>
                  </div>
                  <div>
                    <Label>Folha</Label>
                    <p className="font-medium">{aluno.certidao_folha || "-"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Data de Emissão</Label>
                    <p className="font-medium">{aluno.certidao_data_emissao ? formatDate(aluno.certidao_data_emissao) : "-"}</p>
                  </div>
                  <div>
                    <Label>Cartório</Label>
                    <p className="font-medium">{aluno.certidao_cartorio || "-"}</p>
                  </div>
                  <div>
                    <Label>UF</Label>
                    <p className="font-medium">{aluno.certidao_uf || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Endereço</Label>
                    <p className="font-medium">{aluno.endereco ? `${aluno.endereco}${aluno.endereco_numero ? `, ${aluno.endereco_numero}` : ""}` : "-"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Bairro</Label>
                    <p className="font-medium">{aluno.bairro || "-"}</p>
                  </div>
                  <div>
                    <Label>Cidade</Label>
                    <p className="font-medium">{aluno.cidade || "-"}</p>
                  </div>
                  <div>
                    <Label>UF</Label>
                    <p className="font-medium">{aluno.uf || "-"}</p>
                  </div>
                  <div>
                    <Label>CEP</Label>
                    <p className="font-medium">{aluno.cep || "-"}</p>
                  </div>
                </div>
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
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Filiação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-2 border-blue-200 pl-4 space-y-3">
                  <p className="text-sm font-semibold text-blue-600">Mãe</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome da Mãe</Label>
                      <p className="font-medium">{aluno.nome_mae || "-"}</p>
                    </div>
                    <div>
                      <Label>Profissão</Label>
                      <p className="font-medium">{aluno.profissao_mae || "-"}</p>
                    </div>
                  </div>
                  <div>
                    <Label>Celular</Label>
                    <p className="font-medium">{aluno.celular_mae || "-"}</p>
                  </div>
                </div>
                <div className="border-l-2 border-green-200 pl-4 space-y-3">
                  <p className="text-sm font-semibold text-green-600">Pai</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome do Pai</Label>
                      <p className="font-medium">{aluno.nome_pai || "-"}</p>
                    </div>
                    <div>
                      <Label>Profissão</Label>
                      <p className="font-medium">{aluno.profissao_pai || "-"}</p>
                    </div>
                  </div>
                  <div>
                    <Label>Celular</Label>
                    <p className="font-medium">{aluno.celular_pai || "-"}</p>
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Responsável Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome</Label>
                    <p className="font-medium">{aluno.resp_fin_nome || "-"}</p>
                  </div>
                  <div>
                    <Label>Data de Nascimento</Label>
                    <p className="font-medium">{aluno.resp_fin_data_nascimento ? formatDate(aluno.resp_fin_data_nascimento) : "-"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>CPF</Label>
                    <p className="font-medium">{aluno.resp_fin_cpf || "-"}</p>
                  </div>
                  <div>
                    <Label>Identidade</Label>
                    <p className="font-medium">{aluno.resp_fin_identidade || "-"}</p>
                  </div>
                  <div>
                    <Label>Órgão Emissor</Label>
                    <p className="font-medium">{aluno.resp_fin_orgao_emissor || "-"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>UF</Label>
                    <p className="font-medium">{aluno.resp_fin_uf || "-"}</p>
                  </div>
                  <div>
                    <Label>Estado Civil</Label>
                    <p className="font-medium">{aluno.resp_fin_estado_civil || "-"}</p>
                  </div>
                  <div>
                    <Label>Grau de Parentesco</Label>
                    <p className="font-medium">{aluno.resp_fin_grau_parentesco || "-"}</p>
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <p className="font-medium">{aluno.resp_fin_telefone || "-"}</p>
                  </div>
                </div>
                <div>
                  <Label>Endereço</Label>
                  <p className="font-medium">{aluno.resp_fin_endereco ? `${aluno.resp_fin_endereco}${aluno.resp_fin_bairro ? ` - ${aluno.resp_fin_bairro}` : ""}` : "-"}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Cidade</Label>
                    <p className="font-medium">{aluno.resp_fin_cidade || "-"}</p>
                  </div>
                  <div>
                    <Label>UF</Label>
                    <p className="font-medium">{aluno.resp_fin_uf_endereco || "-"}</p>
                  </div>
                  <div>
                    <Label>CEP</Label>
                    <p className="font-medium">{aluno.resp_fin_cep || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Informações Médicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {aluno.uso_medicamento_continuo && (
                  <div>
                    <Label>Uso contínuo de medicamento</Label>
                    <p className="font-medium text-green-600">Sim</p>
                    {aluno.medicamento_continuo_qual && (
                      <div className="mt-1 prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: aluno.medicamento_continuo_qual }} />
                    )}
                  </div>
                )}
                {aluno.alergia_medicamento && (
                  <div>
                    <Label>Alergia a medicamento</Label>
                    <p className="font-medium text-green-600">Sim</p>
                    {aluno.alergia_medicamento_qual && (
                      <div className="mt-1 prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: aluno.alergia_medicamento_qual }} />
                    )}
                  </div>
                )}
                {aluno.alergia_alimento && (
                  <div>
                    <Label>Alergia a alimento</Label>
                    <p className="font-medium text-green-600">Sim</p>
                    {aluno.alergia_alimento_qual && (
                      <div className="mt-1 prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: aluno.alergia_alimento_qual }} />
                    )}
                  </div>
                )}
                {!aluno.uso_medicamento_continuo && !aluno.alergia_medicamento && !aluno.alergia_alimento && (
                  <p className="text-gray-500 text-sm">Nenhuma informação médica registrada.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Dados da Matrícula
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Nível</Label>
                    <p className="font-medium">{aluno.nivel || "-"}</p>
                  </div>
                  <div>
                    <Label>Período Letivo</Label>
                    <p className="font-medium">{aluno.periodo_letivo || "-"}</p>
                  </div>
                  <div>
                    <Label>Turno Preferencial</Label>
                    <p className="font-medium">{aluno.turno_preferencial || "-"}</p>
                  </div>
                  <div>
                    <Label>Responsável Matrícula</Label>
                    <p className="font-medium">{aluno.responsavel_matricula || "-"}</p>
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
                  <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: aluno.observacoes }} />
                </CardContent>
              </Card>
            )}
          </div>

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
