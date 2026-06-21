"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Book,
  UserCheck,
  Calendar,
  BookUser,
  FileText,
  ChevronLeft,
  ChevronRight,
  LogOut,
  NotebookPen,
  BarChart3,
  Settings,
  UserCircle,
  UserCog,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

const menuItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/dashboard",
    roles: ["admin", "diretor", "coordenacao", "secretaria", "professor"],
  },
  { icon: UserCog, label: "Usuários", href: "/usuarios", roles: ["admin"] },
  { icon: Users, label: "Alunos", href: "/alunos", roles: ["admin", "diretor", "coordenacao", "secretaria"] },
  {
    icon: GraduationCap,
    label: "Professores",
    href: "/professores",
    roles: ["admin", "diretor", "coordenacao", "secretaria"],
  },
  {
    icon: BookOpen,
    label: "Turmas",
    href: "/turmas",
    roles: ["admin", "diretor", "coordenacao", "secretaria", "professor"],
  },
  {
    icon: Book,
    label: "Disciplinas",
    href: "/disciplinas",
    roles: ["admin", "diretor", "coordenacao", "secretaria", "professor"],
  },
  {
    icon: UserCheck,
    label: "Matrículas",
    href: "/matriculas",
    roles: ["admin", "diretor", "coordenacao", "secretaria"],
  },
  {
    icon: Calendar,
    label: "Agenda",
    href: "/agenda",
    roles: ["admin", "diretor", "coordenacao", "secretaria", "professor"],
  },
  {
    icon: BookUser,
    label: "Agenda do Aluno",
    href: "/agenda-aluno",
    roles: ["admin", "diretor", "coordenacao", "secretaria", "professor"],
  },
  {
    icon: FileText,
    label: "Notas",
    href: "/notas",
    roles: ["admin", "diretor", "coordenacao", "secretaria", "professor"],
  },
  // {
  //   icon: ClipboardCheck,
  //   label: "Presença",
  //   href: "/presenca",
  //   roles: ["admin", "diretor", "coordenacao", "secretaria", "professor"],
  // },
  {
    icon: NotebookPen,
    label: "Diário de Classe",
    href: "/diario",
    roles: ["admin", "diretor", "coordenacao", "secretaria", "professor"],
  },
  {
    icon: BarChart3,
    label: "Relatórios",
    href: "/relatorios",
    roles: ["admin", "diretor", "coordenacao", "secretaria"],
  },
  {
    icon: Settings,
    label: "Configurações",
    href: "/configuracoes",
    roles: ["admin", "diretor", "coordenacao", "secretaria"],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [userTipo, setUserTipo] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUserTipo() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase.from("profiles").select("tipo_usuario").eq("id", user.id).single()

        if (profile) {
          setUserTipo(profile.tipo_usuario)
        }
      }
    }

    fetchUserTipo()
  }, [])

  // Carregar estado do localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved !== null) {
      setIsCollapsed(saved === "true")
    }
  }, [])

  // Salvar estado no localStorage
  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("sidebar-collapsed", String(newState))
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href
    }
    return pathname === href || pathname.startsWith(href + "/")
  }

  const filteredMenuItems = userTipo
    ? menuItems.filter((item) => item.roles.includes(userTipo.toLowerCase()))
    : menuItems

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-50 flex flex-col",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">ERP Edu</span>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className={cn("h-8 w-8", isCollapsed && "mx-auto")}>
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    "hover:bg-gray-100",
                    active && "bg-blue-50 text-blue-600 hover:bg-blue-100",
                    !active && "text-gray-700",
                    isCollapsed && "justify-center",
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-2 space-y-1">
        <Link
          href="/perfil"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
            "text-gray-700 hover:bg-gray-100",
            pathname === "/perfil" && "bg-blue-50 text-blue-600 hover:bg-blue-100",
            isCollapsed && "justify-center",
          )}
          title={isCollapsed ? "Perfil" : undefined}
        >
          <UserCircle className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span className="font-medium">Perfil</span>}
        </Link>

        <Link
          href="/auth/logout"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
            "text-red-600 hover:bg-red-50",
            isCollapsed && "justify-center",
          )}
          title={isCollapsed ? "Sair" : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span className="font-medium">Sair</span>}
        </Link>
      </div>
    </aside>
  )
}
