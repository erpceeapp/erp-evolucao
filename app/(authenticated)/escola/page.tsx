"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Building2, Save } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"

interface EscolaData {
  id?: string
  nome: string
  endereco: string
  cnpj: string
  telefone: string
  email: string
  site: string
  logo_url: string
}

export default function EscolaPage() {
  const [escola, setEscola] = useState<EscolaData>({
    nome: "",
    endereco: "",
    cnpj: "",
    telefone: "",
    email: "",
    site: "",
    logo_url: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const supabase = createBrowserClient()
  const router = useRouter()

  useEffect(() => {
    checkUserRole()
    loadEscolaData()
  }, [])

  const checkUserRole = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin") {
      router.push("/dashboard")
      return
    }

    setUserRole(profile.role)
  }

  const loadEscolaData = async () => {
    try {
      const { data, error } = await supabase.from("escola").select("*").limit(1).single()

      if (data) {
        setEscola(data)
      }
    } catch (error) {
      console.log("Nenhum dado da escola encontrado")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: existingData } = await supabase.from("escola").select("id").limit(1).single()

      if (existingData) {
        // Atualizar dados existentes
        const { error } = await supabase.from("escola").update(escola).eq("id", existingData.id)

        if (error) throw error
      } else {
        // Inserir novos dados
        const { error } = await supabase.from("escola").insert([escola])

        if (error) throw error
      }

      alert("Dados da escola salvos com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar:", error)
      alert("Erro ao salvar dados da escola")
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

  if (userRole !== "admin") {
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
                value={escola.nome}
                onChange={(e) => setEscola({ ...escola, nome: e.target.value })}
                placeholder="Ex: Colégio São José"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={escola.cnpj}
                onChange={(e) => setEscola({ ...escola, cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={escola.telefone}
                onChange={(e) => setEscola({ ...escola, telefone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={escola.email}
                onChange={(e) => setEscola({ ...escola, email: e.target.value })}
                placeholder="contato@escola.com.br"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="site">Site</Label>
              <Input
                id="site"
                value={escola.site}
                onChange={(e) => setEscola({ ...escola, site: e.target.value })}
                placeholder="https://www.escola.com.br"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço Completo</Label>
            <Textarea
              id="endereco"
              value={escola.endereco}
              onChange={(e) => setEscola({ ...escola, endereco: e.target.value })}
              placeholder="Rua, número, bairro, cidade, estado, CEP"
              rows={3}
            />
          </div>

          <div className="flex justify-end">
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
