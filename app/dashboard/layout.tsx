import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/layout/sidebar"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Buscar perfil do usuário
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador"
      case "secretaria":
        return "Secretaria"
      case "coordenacao":
        return "Coordenação"
      case "professor":
        return "Professor"
      default:
        return role
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar userRole={profile?.role} />

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="lg:hidden">{/* Space for mobile menu button */}</div>
              <div className="hidden lg:block">
                <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{profile?.nome_completo || "Usuário"}</p>
                  <p className="text-xs text-gray-600 capitalize">{getRoleLabel(profile?.role || "professor")}</p>
                </div>
                <Link href="/auth/logout">
                  <Button variant="outline" size="sm">
                    Sair
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
