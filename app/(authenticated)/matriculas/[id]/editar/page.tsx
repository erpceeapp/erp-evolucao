import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { UserCheck } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { MatriculaForm } from "@/components/matriculas/matricula-form"

export default async function EditarMatriculaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Buscar dados da matrícula
  const { data: matricula, error: matriculaError } = await supabase
    .from("matriculas")
    .select("*")
    .eq("id", id)
    .single()

  if (matriculaError || !matricula) {
    notFound()
  }

  // Buscar alunos ativos
  const { data: alunos } = await supabase
    .from("alunos")
    .select("id, nome_completo, cpf")
    .eq("ativo", true)
    .order("nome_completo")

  // Buscar turmas ativas
  const { data: turmas } = await supabase
    .from("turmas")
    .select("id, nome, serie, ano_letivo, capacidade_maxima")
    .eq("ativo", true)
    .order("ano_letivo", { ascending: false })
    .order("nome")

  return (
    <>
      <PageHeader
        icon={UserCheck}
        title="Editar Matrícula"
        description={`Atualize os dados da matrícula #${matricula.numero_matricula}`}
        backHref={`/matriculas/${id}`}
      />

      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Matriculas", href: "/matriculas" },
          { label: "Editar Matricula" },
        ]}
        className="mt-2"
      />

      <MatriculaForm matricula={matricula} alunos={alunos || []} turmas={turmas || []} isEditing={true} />
    </>
  )
}
