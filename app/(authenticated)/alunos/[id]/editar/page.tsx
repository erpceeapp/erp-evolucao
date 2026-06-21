import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Users } from "lucide-react"
import { PageHeader } from "@/components/page-header"
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
    <>
      <PageHeader
        icon={Users}
        title="Editar Aluno"
        description={`Atualize os dados de ${aluno.nome_completo}`}
        backHref={`/alunos/${id}`}
      />

      <AlunoForm aluno={aluno} isEditing={true} />
    </>
  )
}
