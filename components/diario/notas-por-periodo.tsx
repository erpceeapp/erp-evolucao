"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Save } from 'lucide-react'

interface NotasPorPeriodoProps {
  matriculas: any[]
  disciplinaId: string
  periodo: any
}

export default function NotasPorPeriodo({ matriculas, disciplinaId, periodo }: NotasPorPeriodoProps) {
  const [notas, setNotas] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadNotas()
  }, [matriculas, disciplinaId, periodo])

  const loadNotas = async () => {
    const supabase = createClient()

    const matriculaIds = matriculas.map((m) => m.id)
    const { data } = await supabase
      .from("notas")
      .select("*")
      .in("matricula_id", matriculaIds)
      .eq("disciplina_id", disciplinaId)
      .eq("bimestre", periodo.numero_periodo)

    if (data) {
      const notasMap: { [key: string]: string } = {}
      data.forEach((nota) => {
        notasMap[nota.matricula_id] = nota.nota?.toString() || ""
      })
      setNotas(notasMap)
    }
  }

  const handleSaveNotas = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      // Preparar dados para upsert
      const notasParaSalvar = Object.entries(notas)
        .filter(([_, nota]) => nota !== "")
        .map(([matriculaId, nota]) => ({
          matricula_id: matriculaId,
          disciplina_id: disciplinaId,
          bimestre: periodo.numero_periodo,
          nota: parseFloat(nota),
          data_avaliacao: new Date().toISOString().split("T")[0],
        }))

      if (notasParaSalvar.length === 0) {
        toast.error("Preencha pelo menos uma nota")
        setLoading(false)
        return
      }

      // Deletar notas existentes
      await supabase
        .from("notas")
        .delete()
        .in(
          "matricula_id",
          notasParaSalvar.map((n) => n.matricula_id)
        )
        .eq("disciplina_id", disciplinaId)
        .eq("bimestre", periodo.numero_periodo)

      // Inserir novas notas
      const { error } = await supabase.from("notas").insert(notasParaSalvar)

      if (error) throw error

      toast.success("Notas salvas com sucesso!")
    } catch (error) {
      toast.error("Erro ao salvar notas. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border">
        <div className="grid grid-cols-2 gap-4 p-4 font-medium bg-gray-50 border-b">
          <div>Aluno</div>
          <div>Nota (0-10)</div>
        </div>
        <div className="divide-y">
          {matriculas.map((matricula) => (
            <div key={matricula.id} className="grid grid-cols-2 gap-4 p-4 items-center">
              <div>
                <p className="font-medium text-gray-900">{matricula.alunos.nome_completo}</p>
                <p className="text-sm text-gray-600">Matrícula: {matricula.numero_matricula}</p>
              </div>
              <div>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  placeholder="0.0"
                  value={notas[matricula.id] || ""}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === "" || (parseFloat(value) >= 0 && parseFloat(value) <= 10)) {
                      setNotas({ ...notas, [matricula.id]: value })
                    }
                  }}
                  className="w-32"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSaveNotas} disabled={loading} className="bg-cyan-600 hover:bg-cyan-700">
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Salvando..." : "Salvar Notas"}
        </Button>
      </div>
    </div>
  )
}
