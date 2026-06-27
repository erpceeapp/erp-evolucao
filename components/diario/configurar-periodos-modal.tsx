"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Calendar } from "lucide-react"
import { translateError } from "@/lib/error-messages"

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
        })),
      )
    }
  }, [periodosExistentes])

  const handleSave = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      // Deletar períodos existentes do ano
      const { error: deleteError } = await supabase.from("periodos_letivos").delete().eq("ano_letivo", anoLetivo)

      if (deleteError) {
        throw deleteError
      }

      // Inserir novos períodos
      const periodosParaInserir = periodos.map((p) => ({
        ano_letivo: anoLetivo,
        numero_periodo: p.numero_periodo,
        nome: p.nome,
        data_inicio: p.data_inicio,
        data_fim: p.data_fim,
        ativo: true,
      }))

      const { error: insertError } = await supabase.from("periodos_letivos").insert(periodosParaInserir)

      if (insertError) {
        throw insertError
      }

      toast.success("Períodos configurados com sucesso!")
      onOpenChange(false)
      window.location.reload()
    } catch (error: any) {
      toast.error(translateError(error.message) || "Erro ao salvar períodos")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Configurar Períodos - Ano Letivo {anoLetivo}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {periodos.map((periodo, index) => (
            <div key={index} className="p-5 border-2 rounded-lg bg-slate-50 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-cyan-600" />
                <h3 className="font-semibold text-lg">{periodo.nome}</h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nome do Período</Label>
                  <Input
                    value={periodo.nome}
                    onChange={(e) => {
                      const newPeriodos = [...periodos]
                      newPeriodos[index].nome = e.target.value
                      setPeriodos(newPeriodos)
                    }}
                    placeholder="Ex: 1º Bimestre"
                    className="h-11"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Data de Início</Label>
                    <Input
                      type="date"
                      value={periodo.data_inicio}
                      onChange={(e) => {
                        const newPeriodos = [...periodos]
                        newPeriodos[index].data_inicio = e.target.value
                        setPeriodos(newPeriodos)
                      }}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Data de Término</Label>
                    <Input
                      type="date"
                      value={periodo.data_fim}
                      onChange={(e) => {
                        const newPeriodos = [...periodos]
                        newPeriodos[index].data_fim = e.target.value
                        setPeriodos(newPeriodos)
                      }}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11 px-6">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading} className="bg-cyan-600 hover:bg-cyan-700 h-11 px-6">
              {loading ? "Salvando..." : "Salvar Configuração"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
