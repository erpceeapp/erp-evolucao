import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/page-header"
import { LinkIcon } from 'lucide-react'
import { LinksDocumentosManager } from "@/components/configuracoes/links-documentos-manager"

export default async function LinksDocumentosPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Verificar permissões
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single()

  const isAdmin = profile?.role === "admin"
  const isCoordenacao = profile?.role === "coordenacao"

  if (!isAdmin && !isCoordenacao) {
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
