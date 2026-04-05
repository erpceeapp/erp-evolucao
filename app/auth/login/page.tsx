"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { GraduationCap, Eye, EyeOff, Briefcase, Users } from "lucide-react"
import { translateError } from "@/lib/error-messages"

type LoginMode = "funcionario" | "responsavel"

export default function LoginPage() {
  const [mode, setMode] = useState<LoginMode>("funcionario")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [cpf, setCpf] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  }

  const handleFuncionarioLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push("/dashboard")
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Erro ao fazer login"
      setError(translateError(errorMsg))
    } finally {
      setIsLoading(false)
    }
  }

  const handleResponsavelLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const cpfLimpo = cpf.replace(/\D/g, "")
      const res = await fetch("/api/auth/responsavel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_responsavel: email, cpf: cpfLimpo }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erro ao fazer login")
        return
      }

      router.push("/responsavel/dashboard")
    } catch {
      setError("Falha na conexao. Verifique sua internet.")
    } finally {
      setIsLoading(false)
    }
  }

  const switchMode = (newMode: LoginMode) => {
    setMode(newMode)
    setError(null)
    setEmail("")
    setPassword("")
    setCpf("")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ERP Educacional</h1>
          <p className="text-gray-600">Sistema de Gestao Escolar</p>
        </div>

        {/* Toggle Funcionario / Responsavel */}
        <div className="flex mb-4 bg-white rounded-lg p-1 shadow-sm border">
          <button
            type="button"
            onClick={() => switchMode("funcionario")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
              mode === "funcionario"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Briefcase className="h-4 w-4" />
            Funcionario
          </button>
          <button
            type="button"
            onClick={() => switchMode("responsavel")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
              mode === "responsavel"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Users className="h-4 w-4" />
            Responsavel
          </button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {mode === "funcionario" ? "Acesso Funcionario" : "Acesso Responsavel"}
            </CardTitle>
            <CardDescription className="text-center">
              {mode === "funcionario"
                ? "Digite suas credenciais para acessar o sistema"
                : "Informe seu email e o CPF do aluno para acessar"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode === "funcionario" ? (
              <form onSubmit={handleFuncionarioLogin} className="space-y-4">
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
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>
                {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResponsavelLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-resp">Email do Responsavel</Label>
                  <Input
                    id="email-resp"
                    type="email"
                    placeholder="responsavel@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf-aluno">CPF do Aluno</Label>
                  <Input
                    id="cpf-aluno"
                    type="text"
                    placeholder="000.000.000-00"
                    required
                    value={cpf}
                    onChange={(e) => setCpf(formatCpf(e.target.value))}
                    maxLength={14}
                  />
                  <p className="text-xs text-gray-500">
                    Informe o CPF do aluno que deseja acompanhar
                  </p>
                </div>
                {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Verificando..." : "Acessar"}
                </Button>
              </form>
            )}

            {mode === "funcionario" && (
              <div className="mt-6 text-center text-sm">
                {"Nao tem uma conta? "}
                <Link href="/auth/cadastro" className="text-blue-600 hover:underline font-medium">
                  Cadastre-se
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
