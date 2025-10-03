"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  UserCheck,
  FileText,
  BarChart3,
  Settings,
  Building2,
  UserCog,
  Menu,
  X,
  Home,
} from "lucide-react"

interface SidebarProps {
  userRole?: string
}

export function Sidebar({ userRole }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const adminItems = [
    {
      title: "Dados da Escola",
      icon: Building2,
      href: "/escola",
    },
    {
      title: "Gestão de Usuários",
      icon: UserCog,
      href: "/usuarios",
    },
  ]

  const menuItems = [
    {
      title: "Dashboard",
      icon: Home,
      href: "/dashboard",
    },
    {
      title: "Alunos",
      icon: Users,
      href: "/alunos",
    },
    {
      title: "Professores",
      icon: GraduationCap,
      href: "/professores",
    },
    {
      title: "Turmas",
      icon: BookOpen,
      href: "/turmas",
    },
    {
      title: "Disciplinas",
      icon: BookOpen,
      href: "/disciplinas",
    },
    {
      title: "Matrículas",
      icon: UserCheck,
      href: "/matriculas",
    },
    {
      title: "Agenda",
      icon: Calendar,
      href: "/agenda",
    },
    {
      title: "Diário de Classe",
      icon: FileText,
      href: "/diario",
    },
    {
      title: "Presença",
      icon: UserCheck,
      href: "/presenca",
    },
    {
      title: "Notas",
      icon: FileText,
      href: "/notas",
    },
    {
      title: "Relatórios",
      icon: BarChart3,
      href: "/relatorios",
    },
    {
      title: "Configurações",
      icon: Settings,
      href: "/configuracoes",
    },
  ]

  const allMenuItems = userRole === "admin" ? [...adminItems, ...menuItems] : menuItems

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center space-x-3 p-6 border-b">
            <div className="bg-blue-600 p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">ERP Educacional</h1>
              <p className="text-xs text-gray-600">Sistema de Gestão</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {allMenuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  )
}
