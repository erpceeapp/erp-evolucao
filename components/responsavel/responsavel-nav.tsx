"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { LayoutDashboard, BookUser, BookOpen, School } from "lucide-react"
import Link from "next/link"

const navItems = [
  { href: "/responsavel/dashboard", icon: LayoutDashboard, label: "Inicio" },
  { href: "/responsavel/agenda", icon: BookUser, label: "Agenda" },
  { href: "/responsavel/agenda?tab=escola", icon: School, label: "Agenda Escolar" },
  { href: "/responsavel/notas", icon: BookOpen, label: "Notas" },
]

export function ResponsavelNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname

  return (
    <>
      {/* Nav desktop */}
      <nav className="hidden sm:flex items-center gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentUrl === item.href
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Nav mobile */}
      <nav className="sm:hidden flex border-t">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
              currentUrl === item.href
                ? "text-blue-700 bg-blue-50"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  )
}
