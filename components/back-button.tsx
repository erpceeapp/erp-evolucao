"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface BackButtonProps {
  backHref?: string
}

export function BackButton({ backHref }: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    if (backHref) {
      router.push(backHref)
    } else {
      router.back()
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleBack} className="shrink-0">
      <ArrowLeft className="h-4 w-4 mr-2" />
      Voltar
    </Button>
  )
}
