"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Users, Save, Check, X, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { salvarAulaPresenca } from "../../actions"

interface Aluno {
  id: string
  nome_completo: string
  email: string
}

interface TurmaDisciplina {
  id: string
  turmas: { nome: string; serie: string }
  disciplinas: { nome: string; codigo: string }
  professores: { nome_completo: string }
}

export default function PresencaPage({
  params,
}: {
  params: { turmaId: string; disciplinaId: string }
}) {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [turmaDisciplina, setTurmaDisciplina] = useState<TurmaDisciplina | null>(null)
  const [presencas, setPresencas] = useState<Record<string, "presente" | "ausente" | "justificado">>({})
  const [dataAula, setDataAula] = useState(new Date().toISOString().split("T")[0])
  const [horaInicio, setHoraInicio] = useState("")
  const [horaFim, setHoraFim] = useState("")
  const [conteudo, setConteudo] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data: tdData, error: tdError } = await supabase
        .from("turma_disciplinas")
        .select("*")
        .eq("turma_id", params.turmaId)
        .eq("disciplina_id", params.disciplinaId)
        .single()

      if (tdError) {
        console.error("[v0] Erro ao buscar turma_disciplina:", tdError)
        throw tdError
      }

      if (!tdData) {
        console.error("[v0] Turma disciplina não encontrada")
        return
      }

      // Buscar turma separadamente
      const { data: turma } = await supabase
        .from("turmas")
        .select("nome, serie, ano_letivo")
        .eq("id", params.turmaId)
        .single()

      // Buscar disciplina separadamente
      const { data: disciplina } = await supabase
        .from("disciplinas")
        .select("nome, codigo")
        .eq("id", params.disciplinaId)
        .single()

      // Buscar professor separadamente
      const { data: professor } = await supabase
        .from("professores")
        .select("nome_completo")
        .eq("id", tdData.professor_id)
        .single()

      setTurmaDisciplina({
        id: tdData.id,
        turmas: turma || { nome: "", serie: "" },
        disciplinas: disciplina || { nome: "", codigo: "" },
        professores: professor || { nome_completo: "" },
      })

      // Buscar alunos da turma (matrículas ativas)
      const { data: matriculas, error: matriculasError } = await supabase
        .from("matriculas")
        .select("aluno_id")
        .eq("turma_id", params.turmaId)
        .eq("status", "ativa")

      if (matriculasError) {
        console.error("[v0] Erro ao buscar matrículas:", matriculasError)
        throw matriculasError
      }

      console.log("[v0] Matrículas encontradas:", matriculas?.length)

      if (!matriculas || matriculas.length === 0) {
        setAlunos([])
        setLoading(false)
        return
      }

      // Buscar dados dos alunos separadamente
      const alunoIds = matriculas.map((m) => m.aluno_id)
      const { data: alunosData, error: alunosError } = await supabase
        .from("alunos")
        .select("id, nome_completo, email")
        .in("id", alunoIds)
        .order("nome_completo")

      if (alunosError) {
        console.error("[v0] Erro ao buscar alunos:", alunosError)
        throw alunosError
      }

      console.log("[v0] Alunos encontrados:", alunosData?.length)

      setAlunos(alunosData || [])

      // Inicializar presenças como 'presente'
      const presencasIniciais: Record<string, "presente" | "ausente" | "justificado"> = {}
      alunosData?.forEach((aluno) => {
        presencasIniciais[aluno.id] = "presente"
      })
      setPresencas(presencasIniciais)
    } catch (error) {
      console.error("[v0] Erro ao carregar dados:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da turma",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function setPresencaStatus(alunoId: string, status: "presente" | "ausente" | "justificado") {
    setPresencas((prev) => ({
      ...prev,
      [alunoId]: status,
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

    if (!horaInicio || !horaFim) {
      toast({
        title: "Erro",
        description: "Os horários de início e fim são obrigatórios",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const result = await salvarAulaPresenca({
        turmaDisciplinaId: turmaDisciplina!.id,
        dataAula,
        horaInicio,
        horaFim,
        conteudo,
        presencas,
        turmaId: params.turmaId,
        disciplinaId: params.disciplinaId,
      })

      if (result.error) throw new Error(result.error)

      toast({
        title: "Sucesso",
        description: "Aula e presenças registradas com sucesso!",
      })

      router.push(`/diario/${params.turmaId}/${params.disciplinaId}`)
      router.refresh()
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao registrar aula e presenca",
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
  const presentes = Object.values(presencas).filter((p) => p === "presente").length
  const ausentes = Object.values(presencas).filter((p) => p === "ausente").length
  const justificados = Object.values(presencas).filter((p) => p === "justificado").length

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Registrar Nova Aula</h1>
            <p className="text-gray-600">
              {turmaDisciplina?.disciplinas.nome} - {turmaDisciplina?.turmas.nome}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/diario/${params.turmaId}/${params.disciplinaId}`}>
              <BookOpen className="h-4 w-4 mr-2" />
              Ver Diário
            </Link>
          </Button>
          <Button onClick={salvarPresenca} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : "Salvar Aula"}
          </Button>
        </div>
      </div>

      {alunos.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum aluno encontrado</h3>
            <p className="text-gray-600 mb-4">Esta turma não possui alunos matriculados ativos.</p>
            <Button asChild>
              <Link href="/matriculas">Gerenciar Matrículas</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
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
                    <Badge variant="outline" className="text-yellow-600">
                      {justificados} Justificados
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alunos.map((aluno) => (
                    <div key={aluno.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">{aluno.nome_completo.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{aluno.nome_completo}</p>
                          <p className="text-sm text-gray-600">{aluno.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={presencas[aluno.id] === "presente" ? "default" : "outline"}
                          onClick={() => setPresencaStatus(aluno.id, "presente")}
                          className={presencas[aluno.id] === "presente" ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={presencas[aluno.id] === "ausente" ? "default" : "outline"}
                          onClick={() => setPresencaStatus(aluno.id, "ausente")}
                          className={presencas[aluno.id] === "ausente" ? "bg-red-600 hover:bg-red-700" : ""}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={presencas[aluno.id] === "justificado" ? "default" : "outline"}
                          onClick={() => setPresencaStatus(aluno.id, "justificado")}
                          className={presencas[aluno.id] === "justificado" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                        >
                          J
                        </Button>
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
                  <label className="text-sm font-medium text-gray-700">Data da Aula *</label>
                  <Input type="date" value={dataAula} onChange={(e) => setDataAula(e.target.value)} />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Horário de Início *</label>
                  <Input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    placeholder="Ex: 08:00"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Horário de Fim *</label>
                  <Input
                    type="time"
                    value={horaFim}
                    onChange={(e) => setHoraFim(e.target.value)}
                    placeholder="Ex: 09:00"
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
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Justificados:</span>
                  <span className="font-medium text-yellow-600">{justificados}</span>
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
      )}
    </div>
  )
}
