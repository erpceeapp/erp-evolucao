import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/page-header"
import { Database, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { MigrationTool } from "@/components/migration/migration-tool"

export default async function ExportImportPage() {
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

  if (!profile || !["admin", "diretor"].includes(profile.tipo_usuario)) {
    redirect("/dashboard")
  }

  return (
    <>
      <PageHeader
        icon={Database}
        title="Ferramentas de Migracao"
        description="Exporte e importe dados entre ambientes. Apenas para administradores e diretores."
      />

      <div className="space-y-6">
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Ordem obrigatoria de importacao</AlertTitle>
          <AlertDescription className="text-amber-700">
            A importacao deve seguir a ordem abaixo para preservar os relacionamentos entre os dados.
            O mapping de IDs e mantido automaticamente durante a sessao (ao fechar a aba, os dados sao perdidos).
          </AlertDescription>
        </Alert>

        <MigrationTool />
      </div>
    </>
  )
}
