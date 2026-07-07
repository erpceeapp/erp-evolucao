import { createClient } from "@/lib/supabase/server"
import { BookOpen } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { TurmaForm } from "@/components/turmas/turma-form"

export default async function NovaTurmaPage() {
  const supabase = await createClient()

  // Buscar professores para o select
  const { data: professores } = await supabase
    .from("professores")
    .select("id, nome_completo")
    .eq("ativo", true)
    .order("nome_completo")

  return (
    <>
      <PageHeader
        icon={BookOpen}
        title="Nova Turma"
        description="Preencha os dados para cadastrar uma nova turma"
        backHref="/turmas"
      />

      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Turmas", href: "/turmas" },
          { label: "Nova Turma" },
        ]}
        className="mt-2"
      />

      <TurmaForm professores={professores || []} />
    </>
  )
}
