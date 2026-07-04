import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { GraduationCap } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { ProfessorForm } from "@/components/professores/professor-form"

export default async function EditarProfessorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Buscar dados do professor
  const { data: professor, error: professorError } = await supabase
    .from("professores")
    .select("*")
    .eq("id", id)
    .single()

  if (professorError || !professor) {
    notFound()
  }

  return (
    <>
      <PageHeader
        icon={GraduationCap}
        title="Editar Professor"
        description={`Atualize os dados de ${professor.nome_completo}`}
        backHref={`/professores/${id}`}
      />
      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Professores", href: "/professores" },
          { label: professor.nome_completo, href: `/professores/${id}` },
          { label: "Editar" },
        ]}
        className="mt-2"
      />

      <ProfessorForm professor={professor} isEditing={true} />
    </>
  )
}
