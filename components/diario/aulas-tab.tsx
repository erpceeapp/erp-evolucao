"use client"

import { BookOpen, Plus, Calendar, Clock, Eye, Pencil, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface AulasTabProps {
  aulas: any[]
  turmaDisciplina: any
  turmaId: string
  disciplinaId: string
  matriculas: any[]
}

export default function AulasTab({ aulas, turmaDisciplina, turmaId, disciplinaId, matriculas }: AulasTabProps) {
  const router = useRouter()

  const aulasOrdenadas = [...aulas].sort((a, b) => {
    const dateA = new Date(a.data_aula)
    const dateB = new Date(b.data_aula)
    return dateB.getTime() - dateA.getTime()
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Aulas Registradas</CardTitle>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline">
                <Link href={`/diario/${turmaId}/${disciplinaId}/presencas`}>
                  <History className="h-4 w-4 mr-2" />
                  Histórico de Presenças
                </Link>
              </Button>
              <Button asChild className="bg-cyan-600 hover:bg-cyan-700">
                <Link href={`/diario/${turmaId}/${disciplinaId}/nova-aula`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Aula
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {aulasOrdenadas.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Conteúdo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aulasOrdenadas.map((aula) => (
                    <TableRow
                      key={aula.id}
                      className="cursor-pointer hover:bg-cyan-50 transition-colors"
                      onClick={() => router.push(`/diario/${turmaId}/${disciplinaId}/presencas/${aula.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">
                            {new Date(aula.data_aula + "T12:00:00").toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {aula.hora_inicio && aula.hora_fim
                              ? `${aula.hora_inicio} - ${aula.hora_fim}`
                              : aula.hora_inicio || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 line-clamp-2">
                          {aula.conteudo ? aula.conteudo.replace(/<[^>]*>/g, "") : "Sem conteúdo registrado"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/diario/${turmaId}/${disciplinaId}/aulas/${aula.id}/editar`)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/diario/${turmaId}/${disciplinaId}/presencas/${aula.id}`)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Chamada
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma aula registrada</h3>
                <p className="text-gray-600 mb-4">
                  Comece registrando a primeira aula com lista de presença desta disciplina.
                </p>
                <Button asChild className="bg-cyan-600 hover:bg-cyan-700">
                  <Link href={`/diario/${turmaId}/${disciplinaId}/nova-aula`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Primeira Aula
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações da Disciplina</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Código:</p>
              <p className="text-sm text-gray-600">{turmaDisciplina.disciplinas.codigo}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Carga Horária Total:</p>
              <p className="text-sm text-gray-600">{turmaDisciplina.disciplinas.carga_horaria}h</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Aulas Ministradas:</p>
              <p className="text-sm text-gray-600">{aulas.length} aulas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alunos da Turma ({matriculas.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {matriculas.map((matricula) => (
                <div
                  key={matricula.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-cyan-700">
                      {matricula.alunos.nome_completo.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{matricula.alunos.nome_completo}</p>
                    <p className="text-xs text-gray-600 truncate">{matricula.alunos.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
