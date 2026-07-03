"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Clock } from "lucide-react"

interface DiaInteiroFieldProps {
  allDay: boolean
  horaInicioDefault: string
  horaFimDefault: string
}

export function DiaInteiroField({ allDay, horaInicioDefault, horaFimDefault }: DiaInteiroFieldProps) {
  const [diaInteiro, setDiaInteiro] = useState(allDay)

  return (
    <>
      <input type="hidden" name="dia_inteiro" value={String(diaInteiro)} />
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="dia-inteiro"
          checked={diaInteiro}
          onChange={(e) => setDiaInteiro(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="dia-inteiro" className="cursor-pointer">Dia Inteiro</Label>
      </div>
      {!diaInteiro && (
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="hora_inicio" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Hora Início
            </Label>
            <Input id="hora_inicio" name="hora_inicio" type="time" defaultValue={horaInicioDefault} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hora_fim" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Hora Fim
            </Label>
            <Input id="hora_fim" name="hora_fim" type="time" defaultValue={horaFimDefault} />
          </div>
        </div>
      )}
    </>
  )
}
