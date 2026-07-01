"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Save } from "lucide-react"
import { translateError } from "@/lib/error-messages"

type Matricula = {
  id: string
  aluno_id: string
  numero_matricula: string
  alunos: {
    id: string
    nome_completo: string
    matricula: string
  }
}

type Nota = {
  id: string
  matricula_id: string
  disciplina_id: string
  bimestre: number
  nota: number
  tipo_avaliacao: string
  observacoes: string | null
}

export function NotasTable({
  turmaId,
  disciplinaId,
  matriculas,
  notasExistentes,
}: {
  turmaId: string
  disciplinaId: string
  matriculas: Matricula[]
  notasExistentes: Nota[]
}) {
  const [notas, setNotas] = useState<Record<string, Record<number, string>>>(() => {
    const initialNotas: Record<string, Record<number, string>> = {}
    matriculas.forEach((matricula) => {
      initialNotas[matricula.id] = {}
      for (let bimestre = 1; bimestre <= 4; bimestre++) {
        const notaExistente = notasExistentes.find((n) => n.matricula_id === matricula.id && n.bimestre === bimestre)
        initialNotas[matricula.id][bimestre] = notaExistente ? String(notaExistente.nota) : ""
      }
    })
    return initialNotas
  })

  const [saving, setSaving] = useState(false)

  const handleNotaChange = (matriculaId: string, bimestre: number, rawValue: string) => {
    if (rawValue === "") {
      setNotas((prev) => ({
        ...prev,
        [matriculaId]: { ...prev[matriculaId], [bimestre]: "" },
      }))
      return
    }

    const normalized = rawValue.replace(",", ".")

    if (!/^[\d.]*$/.test(normalized)) return

    if ((normalized.match(/\./g) || []).length > 1) return

    if (/^\d+$/.test(normalized)) {
      const num = Number(normalized)
      if (num > 10) {
        const value = normalized.slice(0, -1) + "." + normalized.slice(-1)
        const converted = Number(value)
        if (!isNaN(converted) && converted >= 0 && converted <= 10) {
          setNotas((prev) => ({
            ...prev,
            [matriculaId]: { ...prev[matriculaId], [bimestre]: value },
          }))
          return
        }
        return
      }
    }

    setNotas((prev) => ({
      ...prev,
      [matriculaId]: {
        ...prev[matriculaId],
        [bimestre]: rawValue,
      },
    }))
  }

  const handleBlur = (matriculaId: string, bimestre: number) => {
    setNotas((prev) => {
      const value = prev[matriculaId]?.[bimestre]
      if (!value || value === "") return prev

      const normalized = value.replace(",", ".")
      const num = Number(normalized)
      if (isNaN(num) || num < 0 || num > 10) return prev

      return {
        ...prev,
        [matriculaId]: { ...prev[matriculaId], [bimestre]: num.toFixed(1) },
      }
    })
  }

  const handleSalvar = async () => {
    setSaving(true)
    const supabase = createClient()

    try {
      const notasToSave: any[] = []

      for (const matriculaId in notas) {
        for (let bimestre = 1; bimestre <= 4; bimestre++) {
          const notaValue = notas[matriculaId][bimestre]
          if (notaValue !== "") {
            // Buscar nota existente no banco para obter o ID correto
            const notaExistente = notasExistentes.find(
              (n) => n.matricula_id === matriculaId && n.bimestre === bimestre
            )

            notasToSave.push({
              matricula_id: matriculaId,
              disciplina_id: disciplinaId,
              bimestre: bimestre,
              nota: Number(notaValue),
              tipo_avaliacao: "Avaliacao",
              data_avaliacao: new Date().toISOString().split("T")[0],
            })
          }
        }
      }

      if (notasToSave.length > 0) {
        // Usar upsert para inserir ou atualizar baseado na constraint UNIQUE
        const { error } = await supabase
          .from("notas")
          .upsert(notasToSave, {
            onConflict: "matricula_id,disciplina_id,bimestre",
            ignoreDuplicates: false,
          })

        if (error) throw error
      }

      toast.success("Notas salvas com sucesso!")
    } catch (error: any) {
      toast.error(translateError(error.message) || "Erro ao salvar notas")
    } finally {
      setSaving(false)
    }
  }

  const calcularMedia = (matriculaId: string) => {
    let soma = 0
    let count = 0
    for (let bimestre = 1; bimestre <= 4; bimestre++) {
      const nota = notas[matriculaId]?.[bimestre]
      if (nota !== "" && !isNaN(Number(nota))) {
        soma += Number(nota)
        count++
      }
    }
    return count > 0 ? (soma / count).toFixed(2) : "-"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Notas dos Alunos</CardTitle>
          <Button onClick={handleSalvar} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : "Salvar Notas"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Aluno</TableHead>
                <TableHead className="min-w-[120px]">Matrícula</TableHead>
                <TableHead className="text-center">1º Bim</TableHead>
                <TableHead className="text-center">2º Bim</TableHead>
                <TableHead className="text-center">3º Bim</TableHead>
                <TableHead className="text-center">4º Bim</TableHead>
                <TableHead className="text-center">Média</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matriculas.map((matricula) => (
                <TableRow key={matricula.id}>
                  <TableCell className="font-medium">{matricula.alunos.nome_completo}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{matricula.alunos.matricula}</Badge>
                  </TableCell>
                  {[1, 2, 3, 4].map((bimestre) => (
                    <TableCell key={bimestre}>
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        placeholder="0.0"
                        value={notas[matricula.id]?.[bimestre] || ""}
                        onChange={(e) => handleNotaChange(matricula.id, bimestre, e.target.value)}
                        onBlur={() => handleBlur(matricula.id, bimestre)}
                        className="w-20 text-center"
                      />
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-semibold">{calcularMedia(matricula.id)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {matriculas.length === 0 && (
          <div className="text-center py-8 text-gray-500">Nenhum aluno matriculado nesta turma.</div>
        )}
      </CardContent>
    </Card>
  )
}
