import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { GraduationCap } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { ProfessorForm } from "@/components/professores/professor-form"

export default async function NovoProfessorPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <>
      <PageHeader
        icon={GraduationCap}
        title="Novo Professor"
        description="Preencha os dados para cadastrar um novo professor"
        backHref="/professores"
      />
      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Professores", href: "/professores" },
          { label: "Novo Professor" },
        ]}
        className="mt-2"
      />

      <ProfessorForm />
    </>
  )
}
