import { createClient } from "@/lib/supabase/server"
import { TurmasHeader } from "@/components/turmas/turmas-header"
import { TurmaForm } from "@/components/turmas/turma-form"

export default async function NovaTurmaPage() {
  const supabase = await createClient()

  // Buscar professores para o select
  const { data: professores } = await supabase
    .from("professores")
    .select("id, nome_completo")
    .eq("ativo", true)
    .order("nome_completo")

  return (
    <div className="min-h-screen bg-gray-50">
      <TurmasHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Nova Turma</h1>
          <p className="text-gray-600 mt-1">Preencha os dados para cadastrar uma nova turma</p>
        </div>

        <TurmaForm professores={professores || []} />
      </main>
    </div>
  )
}
