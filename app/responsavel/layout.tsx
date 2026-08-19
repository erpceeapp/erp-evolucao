"use client"

import { Suspense, useState } from "react"
import { GraduationCap, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ResponsavelNav } from "@/components/responsavel/responsavel-nav"

export default function ResponsavelLayout({ children }: { children: React.ReactNode }) {
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await fetch("/api/auth/responsavel/logout", { method: "POST" })
    window.location.href = "/auth/login"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <Link href="/responsavel/dashboard" className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Portal do Responsavel</span>
          </Link>

          <Suspense>
            <ResponsavelNav />
          </Suspense>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-gray-600 hover:text-red-600"
          >
            <LogOut className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
