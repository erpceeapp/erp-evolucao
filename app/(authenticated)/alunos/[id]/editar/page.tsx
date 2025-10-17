import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AlunosHeader } from "@/components/alunos/alunos-header"
import { AlunoForm } from "@/components/alunos/aluno-form"

export default async function EditarAlunoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Buscar dados do aluno
  const { data: aluno, error: alunoError } = await supabase.from("alunos").select("*").eq("id", id).single()

  if (alunoError || !aluno) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AlunosHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Editar Aluno</h1>
          <p className="text-gray-600 mt-1">Atualize os dados de {aluno.nome_completo}</p>
        </div>

        <AlunoForm aluno={aluno} isEditing={true} />
      </main>
    </div>
  )
}
