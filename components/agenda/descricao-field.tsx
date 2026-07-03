"use client"

import { useState } from "react"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

interface DescricaoFieldProps {
  defaultValue?: string
}

export function DescricaoField({ defaultValue = "" }: DescricaoFieldProps) {
  const [value, setValue] = useState(defaultValue)

  return (
    <>
      <RichTextEditor
        value={value}
        onChange={setValue}
        placeholder="Detalhes sobre o evento..."
        minHeight={120}
      />
      <input type="hidden" name="descricao" value={value} />
    </>
  )
}
