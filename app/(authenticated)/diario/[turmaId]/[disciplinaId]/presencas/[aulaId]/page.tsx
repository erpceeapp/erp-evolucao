"use client"

import { createClient } from "@/lib/supabase/client"
import { Eye, Calendar, Clock, BookOpen, Users, Check, X, Edit, Save, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import PageHeader from "@/components/page-header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { useEffect, use } from "react"

import { useState } from "react"
import { salvarPresencas } from "./actions"

async function getAulaDetalhes(aulaId: string, turmaId: string, disciplinaId: string) {
  const supabase = createClient()

  // Buscar aula
  const { data: aula } = await supabase.from("aulas").select("*").eq("id", aulaId).single()

  if (!aula) return null

  // Buscar turma_disciplina
  const { data: turmaDisciplina } = await supabase
    .from("turma_disciplinas")
    .select("id, turma_id, disciplina_id, professor_id")
    .eq("turma_id", turmaId)
    .eq("disciplina_id", disciplinaId)
    .single()

  if (!turmaDisciplina) return null

  // Buscar dados relacionados
  const [turmaRes, disciplinaRes, professorRes] = await Promise.all([
    supabase.from("turmas").select("nome, serie").eq("id", turmaId).single(),
    supabase.from("disciplinas").select("nome").eq("id", disciplinaId).single(),
    turmaDisciplina.professor_id
      ? supabase.from("professores").select("nome_completo").eq("id", turmaDisciplina.professor_id).single()
      : Promise.resolve({ data: null, error: null }),
  ])

  const { data: matriculas } = await supabase
    .from("matriculas")
    .select("aluno_id, numero_matricula")
    .eq("turma_id", turmaId)
    .eq("status", "ativa")

  const alunoIds = matriculas?.map((m) => m.aluno_id) || []

  // Buscar alunos
  const { data: alunos } = await supabase
    .from("alunos")
    .select("id, nome_completo, email, matricula")
    .in("id", alunoIds)

  // Buscar presenças existentes
  const { data: presencasExistentes } = await supabase
    .from("presencas")
    .select("id, presente, aluno_id, justificativa")
    .eq("aula_id", aulaId)

  let presencas = presencasExistentes || []

  if (!presencasExistentes || presencasExistentes.length === 0) {
    const presencasParaCriar = alunoIds.map((alunoId) => ({
      aula_id: aulaId,
      aluno_id: alunoId,
      presente: true, // Default: presente
      justificativa: null,
    }))

    const { data: novasPresencas, error } = await supabase
      .from("presencas")
      .upsert(presencasParaCriar, { onConflict: "aula_id,aluno_id" })
      .select("id, presente, aluno_id, justificativa")

    if (error) {
      toast.error("Erro ao carregar presenças")
    } else {
      presencas = novasPresencas || []
    }
  }

  // Combinar dados
  const presencasComAlunos = (presencas || [])
    .map((presenca) => {
      const aluno = alunos?.find((a) => a.id === presenca.aluno_id)
      const matricula = matriculas?.find((m) => m.aluno_id === presenca.aluno_id)
      return {
        ...presenca,
        aluno,
        numero_matricula: matricula?.numero_matricula || aluno?.matricula,
      }
    })
    .sort((a, b) => (a.aluno?.nome_completo || "").localeCompare(b.aluno?.nome_completo || ""))

  const totalPresentes = presencas?.filter((p) => p.presente).length || 0
  const totalAusentes = presencas?.filter((p) => !p.presente).length || 0

  return {
    aula,
    turma: turmaRes.data,
    disciplina: disciplinaRes.data,
    professor: professorRes.data,
    presencas: presencasComAlunos,
    totalPresentes,
    totalAusentes,
    totalAlunos: presencas?.length || 0,
  }
}

export default function AulaDetalhePage({
  params,
}: {
  params: Promise<{ turmaId: string; disciplinaId: string; aulaId: string }>
}) {
  const p = use(params)
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [presencas, setPresencas] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const result = await getAulaDetalhes(p.aulaId, p.turmaId, p.disciplinaId)
    if (result) {
      setData(result)
      setPresencas(result.presencas)
    }
  }

  function togglePresenca(presencaId: string) {
    setPresencas((prev) => prev.map((p) => (p.id === presencaId ? { ...p, presente: !p.presente } : p)))
  }

  function updateJustificativa(presencaId: string, justificativa: string) {
    setPresencas((prev) => prev.map((p) => (p.id === presencaId ? { ...p, justificativa } : p)))
  }

  async function salvarAlteracoes() {
    setIsLoading(true)

    try {
      const path = `/diario/${p.turmaId}/${p.disciplinaId}/presencas`
      const result = await salvarPresencas(
        p.aulaId,
        presencas.map((p) => ({
          id: p.id,
          presente: p.presente,
          justificativa: p.justificativa || null,
        })),
        path
      )

      if (result.error) throw new Error(result.error)

      toast.success("Presenças atualizadas com sucesso!")
      setIsEditing(false)
      await loadData()
      router.refresh()
    } catch (error: any) {
      toast.error("Erro ao salvar alterações: " + (error.message || "Erro desconhecido"))
    } finally {
      setIsLoading(false)
    }
  }

  if (!data) {
    return <div className="container mx-auto p-6">Carregando...</div>
  }

  const { aula, turma, disciplina, professor } = data
  const totalPresentes = presencas.filter((p) => p.presente).length
  const totalAusentes = presencas.filter((p) => !p.presente).length
  const totalAlunos = presencas.length
  const percentualPresenca = totalAlunos > 0 ? Math.round((totalPresentes / totalAlunos) * 100) : 0

  return (
    <>
      <PageHeader
        icon={Eye}
        title="Detalhes da Aula"
        description={`${disciplina.nome} - ${turma.nome}`}
        backHref={`/diario/${p.turmaId}/${p.disciplinaId}/presencas`}
      >
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar Presenças
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={salvarAlteracoes} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false)
                loadData()
              }}
              disabled={isLoading}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {isEditing && (
            <Card className="border-orange-500 bg-orange-50">
              <CardContent className="pt-6">
                <p className="text-sm text-orange-700">
                  Modo de edição ativado. Clique nos botões de presença/ausência para alterar o status dos alunos. Não
                  esqueça de salvar as alterações.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Informações da Aula</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Data</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(aula.data_aula).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Horário</p>
                    <p className="text-sm text-muted-foreground">
                      {aula.hora_inicio && aula.hora_fim
                        ? `${aula.hora_inicio} - ${aula.hora_fim}`
                        : aula.hora_inicio || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {aula.conteudo_ministrado && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Conteúdo Ministrado</p>
                  </div>
                  <div className="text-sm text-muted-foreground pl-6 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: aula.conteudo_ministrado }} />
                </div>
              )}
              {aula.observacoes && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">Observações</span>
                  </div>
                  <div className="text-sm text-muted-foreground pl-6 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: aula.observacoes }} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Presença</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Nome do Aluno</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Justificativa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {presencas.map((presenca) => (
                    <TableRow key={presenca.id}>
                      <TableCell>
                        <Badge variant="outline">{presenca.numero_matricula}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{presenca.aluno?.nome_completo}</TableCell>
                      <TableCell className="text-center">
                        {isEditing ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePresenca(presenca.id)}
                            className="h-auto p-0"
                          >
                            {presenca.presente ? (
                              <Badge className="bg-green-600 cursor-pointer hover:bg-green-700">
                                <Check className="h-3 w-3 mr-1" />
                                Presente
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="cursor-pointer hover:bg-red-700">
                                <X className="h-3 w-3 mr-1" />
                                Ausente
                              </Badge>
                            )}
                          </Button>
                        ) : presenca.presente ? (
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
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <input
                            type="text"
                            value={presenca.justificativa || ""}
                            onChange={(e) => updateJustificativa(presenca.id, e.target.value)}
                            placeholder="Adicionar justificativa..."
                            className="w-full px-2 py-1 text-sm border rounded"
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">{presenca.justificativa || "-"}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo da Chamada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total de Alunos</span>
                </div>
                <Badge variant="outline" className="text-lg">
                  {totalAlunos}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Presentes</span>
                </div>
                <Badge className="bg-green-600 text-lg">{totalPresentes}</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-700">Ausentes</span>
                </div>
                <Badge variant="destructive" className="text-lg">
                  {totalAusentes}
                </Badge>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Percentual de Presença</span>
                  <Badge variant={percentualPresenca >= 75 ? "default" : "secondary"} className="text-lg">
                    {percentualPresenca}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Professor</p>
                <p className="text-sm">{professor?.nome_completo || "Sem professor"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Turma</p>
                <p className="text-sm">
                  {turma.nome} - {turma.serie}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Disciplina</p>
                <p className="text-sm">{disciplina.nome}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
