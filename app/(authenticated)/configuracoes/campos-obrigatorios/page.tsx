"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { CheckCircle2, Save, Settings } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import PageHeader from "@/components/page-header"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"

interface RequiredFieldsConfig {
  // Dados básicos
  nome_completo: boolean
  data_nascimento: boolean
  sexo: boolean
  naturalidade: boolean
  cpf: boolean
  rg: boolean

  // Certidão
  certidao_nascimento_numero: boolean
  certidao_livro: boolean
  certidao_folha: boolean
  certidao_data_emissao: boolean
  certidao_cartorio: boolean

  // Endereço
  endereco: boolean
  bairro: boolean
  cidade: boolean
  uf: boolean
  cep: boolean

  // Contatos
  telefone: boolean
  email: boolean

  // Pais
  nome_mae: boolean
  celular_mae: boolean
  nome_pai: boolean
  celular_pai: boolean

  // Responsável
  nome_responsavel: boolean
  telefone_responsavel: boolean
  email_responsavel: boolean

  // Responsável Financeiro
  resp_fin_nome: boolean
  resp_fin_cpf: boolean
  resp_fin_telefone: boolean

  // Matrícula
  periodo_letivo: boolean
  nivel: boolean
  turno_preferencial: boolean
}

const DEFAULT_CONFIG: RequiredFieldsConfig = {
  nome_completo: true,
  data_nascimento: true,
  sexo: false,
  naturalidade: false,
  cpf: false,
  rg: false,
  certidao_nascimento_numero: false,
  certidao_livro: false,
  certidao_folha: false,
  certidao_data_emissao: false,
  certidao_cartorio: false,
  endereco: false,
  bairro: false,
  cidade: false,
  uf: false,
  cep: false,
  telefone: false,
  email: false,
  nome_mae: false,
  celular_mae: false,
  nome_pai: false,
  celular_pai: false,
  nome_responsavel: false,
  telefone_responsavel: false,
  email_responsavel: false,
  resp_fin_nome: false,
  resp_fin_cpf: false,
  resp_fin_telefone: false,
  periodo_letivo: false,
  nivel: false,
  turno_preferencial: false,
}

export default function CamposObrigatoriosPage() {
  const [config, setConfig] = useState<RequiredFieldsConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userTipo, setUserTipo] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    checkUserTipo()
    loadConfig()
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

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase.from("config_campos_obrigatorios").select("campo, obrigatorio")

      if (error) throw error

      if (data && data.length > 0) {
        const configFromDB = { ...DEFAULT_CONFIG }
        data.forEach((item) => {
          if (item.campo in configFromDB) {
            configFromDB[item.campo as keyof RequiredFieldsConfig] = item.obrigatorio
          }
        })
        setConfig(configFromDB)
      }
    } catch (error) {
      toast.error("Erro ao carregar configurações")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updates = Object.entries(config).map(async ([campo, obrigatorio]) => {
        const { data, error } = await supabase
          .from("config_campos_obrigatorios")
          .upsert({ campo, obrigatorio, updated_at: new Date().toISOString() }, { onConflict: "campo" })

        if (error) {
          throw error
        }

        return data
      })

      await Promise.all(updates)

      toast.success("Configuração salva com sucesso!")
    } catch (error) {
      toast.error("Erro ao salvar configuração")
    } finally {
      setSaving(false)
    }
  }

  const toggleField = (field: keyof RequiredFieldsConfig) => {
    setConfig((prev) => ({ ...prev, [field]: !prev[field] }))
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
      <div className="space-y-6">
        <PageHeader
          icon={Settings}
          title="Campos Obrigatórios"
          subtitle="Configure quais campos são obrigatórios no cadastro de alunos"
          backHref="/configuracoes"
        />
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Acesso Negado</CardTitle>
            <CardDescription>Apenas administradores e coordenadores podem acessar esta página.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Settings}
        title="Campos Obrigatórios - Cadastro de Alunos"
        subtitle="Defina quais campos são obrigatórios no formulário de cadastro"
        backHref="/configuracoes"
      />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados Básicos</CardTitle>
            <CardDescription>Informações fundamentais do aluno</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="nome_completo" className="flex-1">
                Nome Completo
              </Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="nome_completo"
                  checked={config.nome_completo}
                  onCheckedChange={() => toggleField("nome_completo")}
                />
                {config.nome_completo && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="data_nascimento" className="flex-1">
                Data de Nascimento
              </Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="data_nascimento"
                  checked={config.data_nascimento}
                  onCheckedChange={() => toggleField("data_nascimento")}
                />
                {config.data_nascimento && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="sexo" className="flex-1">
                Sexo
              </Label>
              <div className="flex items-center gap-2">
                <Switch id="sexo" checked={config.sexo} onCheckedChange={() => toggleField("sexo")} />
                {config.sexo && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="naturalidade" className="flex-1">
                Naturalidade
              </Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="naturalidade"
                  checked={config.naturalidade}
                  onCheckedChange={() => toggleField("naturalidade")}
                />
                {config.naturalidade && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="cpf" className="flex-1">
                CPF
              </Label>
              <div className="flex items-center gap-2">
                <Switch id="cpf" checked={config.cpf} onCheckedChange={() => toggleField("cpf")} />
                {config.cpf && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="rg" className="flex-1">
                RG
              </Label>
              <div className="flex items-center gap-2">
                <Switch id="rg" checked={config.rg} onCheckedChange={() => toggleField("rg")} />
                {config.rg && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Certidão de Nascimento</CardTitle>
            <CardDescription>Dados do documento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="certidao_nascimento_numero" className="flex-1">
                Número de Registro
              </Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="certidao_nascimento_numero"
                  checked={config.certidao_nascimento_numero}
                  onCheckedChange={() => toggleField("certidao_nascimento_numero")}
                />
                {config.certidao_nascimento_numero && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="certidao_livro" className="flex-1">
                Livro nº
              </Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="certidao_livro"
                  checked={config.certidao_livro}
                  onCheckedChange={() => toggleField("certidao_livro")}
                />
                {config.certidao_livro && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="certidao_folha" className="flex-1">
                Folha nº
              </Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="certidao_folha"
                  checked={config.certidao_folha}
                  onCheckedChange={() => toggleField("certidao_folha")}
                />
                {config.certidao_folha && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="certidao_data_emissao" className="flex-1">
                Data de Emissão
              </Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="certidao_data_emissao"
                  checked={config.certidao_data_emissao}
                  onCheckedChange={() => toggleField("certidao_data_emissao")}
                />
                {config.certidao_data_emissao && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="certidao_cartorio" className="flex-1">
                Nome do Cartório
              </Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="certidao_cartorio"
                  checked={config.certidao_cartorio}
                  onCheckedChange={() => toggleField("certidao_cartorio")}
                />
                {config.certidao_cartorio && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Endereço e Contatos</CardTitle>
            <CardDescription>Localização e formas de contato</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="endereco" className="flex-1">
                Endereço
              </Label>
              <div className="flex items-center gap-2">
                <Switch id="endereco" checked={config.endereco} onCheckedChange={() => toggleField("endereco")} />
                {config.endereco && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="bairro" className="flex-1">
                Bairro
              </Label>
              <div className="flex items-center gap-2">
                <Switch id="bairro" checked={config.bairro} onCheckedChange={() => toggleField("bairro")} />
                {config.bairro && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="cidade" className="flex-1">
                Cidade
              </Label>
              <div className="flex items-center gap-2">
                <Switch id="cidade" checked={config.cidade} onCheckedChange={() => toggleField("cidade")} />
                {config.cidade && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="uf" className="flex-1">
                UF
              </Label>
              <div className="flex items-center gap-2">
                <Switch id="uf" checked={config.uf} onCheckedChange={() => toggleField("uf")} />
                {config.uf && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="cep" className="flex-1">
                CEP
              </Label>
              <div className="flex items-center gap-2">
                <Switch id="cep" checked={config.cep} onCheckedChange={() => toggleField("cep")} />
                {config.cep && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label htmlFor="telefone" className="flex-1">
                Celular
              </Label>
              <div className="flex items-center gap-2">
                <Switch id="telefone" checked={config.telefone} onCheckedChange={() => toggleField("telefone")} />
                {config.telefone && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="email" className="flex-1">
                E-mail
              </Label>
              <div className="flex items-center gap-2">
                <Switch id="email" checked={config.email} onCheckedChange={() => toggleField("email")} />
                {config.email && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados dos Pais e Responsável</CardTitle>
            <CardDescription>Informações dos responsáveis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="nome_mae" className="flex-1">
                Nome da Mãe
              </Label>
              <div className="flex items-center gap-2">
                <Switch id="nome_mae" checked={config.nome_mae} onCheckedChange={() => toggleField("nome_mae")} />
                {config.nome_mae && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="celular_mae" className="flex-1">
                Celular da Mãe
              </Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="celular_mae"
                  checked={config.celular_mae}
                  onCheckedChange={() => toggleField("celular_mae")}
                />
                {config.celular_mae && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="nome_pai" className="flex-1">
                Nome do Pai
              </Label>
              <div className="flex items-center gap-2">
                <Switch id="nome_pai" checked={config.nome_pai} onCheckedChange={() => toggleField("nome_pai")} />
                {config.nome_pai && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="celular_pai" className="flex-1">
                Celular do Pai
              </Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="celular_pai"
                  checked={config.celular_pai}
                  onCheckedChange={() => toggleField("celular_pai")}
                />
                {config.celular_pai && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label htmlFor="nome_responsavel" className="flex-1">
                Nome do Responsável
              </Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="nome_responsavel"
                  checked={config.nome_responsavel}
                  onCheckedChange={() => toggleField("nome_responsavel")}
                />
                {config.nome_responsavel && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="telefone_responsavel" className="flex-1">
                Telefone do Responsável
              </Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="telefone_responsavel"
                  checked={config.telefone_responsavel}
                  onCheckedChange={() => toggleField("telefone_responsavel")}
                />
                {config.telefone_responsavel && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="email_responsavel" className="flex-1">
                E-mail do Responsável
              </Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="email_responsavel"
                  checked={config.email_responsavel}
                  onCheckedChange={() => toggleField("email_responsavel")}
                />
                {config.email_responsavel && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Responsável Financeiro</CardTitle>
            <CardDescription>Dados do responsável pelas finanças</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="resp_fin_nome" className="flex-1">
                Nome Completo
              </Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="resp_fin_nome"
                  checked={config.resp_fin_nome}
                  onCheckedChange={() => toggleField("resp_fin_nome")}
                />
                {config.resp_fin_nome && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="resp_fin_cpf" className="flex-1">
                CPF
              </Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="resp_fin_cpf"
                  checked={config.resp_fin_cpf}
                  onCheckedChange={() => toggleField("resp_fin_cpf")}
                />
                {config.resp_fin_cpf && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="resp_fin_telefone" className="flex-1">
                Telefone para Contato
              </Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="resp_fin_telefone"
                  checked={config.resp_fin_telefone}
                  onCheckedChange={() => toggleField("resp_fin_telefone")}
                />
                {config.resp_fin_telefone && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados da Matrícula</CardTitle>
            <CardDescription>Informações do cadastro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="periodo_letivo" className="flex-1">
                Período Letivo
              </Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="periodo_letivo"
                  checked={config.periodo_letivo}
                  onCheckedChange={() => toggleField("periodo_letivo")}
                />
                {config.periodo_letivo && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="nivel" className="flex-1">
                Nível
              </Label>
              <div className="flex items-center gap-2">
                <Switch id="nivel" checked={config.nivel} onCheckedChange={() => toggleField("nivel")} />
                {config.nivel && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="turno_preferencial" className="flex-1">
                Turno
              </Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="turno_preferencial"
                  checked={config.turno_preferencial}
                  onCheckedChange={() => toggleField("turno_preferencial")}
                />
                {config.turno_preferencial && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : "Salvar Configuração"}
          </Button>
        </div>
      </div>
    </div>
  )
}
