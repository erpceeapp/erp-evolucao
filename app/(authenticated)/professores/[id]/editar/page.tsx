import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { GraduationCap } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { ProfessorForm } from "@/components/professores/professor-form"

export default async function EditarProfessorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Buscar dados do professor
  const { data: professor, error: professorError } = await supabase
    .from("professores")
    .select("*")
    .eq("id", id)
    .single()

  if (professorError || !professor) {
    notFound()
  }

  return (
    <>
      <PageHeader
        icon={GraduationCap}
        title="Editar Professor"
        description={`Atualize os dados de ${professor.nome_completo}`}
        backHref={`/professores/${id}`}
      />

      <ProfessorForm professor={professor} isEditing={true} />
    </>
  )
}
