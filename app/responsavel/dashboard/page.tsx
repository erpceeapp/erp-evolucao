import { getResponsavelSession } from "@/lib/responsavel-auth"
import { createResponsavelClient } from "@/lib/supabase/responsavel-client"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, BookUser, BookOpen, Calendar, Clock, School } from "lucide-react"
import Link from "next/link"

const categoriaCores: Record<string, string> = {
  comportamento: "bg-orange-100 text-orange-700 border-orange-200",
  reuniao: "bg-blue-100 text-blue-700 border-blue-200",
  aviso: "bg-yellow-100 text-yellow-700 border-yellow-200",
  ocorrencia: "bg-red-100 text-red-700 border-red-200",
  elogio: "bg-green-100 text-green-700 border-green-200",
  outro: "bg-gray-100 text-gray-700 border-gray-200",
}

const categoriaLabels: Record<string, string> = {
  comportamento: "Comportamento",
  reuniao: "Reuniao",
  aviso: "Aviso aos Pais",
  ocorrencia: "Ocorrencia",
  elogio: "Elogio",
  outro: "Outro",
}

export default async function ResponsavelDashboard() {
  const session = await getResponsavelSession()
  if (!session) redirect("/auth/login")

  const supabase = createResponsavelClient()

  // Buscar dados do aluno via RPC
  const { data: alunoData } = await supabase
    .rpc("get_aluno_basico", { p_aluno_id: session.aluno_id })
    .single()

  const aluno = alunoData as { nome_completo: string; cpf: string; email: string; telefone: string; data_nascimento: string; nivel: string; nome_responsavel: string; email_responsavel: string } | null

  // Buscar ultimos avisos via RPC
  const { data: ultimosAvisosData } = await supabase
    .rpc("get_avisos_aluno", { p_aluno_id: session.aluno_id })
    .single()
  const ultimosAvisos = (ultimosAvisosData as any[] | null)?.slice(0, 5) || []

  // Buscar matricula via RPC
  const { data: matriculaData } = await supabase
    .rpc("get_matricula_ativa", { p_aluno_id: session.aluno_id })
    .single()

  let matricula = matriculaData as { id: string; turma_id: string; status: string; numero_matricula: string } | null
  let turma = null
  if (matricula?.turma_id) {
    const { data: turmaData } = await supabase
      .rpc("get_turma", { p_turma_id: matricula.turma_id })
      .single()
    turma = turmaData as { nome: string; serie: string; turno: string } | null
  }

  return (
    <div className="space-y-6">
      {/* Cabecalho com dados do aluno */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{aluno?.nome_completo}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                {turma && (
                  <span>Turma: <strong>{turma.nome}</strong></span>
                )}
                {turma?.serie && (
                  <span>Serie: <strong>{turma.serie}</strong></span>
                )}
                {turma?.turno && (
                  <span>Turno: <strong className="capitalize">{turma.turno}</strong></span>
                )}
                {matricula?.numero_matricula && (
                  <span>Matricula: <strong>{matricula.numero_matricula}</strong></span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Links rapidos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/responsavel/agenda">
          <Card className="cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <BookUser className="h-8 w-8 text-blue-500" />
                <div>
                  <h3 className="font-semibold text-gray-900">Agenda do Aluno</h3>
                  <p className="text-sm text-gray-500">Avisos, reunioes e comunicados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/responsavel/agenda?tab=escola">
          <Card className="cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <School className="h-8 w-8 text-purple-500" />
                <div>
                  <h3 className="font-semibold text-gray-900">Agenda Escolar</h3>
                  <p className="text-sm text-gray-500">Feriados, reunioes e eventos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/responsavel/notas">
          <Card className="cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-green-500" />
                <div>
                  <h3 className="font-semibold text-gray-900">Notas e Desempenho</h3>
                  <p className="text-sm text-gray-500">Acompanhe as notas por disciplina</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Ultimos avisos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Ultimos Avisos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!ultimosAvisos || ultimosAvisos.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Nenhum aviso registrado.</p>
          ) : (
            <div className="space-y-3">
              {ultimosAvisos.map((aviso) => (
                <div key={aviso.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">{aviso.titulo}</h4>
                      <Badge
                        variant="outline"
                        className={categoriaCores[aviso.tipo_aviso] || categoriaCores.outro}
                      >
                        {categoriaLabels[aviso.tipo_aviso] || aviso.tipo_aviso}
                      </Badge>
                    </div>
                    {aviso.descricao && (
                      <div className="text-sm text-gray-600 line-clamp-2 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: aviso.descricao }} />
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(aviso.data_aviso + "T00:00:00").toLocaleDateString("pt-BR")}
                      </span>
                      {aviso.hora_aviso && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {aviso.hora_aviso}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <div className="text-center pt-2">
                <Link href="/responsavel/agenda" className="text-sm text-blue-600 hover:underline">
                  Ver todos os avisos
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
