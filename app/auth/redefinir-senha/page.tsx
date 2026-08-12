"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GraduationCap, Eye, EyeOff, Loader2, Check, X } from "lucide-react"
import { toast, Toaster } from "sonner"
import { translateError } from "@/lib/error-messages"
import { getAuthCode } from "./actions"

export default function RedefinirSenhaPage() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isValid, setIsValid] = useState(false)
  const [isProcessing, setIsProcessing] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const router = useRouter()
  const exchangedRef = useRef(false)
  // Criar cliente SEM detectSessionInUrl para evitar que
  // _initialize() consuma o codigo antes do exchange manual
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { detectSessionInUrl: false },
      global: {
        headers: { "X-Client-Info": "erp-educacional" },
      },
    },
  )

  useEffect(() => {
    exchangeCode()
  }, [])

  const exchangeCode = async () => {
    if (exchangedRef.current) return
    exchangedRef.current = true

    const code = await getAuthCode()

    if (!code) {
      setErrorMsg("Link invalido. Solicite um novo email de recuperacao.")
      setIsProcessing(false)
      return
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      setErrorMsg(translateError(error.message))
      setIsProcessing(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setErrorMsg("Sessao nao encontrada. Solicite um novo email de recuperacao.")
      setIsProcessing(false)
      return
    }

    setIsProcessing(false)
    setIsValid(true)
  }

  const passwordRules = [
    { label: "Mínimo de 6 caracteres", test: (p: string) => p.length >= 6 },
    { label: "Pelo menos 1 letra maiúscula", test: (p: string) => /[A-Z]/.test(p) },
    { label: "Pelo menos 1 letra minúscula", test: (p: string) => /[a-z]/.test(p) },
    { label: "Pelo menos 1 número", test: (p: string) => /[0-9]/.test(p) },
    { label: "Pelo menos 1 caractere especial", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
  ]

  const metCount = passwordRules.filter((r) => r.test(newPassword)).length

  const strength =
    metCount <= 1 ? { label: "Fraca", bar: "20%", color: "bg-red-500" }
    : metCount <= 3 ? { label: "Média", bar: "50%", color: "bg-yellow-500" }
    : metCount === 4 ? { label: "Boa", bar: "75%", color: "bg-lime-500" }
    : { label: "Forte", bar: "100%", color: "bg-green-500" }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem")
      return
    }

    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres")
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      toast.success("Senha redefinida com sucesso! Faca login com sua nova senha.")
      router.push("/auth/login")
    } catch (error: unknown) {
      toast.error(translateError(error instanceof Error ? error.message : "Erro ao redefinir senha"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Toaster richColors position="top-right" />
      {isProcessing ? (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <p className="text-center text-gray-500">Preparando recuperacao de senha...</p>
            </CardContent>
          </Card>
        </div>
      ) : errorMsg ? (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-600 p-3 rounded-full">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Redefinir Senha</h1>
              <p className="text-gray-600">Ocorreu um erro ao processar sua solicitacao</p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md mb-4">{errorMsg}</div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push("/auth/recuperar-senha")}
                >
                  Solicitar novo email
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-600 p-3 rounded-full">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Redefinir Senha</h1>
              <p className="text-gray-600">Escolha uma nova senha para sua conta</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Nova Senha</CardTitle>
                <CardDescription>A senha deve ter no mínimo 6 caracteres.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                      </Button>
                    </div>
                  </div>

                  {/* Barra de força */}
                  <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Força da senha:</span>
                          <span className={`font-medium ${
                            metCount <= 1 ? "text-red-600" : metCount <= 3 ? "text-yellow-600" : metCount === 4 ? "text-lime-600" : "text-green-600"
                          }`}>
                            {strength.label}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                            style={{ width: strength.bar }}
                          />
                        </div>
                      </div>

                      {/* Lista de regras */}
                      <div className="space-y-1">
                        {passwordRules.map((rule) => {
                          const ok = rule.test(newPassword)
                          return (
                            <div key={rule.label} className="flex items-center gap-2 text-xs">
                              {ok ? (
                                <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                              ) : (
                                <X className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                              )}
                              <span className={ok ? "text-green-700" : "text-gray-500"}>
                                {rule.label}
                              </span>
                            </div>
                          )
                        })}
                      </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Digite a senha novamente"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Redefinindo..." : "Redefinir Senha"}
                  </Button>

                  <p className="text-center text-sm text-gray-500">
                    Nao quer alterar a senha agora?{" "}
                    <button
                      type="button"
                      className="text-blue-600 hover:underline font-medium"
                      onClick={() => router.push("/auth/login")}
                    >
                      Ir para o Login
                    </button>
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  )
}
