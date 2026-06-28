import { createServerClient } from "@/lib/supabase/server"

export interface ProfessorFilter {
  professorId: string | null
  isProfessor: boolean
  turmaIds: string[]
  disciplinaIds: string[]
}

export async function getProfessorFilter(): Promise<ProfessorFilter> {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { professorId: null, isProfessor: false, turmaIds: [], disciplinaIds: [] }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tipo_usuario")
    .eq("id", user.id)
    .single()

  if (profile?.tipo_usuario !== "professor") {
    return { professorId: null, isProfessor: false, turmaIds: [], disciplinaIds: [] }
  }

  const { data: professor } = await supabase
    .from("professores")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!professor) return { professorId: null, isProfessor: true, turmaIds: [], disciplinaIds: [] }

  const professorId = professor.id

  const [tdResult, tResult] = await Promise.all([
    supabase.from("turma_disciplinas").select("turma_id").eq("professor_id", professorId),
    supabase.from("turmas").select("id").eq("professor_responsavel_id", professorId).eq("ativo", true),
  ])

  const turmaSet = new Set<string>()
  tdResult.data?.forEach((td) => turmaSet.add(td.turma_id))
  tResult.data?.forEach((t) => turmaSet.add(t.id))
  const turmaIds = [...turmaSet]

  const [discResult, pdResult, tdDiscResult] = await Promise.all([
    supabase.from("disciplinas").select("id").eq("professor_id", professorId).eq("ativo", true),
    supabase.from("professor_disciplinas").select("disciplina_id").eq("professor_id", professorId),
    supabase.from("turma_disciplinas").select("disciplina_id").eq("professor_id", professorId),
  ])

  const discSet = new Set<string>()
  discResult.data?.forEach((d) => discSet.add(d.id))
  pdResult.data?.forEach((pd) => discSet.add(pd.disciplina_id))
  tdDiscResult.data?.forEach((td) => discSet.add(td.disciplina_id))
  const disciplinaIds = [...discSet]

  return { professorId, isProfessor: true, turmaIds, disciplinaIds }
}
