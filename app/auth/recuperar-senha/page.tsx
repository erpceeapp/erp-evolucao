"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GraduationCap, ArrowLeft, Mail } from "lucide-react"
import Link from "next/link"
import { toast, Toaster } from "sonner"

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      })
    } catch (err) {
      toast.error("Erro ao enviar email de recuperação")
    } finally {
      setEnviado(true)
      setIsLoading(false)
    }
  }

  if (enviado) {
    return (
      <>
      <Toaster richColors position="top-right" />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-600 p-3 rounded-full">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Verifique seu Email</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Email Enviado</CardTitle>
              <CardDescription>
                Se o email informado estiver cadastrado, você receberá um link de recuperação em instantes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600 shrink-0" />
                <p className="text-sm text-gray-600">
                  Verifique também sua caixa de spam ou lixo eletrônico.
                </p>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/auth/login">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Login
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      </>
    )
  }

  return (
    <>
      <Toaster richColors position="top-right" />
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recuperar Senha</h1>
          <p className="text-gray-600">Digite seu email para receber o link de recuperação</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Email</CardTitle>
            <CardDescription>
              Enviaremos um link para redefinir sua senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Enviando..." : "Enviar Link de Recuperação"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/auth/login" className="text-sm text-blue-600 hover:underline">
            <ArrowLeft className="h-4 w-4 inline mr-1" />
            Voltar ao Login
          </Link>
        </div>
      </div>
    </div>
    </>
  )
}
