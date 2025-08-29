import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { MatriculasHeader } from "@/components/matriculas/matriculas-header"
import { MatriculaForm } from "@/components/matriculas/matricula-form"

export default async function NovaMatriculaPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Buscar alunos ativos
  const { data: alunos } = await supabase
    .from("alunos")
    .select("id, nome_completo, cpf")
    .eq("ativo", true)
    .order("nome_completo")

  // Buscar turmas ativas
  const { data: turmas } = await supabase
    .from("turmas")
    .select("id, nome, serie, ano_letivo")
    .eq("ativo", true)
    .order("ano_letivo", { ascending: false })
    .order("nome")

  return (
    <div className="min-h-screen bg-gray-50">
      <MatriculasHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Nova Matrícula</h1>
          <p className="text-gray-600 mt-1">Preencha os dados para realizar uma nova matrícula</p>
        </div>

        <MatriculaForm alunos={alunos || []} turmas={turmas || []} />
      </main>
    </div>
  )
}
