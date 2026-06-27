"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createUser } from "@/app/(authenticated)/usuarios/actions"
import { translateError } from "@/lib/error-messages"
import { toast } from "sonner"

const tipoOptions = [
  { value: "admin", label: "Administrador" },
  { value: "secretaria", label: "Secretaria" },
  { value: "professor", label: "Professor" },
  { value: "coordenacao", label: "Coordenação" },
  { value: "diretor", label: "Diretor" },
]

const ALLOWED_TIPOS = ["admin", "diretor", "coordenacao", "secretaria"]

export function UsuarioForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome_completo: "",
    email: "",
    telefone: "",
    tipo_usuario: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!formData.tipo_usuario) {
      setError("Selecione o tipo de usuario")
      setIsLoading(false)
      return
    }

    const result = await createUser(formData)

    if (result.error) {
      setError(translateError(result.error))
      setIsLoading(false)
      return
    }

    toast.success("Usuario criado com sucesso! Senha temporaria: senha123")
    router.push("/usuarios")
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados do Usuário</CardTitle>
            <CardDescription>Preencha os dados para criar um novo usuario no sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome_completo">Nome Completo *</Label>
              <Input
                id="nome_completo"
                required
                value={formData.nome_completo}
                onChange={(e) => setFormData((prev) => ({ ...prev, nome_completo: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, telefone: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_usuario">Tipo de Usuário *</Label>
              <Select
                value={formData.tipo_usuario}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, tipo_usuario: value }))}
              >
                <SelectTrigger id="tipo_usuario">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tipoOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-red-600 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/usuarios">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancelar
            </Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Salvando..." : "Criar Usuário"}
          </Button>
        </div>
      </div>
    </form>
  )
}
