"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Users, Save, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

interface Aluno {
  id: string
  nome: string
  email: string
}

interface TurmaDisciplina {
  turmas: { nome: string; serie: string }
  disciplinas: { nome: string; codigo: string }
  professores: { nome: string }
}

export default function PresencaPage({
  params,
}: {
  params: { turmaId: string; disciplinaId: string }
}) {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [turmaDisciplina, setTurmaDisciplina] = useState<TurmaDisciplina | null>(null)
  const [presencas, setPresencas] = useState<Record<string, boolean>>({})
  const [dataAula, setDataAula] = useState(new Date().toISOString().split("T")[0])
  const [numeroAula, setNumeroAula] = useState("")
  const [conteudo, setConteudo] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const supabase = createBrowserClient()
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      // Buscar informações da turma e disciplina
      const { data: turmaDisciplinaData } = await supabase
        .from("turma_disciplinas")
        .select(`
          turmas (nome, serie),
          disciplinas (nome, codigo),
          professores (nome)
        `)
        .eq("turma_id", params.turmaId)
        .eq("disciplina_id", params.disciplinaId)
        .single()

      setTurmaDisciplina(turmaDisciplinaData)

      // Buscar alunos da turma
      const { data: matriculas } = await supabase
        .from("matriculas")
        .select(`
          alunos (id, nome, email)
        `)
        .eq("turma_id", params.turmaId)
        .eq("status", "ativa")

      const alunosData = matriculas?.map((m) => m.alunos).filter(Boolean) as Aluno[]
      setAlunos(alunosData || [])

      // Inicializar presenças como true (presente)
      const presencasIniciais: Record<string, boolean> = {}
      alunosData?.forEach((aluno) => {
        presencasIniciais[aluno.id] = true
      })
      setPresencas(presencasIniciais)

      // Buscar próximo número de aula
      const { data: ultimaAula } = await supabase
        .from("aulas")
        .select("numero_aula")
        .eq("turma_id", params.turmaId)
        .eq("disciplina_id", params.disciplinaId)
        .order("numero_aula", { ascending: false })
        .limit(1)
        .single()

      setNumeroAula(String((ultimaAula?.numero_aula || 0) + 1))
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  function togglePresenca(alunoId: string) {
    setPresencas((prev) => ({
      ...prev,
      [alunoId]: !prev[alunoId],
    }))
  }

  async function salvarPresenca() {
    if (!conteudo.trim()) {
      toast({
        title: "Erro",
        description: "O conteúdo da aula é obrigatório",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      // Criar registro da aula
      const { data: aula, error: aulaError } = await supabase
        .from("aulas")
        .insert({
          turma_id: params.turmaId,
          disciplina_id: params.disciplinaId,
          data_aula: dataAula,
          numero_aula: Number.parseInt(numeroAula),
          conteudo,
          observacoes,
          status: "realizada",
        })
        .select()
        .single()

      if (aulaError) throw aulaError

      // Registrar presenças
      const presencasData = Object.entries(presencas).map(([alunoId, presente]) => ({
        aula_id: aula.id,
        aluno_id: alunoId,
        presente,
        data_presenca: dataAula,
      }))

      const { error: presencaError } = await supabase.from("presencas").insert(presencasData)

      if (presencaError) throw presencaError

      toast({
        title: "Sucesso",
        description: "Presença registrada com sucesso!",
      })

      router.push(`/diario/${params.turmaId}/${params.disciplinaId}`)
    } catch (error) {
      console.error("Erro ao salvar presença:", error)
      toast({
        title: "Erro",
        description: "Erro ao registrar presença",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="container mx-auto p-6">Carregando...</div>
  }

  const totalAlunos = alunos.length
  const presentes = Object.values(presencas).filter(Boolean).length
  const ausentes = totalAlunos - presentes

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <Users className="h-6 w-6 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Registro de Presença</h1>
            <p className="text-gray-600">
              {turmaDisciplina?.disciplinas.nome} - {turmaDisciplina?.turmas.nome}
            </p>
          </div>
        </div>
        <Button onClick={salvarPresenca} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Presença"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lista de Presença</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-green-600">
                    <Check className="h-3 w-3 mr-1" />
                    {presentes} Presentes
                  </Badge>
                  <Badge variant="outline" className="text-red-600">
                    <X className="h-3 w-3 mr-1" />
                    {ausentes} Ausentes
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alunos.map((aluno) => (
                  <div
                    key={aluno.id}
                    className={`
                      flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors
                      ${
                        presencas[aluno.id]
                          ? "bg-green-50 border-green-200 hover:bg-green-100"
                          : "bg-red-50 border-red-200 hover:bg-red-100"
                      }
                    `}
                    onClick={() => togglePresenca(aluno.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">{aluno.nome.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{aluno.nome}</p>
                        <p className="text-sm text-gray-600">{aluno.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {presencas[aluno.id] ? (
                        <Badge className="bg-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          Presente
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <X className="h-3 w-3 mr-1" />
                          Ausente
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Aula</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Data da Aula</label>
                <Input type="date" value={dataAula} onChange={(e) => setDataAula(e.target.value)} />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Número da Aula</label>
                <Input
                  type="number"
                  value={numeroAula}
                  onChange={(e) => setNumeroAula(e.target.value)}
                  placeholder="Ex: 1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Conteúdo *</label>
                <Textarea
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  placeholder="Descreva o conteúdo ministrado na aula..."
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Observações</label>
                <Textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações adicionais..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total de Alunos:</span>
                <span className="font-medium">{totalAlunos}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Presentes:</span>
                <span className="font-medium text-green-600">{presentes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Ausentes:</span>
                <span className="font-medium text-red-600">{ausentes}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-sm text-gray-600">Frequência:</span>
                <span className="font-medium">
                  {totalAlunos > 0 ? Math.round((presentes / totalAlunos) * 100) : 0}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
