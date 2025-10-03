import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProfessoresHeader } from "@/components/professores/professores-header"
import { ProfessorForm } from "@/components/professores/professor-form"

export default async function NovoProfessorPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfessoresHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Novo Professor</h1>
          <p className="text-gray-600 mt-1">Preencha os dados para cadastrar um novo professor</p>
        </div>

        <ProfessorForm />
      </main>
    </div>
  )
}
