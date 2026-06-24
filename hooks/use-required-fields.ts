"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

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
      const supabase = createClient()

      const { data, error } = await supabase.from("config_campos_obrigatorios").select("campo, obrigatorio")

      if (error) {
        throw error
      }

      const fieldsMap = (data || []).reduce(
        (acc, field) => {
          acc[field.campo] = field.obrigatorio
          return acc
        },
        {} as Record<string, boolean>,
      )

      setRequiredFields(fieldsMap)
    } catch (error) {
      toast.error("Erro ao carregar campos obrigatórios")
      setRequiredFields({
        nome_completo: true,
        data_nascimento: true,
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
