"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, Plus } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ConfigurarPeriodosModal from "./configurar-periodos-modal"
import NotasPorPeriodo from "./notas-por-periodo"

interface NotasTabProps {
  matriculas: any[]
  disciplinaId: string
  periodos: any[]
  anoLetivo: number
  isProfessor?: boolean
}

export default function NotasTab({ matriculas, disciplinaId, periodos, anoLetivo, isProfessor = false }: NotasTabProps) {
  const [showConfigModal, setShowConfigModal] = useState(false)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Configuração de Períodos</CardTitle>
          {!isProfessor && (
            <Button onClick={() => setShowConfigModal(true)} variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Configurar Períodos
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {periodos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {periodos.map((periodo) => (
                <div
                  key={periodo.id}
                  className="p-4 border rounded-lg hover:border-cyan-300 transition-colors bg-gradient-to-br from-cyan-50 to-white"
                >
                  <h4 className="font-semibold text-cyan-900 mb-2">{periodo.nome}</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Início:</span>{" "}
                      {new Date(periodo.data_inicio + "T00:00:00").toLocaleDateString("pt-BR")}
                    </p>
                    <p>
                      <span className="font-medium">Fim:</span>{" "}
                      {new Date(periodo.data_fim + "T00:00:00").toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum período configurado</h3>
              <p className="text-gray-600 mb-4">Configure os períodos/bimestres para começar a lançar notas.</p>
              {!isProfessor && (
                <Button onClick={() => setShowConfigModal(true)} className="bg-cyan-600 hover:bg-cyan-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Configurar Períodos
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {periodos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lançamento de Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={`periodo-${periodos[0]?.numero_periodo}`}>
              <TabsList className="grid w-full grid-cols-4">
                {periodos.map((periodo) => (
                  <TabsTrigger key={periodo.id} value={`periodo-${periodo.numero_periodo}`}>
                    {periodo.nome}
                  </TabsTrigger>
                ))}
              </TabsList>

              {periodos.map((periodo) => (
                <TabsContent key={periodo.id} value={`periodo-${periodo.numero_periodo}`}>
                  <NotasPorPeriodo
                    matriculas={matriculas}
                    disciplinaId={disciplinaId}
                    periodo={periodo}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {!isProfessor && (
        <ConfigurarPeriodosModal
          open={showConfigModal}
          onOpenChange={setShowConfigModal}
          anoLetivo={anoLetivo}
          periodosExistentes={periodos}
        />
      )}
    </div>
  )
}
