import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import PageHeader from "@/components/page-header"
import { LinkIcon } from "lucide-react"
import { LinksDocumentosManager } from "@/components/configuracoes/links-documentos-manager"

export default async function LinksDocumentosPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("tipo_usuario").eq("id", data.user.id).single()

  const allowedTipos = ["admin", "coordenacao", "secretaria", "diretor"]
  const hasAccess = profile?.tipo_usuario && allowedTipos.includes(profile.tipo_usuario.toLowerCase())

  if (!hasAccess) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LinkIcon}
        title="Links de Documentos"
        subtitle="Gerencie os links de documentos que aparecem no dashboard"
        backHref="/configuracoes"
      />

      <LinksDocumentosManager />
    </div>
  )
}
