import { getResponsavelSession } from "@/lib/responsavel-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, BookUser, BookOpen, Calendar, Clock } from "lucide-react"
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

  const supabase = createAdminClient()

  // Buscar dados do aluno
  const { data: aluno } = await supabase
    .from("alunos")
    .select("id, nome_completo, cpf, email, telefone, data_nascimento, nivel, nome_responsavel, email_responsavel")
    .eq("id", session.aluno_id)
    .single()

  // Buscar ultimos avisos
  const { data: ultimosAvisos } = await supabase
    .from("avisos_aluno")
    .select("id, titulo, descricao, tipo_aviso, data_aviso, hora_aviso")
    .eq("aluno_id", session.aluno_id)
    .order("data_aviso", { ascending: false })
    .limit(5)

  // Buscar matricula e turma
  const { data: matricula } = await supabase
    .from("matriculas")
    .select("id, numero_matricula, turma_id, status")
    .eq("aluno_id", session.aluno_id)
    .neq("status", "cancelada")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  let turma: any = null
  if (matricula?.turma_id) {
    const { data } = await supabase
      .from("turmas")
      .select("nome, serie, turno")
      .eq("id", matricula.turma_id)
      .single()
    turma = data
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/responsavel/agenda">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
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
        <Link href="/responsavel/notas">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500">
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
                      <p className="text-sm text-gray-600 line-clamp-2">{aviso.descricao}</p>
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
