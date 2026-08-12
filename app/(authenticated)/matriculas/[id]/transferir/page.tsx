import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRightLeft } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { TransferirMatriculaForm } from "@/components/matriculas/transferir-matricula-form"

export default async function TransferirMatriculaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

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

  if (!profile || !["admin", "secretaria", "diretor", "coordenacao"].includes(profile.tipo_usuario)) {
    redirect("/dashboard")
  }

  const { data: matricula, error: matriculaError } = await supabase
    .from("matriculas")
    .select(
      `
      id, numero_matricula, status,
      aluno:alunos!matriculas_aluno_id_fkey(id, nome_completo),
      turma:turmas!matriculas_turma_id_fkey(id, nome)
    `,
    )
    .eq("id", id)
    .single() as any

  if (matriculaError || !matricula) {
    notFound()
  }

  if (matricula.status !== "ativa") {
    redirect(`/matriculas/${id}`)
  }

  const { data: turmasData } = await supabase
    .from("turmas")
    .select("id, nome, serie, ano_letivo, capacidade_maxima")
    .eq("ativo", true)
    .order("nome")

  const turmas = turmasData || []

  return (
    <>
      <PageHeader
        icon={ArrowRightLeft}
        title="Transferir Matrícula"
        description={`Transferir matrícula #${matricula.numero_matricula} para outra turma`}
        backHref={`/matriculas/${id}`}
      />

      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Matriculas", href: "/matriculas" },
          { label: "Transferir Matricula" },
        ]}
        className="mt-2"
      />

      <Card>
        <CardContent className="pt-6">
          <TransferirMatriculaForm
            matriculaId={matricula.id}
            numeroMatricula={matricula.numero_matricula}
            alunoNome={matricula.aluno?.nome_completo}
            turmaAtualId={matricula.turma?.id}
            turmaAtualNome={matricula.turma?.nome}
            turmas={turmas as TurmaOption[]}
          />
        </CardContent>
      </Card>
    </>
  )
}

interface TurmaOption {
  id: string
  nome: string
  serie: string
  ano_letivo: number
  capacidade_maxima: number | null
}