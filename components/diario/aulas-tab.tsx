"use client"

import { BookOpen, Plus, Calendar, Eye } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface AulasTabProps {
  aulas: any[]
  turmaDisciplina: any
  turmaId: string
  disciplinaId: string
  matriculas: any[]
}

export default function AulasTab({ aulas, turmaDisciplina, turmaId, disciplinaId, matriculas }: AulasTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Aulas Registradas</CardTitle>
            <Button asChild className="bg-cyan-600 hover:bg-cyan-700">
              <Link href={`/presenca/${turmaId}/${disciplinaId}`}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Chamada
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aulas.length > 0 ? (
                aulas.map((aula) => (
                  <div key={aula.id} className="border rounded-lg p-4 hover:border-cyan-300 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-900">
                            {new Date(aula.data_aula + "T00:00:00").toLocaleDateString("pt-BR")}
                          </span>
                          {aula.horario && (
                            <span className="text-sm text-gray-500">
                              {aula.horario}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      {aula.conteudo_ministrado && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700">Conteúdo:</h5>
                          <p className="text-sm text-gray-600">{aula.conteudo_ministrado}</p>
                        </div>
                      )}

                      {aula.observacoes && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700">Observações:</h5>
                          <p className="text-sm text-gray-600">{aula.observacoes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/diario/${turmaId}/${disciplinaId}/presencas`}>
                          <Eye className="h-3 w-3 mr-1" />
                          Ver Histórico
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma aula registrada</h3>
                  <p className="text-gray-600 mb-4">Comece registrando a primeira chamada desta disciplina.</p>
                  <Button asChild className="bg-cyan-600 hover:bg-cyan-700">
                    <Link href={`/presenca/${turmaId}/${disciplinaId}`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar Primeira Chamada
                    </Link>
                  </Button>
                </div>
              )}
            </div>
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
