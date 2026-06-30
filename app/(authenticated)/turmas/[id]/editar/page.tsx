import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BookOpen } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { TurmaForm } from "@/components/turmas/turma-form"

export default async function EditarTurmaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Buscar dados da turma
  const { data: turma, error: turmaError } = await supabase.from("turmas").select("*").eq("id", id).single()

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
    <>
      <PageHeader
        icon={BookOpen}
        title="Editar Turma"
        description={`Atualize os dados de ${turma.nome}`}
        backHref={`/turmas/${id}`}
      />

      <TurmaForm turma={turma} professores={professores || []} isEditing={true} />
    </>
  )
}
