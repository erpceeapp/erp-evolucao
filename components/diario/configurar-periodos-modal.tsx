"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Plus, Trash2 } from 'lucide-react'

interface ConfigurarPeriodosModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  anoLetivo: number
  periodosExistentes: any[]
}

export default function ConfigurarPeriodosModal({
  open,
  onOpenChange,
  anoLetivo,
  periodosExistentes,
}: ConfigurarPeriodosModalProps) {
  const [periodos, setPeriodos] = useState([
    { numero_periodo: 1, nome: "1º Bimestre", data_inicio: "", data_fim: "" },
    { numero_periodo: 2, nome: "2º Bimestre", data_inicio: "", data_fim: "" },
    { numero_periodo: 3, nome: "3º Bimestre", data_inicio: "", data_fim: "" },
    { numero_periodo: 4, nome: "4º Bimestre", data_inicio: "", data_fim: "" },
  ])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (periodosExistentes.length > 0) {
      setPeriodos(
        periodosExistentes.map((p) => ({
          numero_periodo: p.numero_periodo,
          nome: p.nome,
          data_inicio: p.data_inicio,
          data_fim: p.data_fim,
        }))
      )
    }
  }, [periodosExistentes])

  const handleSave = async () => {
    setLoading(true)
    try {
      const supabase = createBrowserClient()

      // Deletar períodos existentes do ano
      await supabase.from("periodos_letivos").delete().eq("ano_letivo", anoLetivo)

      // Inserir novos períodos
      const periodosParaInserir = periodos.map((p) => ({
        ano_letivo: anoLetivo,
        numero_periodo: p.numero_periodo,
        nome: p.nome,
        data_inicio: p.data_inicio,
        data_fim: p.data_fim,
        ativo: true,
      }))

      const { error } = await supabase.from("periodos_letivos").insert(periodosParaInserir)

      if (error) throw error

      toast.success("Períodos configurados com sucesso!")
      onOpenChange(false)
      window.location.reload()
    } catch (error) {
      console.error("Erro ao salvar períodos:", error)
      toast.error("Erro ao salvar períodos. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Períodos - Ano Letivo {anoLetivo}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {periodos.map((periodo, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Período</Label>
                  <Input
                    value={periodo.nome}
                    onChange={(e) => {
                      const newPeriodos = [...periodos]
                      newPeriodos[index].nome = e.target.value
                      setPeriodos(newPeriodos)
                    }}
                    placeholder="Ex: 1º Bimestre"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={periodo.data_inicio}
                    onChange={(e) => {
                      const newPeriodos = [...periodos]
                      newPeriodos[index].data_inicio = e.target.value
                      setPeriodos(newPeriodos)
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={periodo.data_fim}
                    onChange={(e) => {
                      const newPeriodos = [...periodos]
                      newPeriodos[index].data_fim = e.target.value
                      setPeriodos(newPeriodos)
                    }}
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading} className="bg-cyan-600 hover:bg-cyan-700">
              {loading ? "Salvando..." : "Salvar Configuração"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
