import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { logoutAction } from "./actions"

export default async function LogoutPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <LogOut className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Sair do Sistema</CardTitle>
          <CardDescription>Tem certeza que deseja sair?</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <form action={logoutAction}>
            <Button type="submit" className="w-full">
              Sim, sair
            </Button>
          </form>
          <Button variant="outline" className="w-full" asChild>
            <a href="/dashboard">Voltar ao Dashboard</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
