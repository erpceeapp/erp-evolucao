"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Save } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import PageHeader from "@/components/page-header"
import { saveEscolaData } from "./actions"
import { toast } from "sonner"
import { translateError } from "@/lib/error-messages"

interface EscolaData {
  id?: string
  nome: string
  logradouro: string
  numero: string
  complemento: string
  cidade: string
  estado: string
  cep: string
  cnpj: string
  telefone: string
  telefone2: string
  email: string
  site: string
}

const ESTADOS = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
]

function formatCEP(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14)
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export default function EscolaPage() {
  const [escola, setEscola] = useState<EscolaData>({
    nome: "",
    logradouro: "",
    numero: "",
    complemento: "",
    cidade: "",
    estado: "",
    cep: "",
    cnpj: "",
    telefone: "",
    telefone2: "",
    email: "",
    site: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userTipo, setUserTipo] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    checkUserTipo()
    loadEscolaData()
  }, [])

  const checkUserTipo = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }

    const { data: profile } = await supabase.from("profiles").select("tipo_usuario").eq("id", user.id).single()

    const allowedTipos = ["admin", "coordenacao", "secretaria", "diretor"]
    if (!profile?.tipo_usuario || !allowedTipos.includes(profile.tipo_usuario.toLowerCase())) {
      router.push("/dashboard")
      return
    }

    setUserTipo(profile.tipo_usuario)
  }

  const loadEscolaData = async () => {
    try {
      const { data, error } = await supabase.from("escola").select("*").limit(1).single()

      if (error) {
        console.log("Nenhum registro encontrado na tabela escola")
        return
      }

      if (data) {
        setEscola({
          nome: data.nome ?? "",
          logradouro: data.logradouro ?? "",
          numero: data.numero ?? "",
          complemento: data.complemento ?? "",
          cidade: data.cidade ?? "",
          estado: data.estado ?? "",
          cep: data.cep ?? "",
          cnpj: data.cnpj ?? "",
          telefone: data.telefone ?? "",
          telefone2: data.telefone2 ?? "",
          email: data.email ?? "",
          site: data.site ?? "",
        })
      }
    } catch (err) {
      toast.error("Erro ao carregar dados da escola")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await saveEscolaData(escola)

      if (result.error) {
        throw new Error(result.error)
      }

      toast.success("Dados da escola salvos com sucesso!")
    } catch (error) {
      toast.error(translateError(error instanceof Error ? error.message : "Erro ao salvar dados da escola"))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!userTipo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Acesso Negado</CardTitle>
            <CardDescription>Apenas administradores podem acessar esta página.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Building2}
        title="Dados da Escola"
        subtitle="Configure as informações básicas da sua instituição de ensino"
        backHref="/configuracoes"
      />

      <Card>
        <CardHeader>
          <CardTitle>Informações da Escola</CardTitle>
          <CardDescription>Preencha os dados da sua escola para personalizar o sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Escola *</Label>
                <Input
                  id="nome"
                  value={escola.nome ?? ""}
                onChange={(e) => setEscola({ ...escola, nome: e.target.value })}
                placeholder="Ex: Colégio São José"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={escola.cnpj ?? ""}
                onChange={(e) => setEscola({ ...escola, cnpj: formatCNPJ(e.target.value) })}
                placeholder="00.000.000/0000-00"
                maxLength={18}
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-medium mb-4">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={escola.cep ?? ""}
                  onChange={(e) => setEscola({ ...escola, cep: formatCEP(e.target.value) })}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="logradouro">Rua</Label>
                <Input
                  id="logradouro"
                  value={escola.logradouro ?? ""}
                  onChange={(e) => setEscola({ ...escola, logradouro: e.target.value })}
                  placeholder="Nome da rua, avenida..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={escola.numero ?? ""}
                  onChange={(e) => setEscola({ ...escola, numero: e.target.value })}
                  placeholder="S/N"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="space-y-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={escola.complemento ?? ""}
                  onChange={(e) => setEscola({ ...escola, complemento: e.target.value })}
                  placeholder="Sala, bloco..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={escola.cidade ?? ""}
                  onChange={(e) => setEscola({ ...escola, cidade: e.target.value })}
                  placeholder="Nome da cidade"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select
                  value={escola.estado}
                  onValueChange={(value) => setEscola({ ...escola, estado: value })}
                >
                  <SelectTrigger id="estado">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS.map((uf) => (
                      <SelectItem key={uf.sigla} value={uf.sigla}>
                        {uf.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-medium mb-4">Contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={escola.telefone ?? ""}
                  onChange={(e) => setEscola({ ...escola, telefone: formatPhone(e.target.value) })}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone2">Telefone (adicional)</Label>
                <Input
                  id="telefone2"
                  value={escola.telefone2 ?? ""}
                  onChange={(e) => setEscola({ ...escola, telefone2: formatPhone(e.target.value) })}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={escola.email ?? ""}
                  onChange={(e) => setEscola({ ...escola, email: e.target.value })}
                  placeholder="contato@escola.com.br"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="site">Site</Label>
                <Input
                  id="site"
                  value={escola.site ?? ""}
                  onChange={(e) => setEscola({ ...escola, site: e.target.value })}
                  placeholder="https://www.escola.com.br"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t">
            <Button onClick={handleSave} disabled={saving || !escola.nome}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Salvando..." : "Salvar Dados"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
