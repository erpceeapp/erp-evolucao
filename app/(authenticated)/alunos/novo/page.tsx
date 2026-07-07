import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Users } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { AlunoForm } from "@/components/alunos/aluno-form"

export default async function NovoAlunoPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <>
      <PageHeader
        icon={Users}
        title="Novo Aluno"
        description="Preencha os dados para cadastrar um novo aluno"
        backHref="/alunos"
      />
      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Alunos", href: "/alunos" },
          { label: "Novo Aluno" },
        ]}
        className="mt-2"
      />

      <AlunoForm />
    </>
  )
}
