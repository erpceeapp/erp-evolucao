import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TurmasHeader } from "@/components/turmas/turmas-header"
import { DisciplinaForm } from "@/components/disciplinas/disciplina-form"

export default async function NovaDisciplinaPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TurmasHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Nova Disciplina</h1>
          <p className="text-gray-600 mt-1">Preencha os dados para cadastrar uma nova disciplina</p>
        </div>

        <DisciplinaForm />
      </main>
    </div>
  )
}
