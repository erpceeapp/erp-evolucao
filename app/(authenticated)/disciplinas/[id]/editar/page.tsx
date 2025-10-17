import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DisciplinaForm } from "@/components/disciplinas/disciplina-form"
import { PageHeader } from "@/components/page-header"
import { BookOpen } from "lucide-react"

export default async function EditarDisciplinaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  if (!id || id === "undefined" || id === "null") {
    notFound()
  }

  const { data: disciplina, error: disciplinaError } = await supabase
    .from("disciplinas")
    .select("*")
    .eq("id", id)
    .single()

  if (disciplinaError || !disciplina) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BookOpen}
        title="Editar Disciplina"
        subtitle={`Editando: ${disciplina.nome}`}
        backHref="/disciplinas"
      />

      <DisciplinaForm disciplina={disciplina} isEditing />
    </div>
  )
}
