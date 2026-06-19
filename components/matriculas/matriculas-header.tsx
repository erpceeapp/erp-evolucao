import { Button } from "@/components/ui/button"
import { UserCheck, ArrowLeft } from "lucide-react"
import Link from "next/link"

export function MatriculasHeader() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <div className="bg-orange-600 p-2 rounded-lg">
              <UserCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Centro Educacional Evolução</h1>
              <p className="text-sm text-gray-600">Sistema de Matrículas</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
