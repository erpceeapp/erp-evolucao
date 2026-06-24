import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, School, Users, Bell, Shield, Database, Palette, CheckSquare, LinkIcon } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"

export default async function ConfiguracoesPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("tipo_usuario").eq("id", data.user.id).single()

  const isAdmin = profile?.tipo_usuario?.toLowerCase() === "admin"
  const isCoordenacao = profile?.tipo_usuario?.toLowerCase() === "coordenacao"
  const isSecretaria = profile?.tipo_usuario?.toLowerCase() === "secretaria"
  const isDiretor = profile?.tipo_usuario?.toLowerCase() === "diretor"

  const configSections = [
    {
      icon: School,
      title: "Dados da Escola",
      description: "Configure informações básicas da instituição",
      href: "/escola",
      adminOnly: false,
    },
    {
      icon: Users,
      title: "Gerenciar Usuários",
      description: "Gerencie usuários e permissões do sistema",
      href: "/gerenciar-usuarios",
      adminOnly: true,
    },
    {
      icon: CheckSquare,
      title: "Campos Obrigatórios",
      description: "Defina campos obrigatórios no cadastro de alunos",
      href: "/configuracoes/campos-obrigatorios",
      adminOnly: false,
      coordenacaoAccess: true,
    },
    {
      icon: LinkIcon,
      title: "Links de Documentos",
      description: "Gerencie links que aparecem no dashboard",
      href: "/configuracoes/links-documentos",
      adminOnly: false,
      coordenacaoAccess: true,
    },
    {
      icon: Bell,
      title: "Notificações",
      description: "Configure preferências de notificações",
      href: "/configuracoes/notificacoes",
      adminOnly: false,
      comingSoon: true,
    },
    {
      icon: Shield,
      title: "Segurança",
      description: "Configurações de segurança e privacidade",
      href: "/configuracoes/seguranca",
      adminOnly: false,
      comingSoon: true,
    },
    {
      icon: Database,
      title: "Backup e Dados",
      description: "Gerencie backups e exportação de dados",
      href: "/configuracoes/backup",
      adminOnly: true,
      comingSoon: true,
    },
    {
      icon: Palette,
      title: "Aparência",
      description: "Personalize a aparência do sistema",
      href: "/configuracoes/aparencia",
      adminOnly: false,
      comingSoon: true,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Settings}
        title="Configurações"
        subtitle="Gerencie as configurações do sistema"
        backHref="/dashboard"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {configSections.map((section) => {
          const Icon = section.icon
          const hasAccess =
            !section.adminOnly || isAdmin || isDiretor || (section.coordenacaoAccess && (isCoordenacao || isSecretaria))
          const isDisabled = section.comingSoon || !hasAccess

          return (
            <Card key={section.href} className={isDisabled ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      {section.adminOnly && <span className="text-xs text-orange-600 font-medium">Apenas Admin</span>}
                      {section.coordenacaoAccess && !section.adminOnly && (
                        <span className="text-xs text-blue-600 font-medium">Admin/Coordenação</span>
                      )}
                    </div>
                  </div>
                  {section.comingSoon && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Em breve</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">{section.description}</CardDescription>
                {!isDisabled ? (
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <Link href={section.href}>Acessar</Link>
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full bg-transparent" disabled>
                    {section.comingSoon ? "Em breve" : "Sem permissão"}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {!isAdmin && !isDiretor && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-orange-900">Acesso Limitado</p>
                <p className="text-sm text-orange-700 mt-1">
                  Algumas configurações estão disponíveis apenas para administradores do sistema.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
