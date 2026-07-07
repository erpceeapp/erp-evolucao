import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Book } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { DisciplinaForm } from "@/components/disciplinas/disciplina-form"

export default async function NovaDisciplinaPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <>
      <PageHeader
        icon={Book}
        title="Nova Disciplina"
        description="Preencha os dados para cadastrar uma nova disciplina"
        backHref="/disciplinas"
      />
      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Disciplinas", href: "/disciplinas" },
          { label: "Nova Disciplina" },
        ]}
        className="mt-2"
      />

      <DisciplinaForm />
    </>
  )
}
