import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TurmaForm } from "@/components/turmas/turma-form"

export default async function EditarTurmaPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Buscar dados da turma
  const { data: turma, error: turmaError } = await supabase.from("turmas").select("*").eq("id", params.id).single()

  if (turmaError || !turma) {
    notFound()
  }

  // Buscar professores ativos
  const { data: professores } = await supabase
    .from("professores")
    .select("id, nome_completo")
    .eq("ativo", true)
    .order("nome_completo")

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Editar Turma</h1>
          <p className="text-gray-600 mt-1">Atualize os dados de {turma.nome}</p>
        </div>

        <TurmaForm turma={turma} professores={professores || []} isEditing={true} />
      </div>
    </div>
  )
}
