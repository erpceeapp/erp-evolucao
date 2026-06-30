import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Users } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { UsuarioForm } from "@/components/usuarios/usuario-form"

const ALLOWED_ROLES = ["admin", "diretor", "coordenacao", "secretaria"]

export default async function NovoUsuarioPage() {
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

  if (!profile || !ALLOWED_ROLES.includes(profile.tipo_usuario)) {
    redirect("/usuarios")
  }

  return (
    <>
      <PageHeader
        icon={Users}
        title="Novo Usuário"
        description="Preencha os dados para criar um novo usuario no sistema"
        backHref="/usuarios"
      />

      <UsuarioForm />
    </>
  )
}
