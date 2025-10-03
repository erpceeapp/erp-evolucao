"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, type LucideIcon } from "lucide-react"
import { useRouter } from "next/navigation"

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  backHref?: string
  showBackButton?: boolean
}

export function PageHeader({ icon: Icon, title, subtitle, backHref, showBackButton = true }: PageHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (backHref) {
      router.push(backHref)
    } else {
      router.back()
    }
  }

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 mb-6">
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Button variant="ghost" size="sm" onClick={handleBack} className="shrink-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        )}
        <div className="bg-blue-600 p-2.5 rounded-lg shrink-0">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{title}</h1>
          {subtitle && <p className="text-sm text-gray-600 truncate">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}
