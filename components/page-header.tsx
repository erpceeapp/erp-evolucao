import type React from "react"
import type { LucideIcon } from "lucide-react"
import { BackButton } from "./back-button"

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  backHref?: string
  showBackButton?: boolean
  actions?: React.ReactNode
}

export function PageHeader({ icon: Icon, title, subtitle, backHref, showBackButton = true, actions }: PageHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {showBackButton && <BackButton backHref={backHref} />}
          <div className="bg-blue-600 p-2.5 rounded-lg shrink-0">
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{title}</h1>
            {subtitle && <p className="text-sm text-gray-600 truncate">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
