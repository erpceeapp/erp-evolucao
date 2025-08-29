"use client"

import { useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut } from "lucide-react"

export default function LogoutPage() {
  const supabase = createBrowserClient()
  const router = useRouter()

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await supabase.auth.signOut()
        router.push("/auth/login")
      } catch (error) {
        console.error("Erro ao fazer logout:", error)
        router.push("/auth/login")
      }
    }

    handleLogout()
  }, [supabase, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <LogOut className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Saindo do Sistema</CardTitle>
          <CardDescription>Aguarde enquanto você é desconectado...</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </CardContent>
      </Card>
    </div>
  )
}
