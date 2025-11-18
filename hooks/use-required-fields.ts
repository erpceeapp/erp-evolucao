"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

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

      console.log("[v0] Loading required fields configuration")
      
      const { data, error } = await supabase.from("config_campos_obrigatorios").select("campo, obrigatorio")

      if (error) {
        console.error("[v0] Error loading required fields:", error)
        throw error
      }

      console.log("[v0] Loaded required fields:", data)

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
