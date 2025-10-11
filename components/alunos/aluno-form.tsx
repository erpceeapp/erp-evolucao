"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save } from "lucide-react"
import Link from "next/link"
import { cadastrarAluno, atualizarAluno } from "@/app/(authenticated)/alunos/novo/actions"
import { Separator } from "@/components/ui/separator"

interface AlunoData {
  // Dados básicos
  nome_completo: string
  data_nascimento: string
  sexo: string
  naturalidade: string
  cpf: string
  rg: string

  // Certidão de nascimento
  certidao_nascimento_numero: string
  certidao_livro: string
  certidao_folha: string
  certidao_data_emissao: string
  certidao_cartorio: string
  certidao_uf: string

  // Endereço
  endereco: string
  endereco_numero: string
  bairro: string
  cidade: string
  uf: string
  cep: string

  // Contatos
  telefone_residencial: string
  telefone_comercial: string
  telefone: string
  email: string

  // Dados dos pais
  nome_mae: string
  profissao_mae: string
  celular_mae: string
  nome_pai: string
  profissao_pai: string
  celular_pai: string

  // Responsável geral
  nome_responsavel: string
  telefone_responsavel: string
  email_responsavel: string

  // Responsável financeiro
  resp_fin_nome: string
  resp_fin_data_nascimento: string
  resp_fin_estado_civil: string
  resp_fin_cpf: string
  resp_fin_identidade: string
  resp_fin_orgao_emissor: string
  resp_fin_uf: string
  resp_fin_grau_parentesco: string
  resp_fin_endereco: string
  resp_fin_bairro: string
  resp_fin_telefone: string
  resp_fin_cidade: string
  resp_fin_uf_endereco: string
  resp_fin_cep: string

  // Informações médicas
  uso_medicamento_continuo: boolean
  medicamento_continuo_qual: string
  alergia_medicamento: boolean
  alergia_medicamento_qual: string
  alergia_alimento: boolean
  alergia_alimento_qual: string

  // Dados da matrícula
  periodo_letivo: string
  nivel: string
  turno_preferencial: string
  responsavel_matricula: string

  observacoes: string
  ativo: boolean
}

interface AlunoFormProps {
  aluno?: AlunoData & { id: string }
  isEditing?: boolean
}

export function AlunoForm({ aluno, isEditing = false }: AlunoFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<AlunoData>({
    nome_completo: aluno?.nome_completo || "",
    data_nascimento: aluno?.data_nascimento || "",
    sexo: aluno?.sexo || "",
    naturalidade: aluno?.naturalidade || "",
    cpf: aluno?.cpf || "",
    rg: aluno?.rg || "",
    certidao_nascimento_numero: aluno?.certidao_nascimento_numero || "",
    certidao_livro: aluno?.certidao_livro || "",
    certidao_folha: aluno?.certidao_folha || "",
    certidao_data_emissao: aluno?.certidao_data_emissao || "",
    certidao_cartorio: aluno?.certidao_cartorio || "",
    certidao_uf: aluno?.certidao_uf || "",
    endereco: aluno?.endereco || "",
    endereco_numero: aluno?.endereco_numero || "",
    bairro: aluno?.bairro || "",
    cidade: aluno?.cidade || "",
    uf: aluno?.uf || "",
    cep: aluno?.cep || "",
    telefone_residencial: aluno?.telefone_residencial || "",
    telefone_comercial: aluno?.telefone_comercial || "",
    telefone: aluno?.telefone || "",
    email: aluno?.email || "",
    nome_mae: aluno?.nome_mae || "",
    profissao_mae: aluno?.profissao_mae || "",
    celular_mae: aluno?.celular_mae || "",
    nome_pai: aluno?.nome_pai || "",
    profissao_pai: aluno?.profissao_pai || "",
    celular_pai: aluno?.celular_pai || "",
    nome_responsavel: aluno?.nome_responsavel || "",
    telefone_responsavel: aluno?.telefone_responsavel || "",
    email_responsavel: aluno?.email_responsavel || "",
    resp_fin_nome: aluno?.resp_fin_nome || "",
    resp_fin_data_nascimento: aluno?.resp_fin_data_nascimento || "",
    resp_fin_estado_civil: aluno?.resp_fin_estado_civil || "",
    resp_fin_cpf: aluno?.resp_fin_cpf || "",
    resp_fin_identidade: aluno?.resp_fin_identidade || "",
    resp_fin_orgao_emissor: aluno?.resp_fin_orgao_emissor || "",
    resp_fin_uf: aluno?.resp_fin_uf || "",
    resp_fin_grau_parentesco: aluno?.resp_fin_grau_parentesco || "",
    resp_fin_endereco: aluno?.resp_fin_endereco || "",
    resp_fin_bairro: aluno?.resp_fin_bairro || "",
    resp_fin_telefone: aluno?.resp_fin_telefone || "",
    resp_fin_cidade: aluno?.resp_fin_cidade || "",
    resp_fin_uf_endereco: aluno?.resp_fin_uf_endereco || "",
    resp_fin_cep: aluno?.resp_fin_cep || "",
    uso_medicamento_continuo: aluno?.uso_medicamento_continuo ?? false,
    medicamento_continuo_qual: aluno?.medicamento_continuo_qual || "",
    alergia_medicamento: aluno?.alergia_medicamento ?? false,
    alergia_medicamento_qual: aluno?.alergia_medicamento_qual || "",
    alergia_alimento: aluno?.alergia_alimento ?? false,
    alergia_alimento_qual: aluno?.alergia_alimento_qual || "",
    periodo_letivo: aluno?.periodo_letivo || "",
    nivel: aluno?.nivel || "",
    turno_preferencial: aluno?.turno_preferencial || "",
    responsavel_matricula: aluno?.responsavel_matricula || "",
    observacoes: aluno?.observacoes || "",
    ativo: aluno?.ativo ?? true,
  })

  const handleInputChange = (field: keyof AlunoData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formDataToSend = new FormData(e.currentTarget)

      if (isEditing && aluno) {
        await atualizarAluno(aluno.id, formDataToSend)
      } else {
        await cadastrarAluno(formDataToSend)
      }
    } catch (error: any) {
      setError(error.message || "Erro ao salvar aluno")
      setIsLoading(false)
    }
  }

  const ufs = [
    "AC",
    "AL",
    "AP",
    "AM",
    "BA",
    "CE",
    "DF",
    "ES",
    "GO",
    "MA",
    "MT",
    "MS",
    "MG",
    "PA",
    "PB",
    "PR",
    "PE",
    "PI",
    "RJ",
    "RN",
    "RS",
    "RO",
    "RR",
    "SC",
    "SP",
    "SE",
    "TO",
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados Pessoais</CardTitle>
          <CardDescription>Informações básicas do aluno</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome_completo">
                Nome Completo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nome_completo"
                name="nome_completo"
                required
                value={formData.nome_completo}
                onChange={(e) => handleInputChange("nome_completo", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_nascimento">
                Data de Nascimento <span className="text-red-500">*</span>
              </Label>
              <Input
                id="data_nascimento"
                name="data_nascimento"
                type="date"
                required
                value={formData.data_nascimento}
                onChange={(e) => handleInputChange("data_nascimento", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sexo">Sexo</Label>
              <Select value={formData.sexo} onValueChange={(value) => handleInputChange("sexo", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="naturalidade">Naturalidade</Label>
              <Input
                id="naturalidade"
                name="naturalidade"
                placeholder="Cidade - UF"
                value={formData.naturalidade}
                onChange={(e) => handleInputChange("naturalidade", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF da Criança</Label>
              <Input
                id="cpf"
                name="cpf"
                value={formData.cpf}
                onChange={(e) => handleInputChange("cpf", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rg">RG</Label>
              <Input id="rg" name="rg" value={formData.rg} onChange={(e) => handleInputChange("rg", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Certidão de Nascimento</CardTitle>
          <CardDescription>Dados da certidão de nascimento do aluno</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="certidao_nascimento_numero">Nº de Registro</Label>
              <Input
                id="certidao_nascimento_numero"
                name="certidao_nascimento_numero"
                value={formData.certidao_nascimento_numero}
                onChange={(e) => handleInputChange("certidao_nascimento_numero", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certidao_livro">Livro nº</Label>
              <Input
                id="certidao_livro"
                name="certidao_livro"
                value={formData.certidao_livro}
                onChange={(e) => handleInputChange("certidao_livro", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certidao_folha">Folha nº</Label>
              <Input
                id="certidao_folha"
                name="certidao_folha"
                value={formData.certidao_folha}
                onChange={(e) => handleInputChange("certidao_folha", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="certidao_data_emissao">Data de Emissão</Label>
              <Input
                id="certidao_data_emissao"
                name="certidao_data_emissao"
                type="date"
                value={formData.certidao_data_emissao}
                onChange={(e) => handleInputChange("certidao_data_emissao", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certidao_cartorio">Nome do Cartório</Label>
              <Input
                id="certidao_cartorio"
                name="certidao_cartorio"
                value={formData.certidao_cartorio}
                onChange={(e) => handleInputChange("certidao_cartorio", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certidao_uf">UF do Cartório</Label>
              <Select value={formData.certidao_uf} onValueChange={(value) => handleInputChange("certidao_uf", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {ufs.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endereço e Contatos</CardTitle>
          <CardDescription>Localização residencial e formas de contato</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-4">Endereço</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    name="endereco"
                    value={formData.endereco}
                    onChange={(e) => handleInputChange("endereco", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endereco_numero">Número</Label>
                  <Input
                    id="endereco_numero"
                    name="endereco_numero"
                    value={formData.endereco_numero}
                    onChange={(e) => handleInputChange("endereco_numero", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    name="bairro"
                    value={formData.bairro}
                    onChange={(e) => handleInputChange("bairro", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    name="cidade"
                    value={formData.cidade}
                    onChange={(e) => handleInputChange("cidade", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uf">UF</Label>
                  <Select value={formData.uf} onValueChange={(value) => handleInputChange("uf", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {ufs.map((uf) => (
                        <SelectItem key={uf} value={uf}>
                          {uf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    name="cep"
                    value={formData.cep}
                    onChange={(e) => handleInputChange("cep", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-4">Contatos</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone_residencial">Telefone Residencial</Label>
                  <Input
                    id="telefone_residencial"
                    name="telefone_residencial"
                    type="tel"
                    value={formData.telefone_residencial}
                    onChange={(e) => handleInputChange("telefone_residencial", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone_comercial">Telefone Comercial</Label>
                  <Input
                    id="telefone_comercial"
                    name="telefone_comercial"
                    type="tel"
                    value={formData.telefone_comercial}
                    onChange={(e) => handleInputChange("telefone_comercial", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Outro Telefone</Label>
                  <Input
                    id="telefone"
                    name="telefone"
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange("telefone", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados dos Pais</CardTitle>
          <CardDescription>Informações dos pais e responsável geral</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-4">Dados da Mãe</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome_mae">Nome da Mãe</Label>
                <Input
                  id="nome_mae"
                  name="nome_mae"
                  value={formData.nome_mae}
                  onChange={(e) => handleInputChange("nome_mae", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profissao_mae">Profissão</Label>
                <Input
                  id="profissao_mae"
                  name="profissao_mae"
                  value={formData.profissao_mae}
                  onChange={(e) => handleInputChange("profissao_mae", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="celular_mae">Celular</Label>
                <Input
                  id="celular_mae"
                  name="celular_mae"
                  type="tel"
                  value={formData.celular_mae}
                  onChange={(e) => handleInputChange("celular_mae", e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-4">Dados do Pai</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome_pai">Nome do Pai</Label>
                <Input
                  id="nome_pai"
                  name="nome_pai"
                  value={formData.nome_pai}
                  onChange={(e) => handleInputChange("nome_pai", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profissao_pai">Profissão</Label>
                <Input
                  id="profissao_pai"
                  name="profissao_pai"
                  value={formData.profissao_pai}
                  onChange={(e) => handleInputChange("profissao_pai", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="celular_pai">Celular</Label>
                <Input
                  id="celular_pai"
                  name="celular_pai"
                  type="tel"
                  value={formData.celular_pai}
                  onChange={(e) => handleInputChange("celular_pai", e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-4">Responsável Geral</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome_responsavel">Nome</Label>
                <Input
                  id="nome_responsavel"
                  name="nome_responsavel"
                  value={formData.nome_responsavel}
                  onChange={(e) => handleInputChange("nome_responsavel", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone_responsavel">Telefone</Label>
                <Input
                  id="telefone_responsavel"
                  name="telefone_responsavel"
                  type="tel"
                  value={formData.telefone_responsavel}
                  onChange={(e) => handleInputChange("telefone_responsavel", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email_responsavel">E-mail</Label>
                <Input
                  id="email_responsavel"
                  name="email_responsavel"
                  type="email"
                  value={formData.email_responsavel}
                  onChange={(e) => handleInputChange("email_responsavel", e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Responsável Financeiro</CardTitle>
          <CardDescription>Dados completos do responsável financeiro</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="resp_fin_nome">Nome Completo</Label>
              <Input
                id="resp_fin_nome"
                name="resp_fin_nome"
                value={formData.resp_fin_nome}
                onChange={(e) => handleInputChange("resp_fin_nome", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resp_fin_data_nascimento">Data de Nascimento</Label>
              <Input
                id="resp_fin_data_nascimento"
                name="resp_fin_data_nascimento"
                type="date"
                value={formData.resp_fin_data_nascimento}
                onChange={(e) => handleInputChange("resp_fin_data_nascimento", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="resp_fin_estado_civil">Estado Civil</Label>
              <Select
                value={formData.resp_fin_estado_civil}
                onValueChange={(value) => handleInputChange("resp_fin_estado_civil", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                  <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                  <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                  <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                  <SelectItem value="União Estável">União Estável</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resp_fin_grau_parentesco">Grau de Parentesco</Label>
              <Input
                id="resp_fin_grau_parentesco"
                name="resp_fin_grau_parentesco"
                placeholder="Ex: Pai, Mãe, Avô, Tio"
                value={formData.resp_fin_grau_parentesco}
                onChange={(e) => handleInputChange("resp_fin_grau_parentesco", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="resp_fin_cpf">CPF</Label>
              <Input
                id="resp_fin_cpf"
                name="resp_fin_cpf"
                value={formData.resp_fin_cpf}
                onChange={(e) => handleInputChange("resp_fin_cpf", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resp_fin_identidade">Identidade (RG)</Label>
              <Input
                id="resp_fin_identidade"
                name="resp_fin_identidade"
                value={formData.resp_fin_identidade}
                onChange={(e) => handleInputChange("resp_fin_identidade", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="resp_fin_orgao_emissor">Órgão Emissor</Label>
              <Input
                id="resp_fin_orgao_emissor"
                name="resp_fin_orgao_emissor"
                placeholder="Ex: SSP"
                value={formData.resp_fin_orgao_emissor}
                onChange={(e) => handleInputChange("resp_fin_orgao_emissor", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resp_fin_uf">UF</Label>
              <Select value={formData.resp_fin_uf} onValueChange={(value) => handleInputChange("resp_fin_uf", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {ufs.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-4">Endereço do Responsável Financeiro</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resp_fin_endereco">Endereço</Label>
                <Input
                  id="resp_fin_endereco"
                  name="resp_fin_endereco"
                  value={formData.resp_fin_endereco}
                  onChange={(e) => handleInputChange("resp_fin_endereco", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="resp_fin_bairro">Bairro</Label>
                  <Input
                    id="resp_fin_bairro"
                    name="resp_fin_bairro"
                    value={formData.resp_fin_bairro}
                    onChange={(e) => handleInputChange("resp_fin_bairro", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resp_fin_cidade">Cidade</Label>
                  <Input
                    id="resp_fin_cidade"
                    name="resp_fin_cidade"
                    value={formData.resp_fin_cidade}
                    onChange={(e) => handleInputChange("resp_fin_cidade", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resp_fin_uf_endereco">UF</Label>
                  <Select
                    value={formData.resp_fin_uf_endereco}
                    onValueChange={(value) => handleInputChange("resp_fin_uf_endereco", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {ufs.map((uf) => (
                        <SelectItem key={uf} value={uf}>
                          {uf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resp_fin_cep">CEP</Label>
                  <Input
                    id="resp_fin_cep"
                    name="resp_fin_cep"
                    value={formData.resp_fin_cep}
                    onChange={(e) => handleInputChange("resp_fin_cep", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resp_fin_telefone">Telefone para Contato</Label>
                <Input
                  id="resp_fin_telefone"
                  name="resp_fin_telefone"
                  type="tel"
                  value={formData.resp_fin_telefone}
                  onChange={(e) => handleInputChange("resp_fin_telefone", e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações Médicas</CardTitle>
          <CardDescription>Dados importantes sobre saúde do aluno</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="uso_medicamento_continuo"
                checked={formData.uso_medicamento_continuo}
                onCheckedChange={(checked) => handleInputChange("uso_medicamento_continuo", checked)}
              />
              <Label htmlFor="uso_medicamento_continuo">Uso contínuo de algum medicamento</Label>
            </div>
            {formData.uso_medicamento_continuo && (
              <div className="space-y-2 ml-6">
                <Label htmlFor="medicamento_continuo_qual">Qual medicamento?</Label>
                <Textarea
                  id="medicamento_continuo_qual"
                  name="medicamento_continuo_qual"
                  rows={2}
                  placeholder="Descreva o(s) medicamento(s) e a dosagem"
                  value={formData.medicamento_continuo_qual}
                  onChange={(e) => handleInputChange("medicamento_continuo_qual", e.target.value)}
                />
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="alergia_medicamento"
                checked={formData.alergia_medicamento}
                onCheckedChange={(checked) => handleInputChange("alergia_medicamento", checked)}
              />
              <Label htmlFor="alergia_medicamento">Alergia a algum medicamento</Label>
            </div>
            {formData.alergia_medicamento && (
              <div className="space-y-2 ml-6">
                <Label htmlFor="alergia_medicamento_qual">Qual medicamento?</Label>
                <Textarea
                  id="alergia_medicamento_qual"
                  name="alergia_medicamento_qual"
                  rows={2}
                  placeholder="Descreva o(s) medicamento(s) que causam alergia"
                  value={formData.alergia_medicamento_qual}
                  onChange={(e) => handleInputChange("alergia_medicamento_qual", e.target.value)}
                />
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="alergia_alimento"
                checked={formData.alergia_alimento}
                onCheckedChange={(checked) => handleInputChange("alergia_alimento", checked)}
              />
              <Label htmlFor="alergia_alimento">Alergia a algum alimento</Label>
            </div>
            {formData.alergia_alimento && (
              <div className="space-y-2 ml-6">
                <Label htmlFor="alergia_alimento_qual">Qual alimento?</Label>
                <Textarea
                  id="alergia_alimento_qual"
                  name="alergia_alimento_qual"
                  rows={2}
                  placeholder="Descreva o(s) alimento(s) que causam alergia"
                  value={formData.alergia_alimento_qual}
                  onChange={(e) => handleInputChange("alergia_alimento_qual", e.target.value)}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Matrícula</CardTitle>
          <CardDescription>Informações sobre a matrícula do aluno</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="periodo_letivo">Período Letivo</Label>
              <Input
                id="periodo_letivo"
                name="periodo_letivo"
                placeholder="Ex: 2024"
                value={formData.periodo_letivo}
                onChange={(e) => handleInputChange("periodo_letivo", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nivel">Nível</Label>
              <Select value={formData.nivel} onValueChange={(value) => handleInputChange("nivel", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Educação Infantil">Educação Infantil</SelectItem>
                  <SelectItem value="Ensino Fundamental I">Ensino Fundamental I</SelectItem>
                  <SelectItem value="Ensino Fundamental II">Ensino Fundamental II</SelectItem>
                  <SelectItem value="Ensino Médio">Ensino Médio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="turno_preferencial">Turno</Label>
              <Select
                value={formData.turno_preferencial}
                onValueChange={(value) => handleInputChange("turno_preferencial", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Matutino">Matutino</SelectItem>
                  <SelectItem value="Vespertino">Vespertino</SelectItem>
                  <SelectItem value="Noturno">Noturno</SelectItem>
                  <SelectItem value="Integral">Integral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="responsavel_matricula">Responsável pela Matrícula</Label>
              <Input
                id="responsavel_matricula"
                name="responsavel_matricula"
                value={formData.responsavel_matricula}
                onChange={(e) => handleInputChange("responsavel_matricula", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              name="observacoes"
              rows={4}
              placeholder="Informações adicionais sobre o aluno ou a matrícula"
              value={formData.observacoes}
              onChange={(e) => handleInputChange("observacoes", e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => handleInputChange("ativo", checked)}
            />
            <Label htmlFor="ativo">Aluno ativo</Label>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="flex justify-end gap-4">
        <Button variant="outline" asChild>
          <Link href="/alunos">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "Salvando..." : isEditing ? "Atualizar" : "Cadastrar"}
        </Button>
      </div>

      {/* Hidden inputs para campos booleanos e selects */}
      <input type="hidden" name="uso_medicamento_continuo" value={formData.uso_medicamento_continuo.toString()} />
      <input type="hidden" name="alergia_medicamento" value={formData.alergia_medicamento.toString()} />
      <input type="hidden" name="alergia_alimento" value={formData.alergia_alimento.toString()} />
      <input type="hidden" name="ativo" value={formData.ativo.toString()} />
      <input type="hidden" name="sexo" value={formData.sexo} />
      <input type="hidden" name="certidao_uf" value={formData.certidao_uf} />
      <input type="hidden" name="uf" value={formData.uf} />
      <input type="hidden" name="resp_fin_estado_civil" value={formData.resp_fin_estado_civil} />
      <input type="hidden" name="resp_fin_uf" value={formData.resp_fin_uf} />
      <input type="hidden" name="resp_fin_uf_endereco" value={formData.resp_fin_uf_endereco} />
      <input type="hidden" name="nivel" value={formData.nivel} />
      <input type="hidden" name="turno_preferencial" value={formData.turno_preferencial} />
    </form>
  )
}
