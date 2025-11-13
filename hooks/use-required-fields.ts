"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"

interface RequiredField {
  campo: string
  obrigatorio: boolean
}

export function useRequiredFields() {
  const [requiredFields, setRequiredFields] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRequiredFields()
  }, [])

  async function loadRequiredFields() {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { data, error } = await supabase.from("config_campos_obrigatorios").select("campo, obrigatorio")

      if (error) throw error

      const fieldsMap = (data || []).reduce(
        (acc, field) => {
          acc[field.campo] = field.obrigatorio
          return acc
        },
        {} as Record<string, boolean>,
      )

      setRequiredFields(fieldsMap)
    } catch (error) {
      console.error("[v0] Erro ao carregar configurações de campos obrigatórios:", error)
      setRequiredFields({
        nome_completo: true,
        data_nascimento: true,
        nome_responsavel: true,
        telefone_responsavel: true,
        nivel: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const isRequired = (fieldName: string): boolean => {
    return requiredFields[fieldName] ?? false
  }

  return { requiredFields, isRequired, loading }
}
