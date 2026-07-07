import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { UserCheck } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { MatriculaForm } from "@/components/matriculas/matricula-form"

export default async function NovaMatriculaPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
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
        title="Nova Matrícula"
        description="Preencha os dados para realizar uma nova matrícula"
        backHref="/matriculas"
      />

      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Matriculas", href: "/matriculas" },
          { label: "Nova Matricula" },
        ]}
        className="mt-2"
      />

      <MatriculaForm alunos={alunos || []} turmas={turmas || []} />
    </>
  )
}
