import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cake } from "lucide-react"
import { AniversariantesTable } from "./aniversariantes-table"

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

export async function AniversariantesCard() {
  const supabase = await createClient()

  const mesAtual = new Date().getMonth() + 1

  const { data: todos } = await supabase
    .from("alunos")
    .select("id, nome_completo, data_nascimento")
    .eq("ativo", true)

  if (!todos || todos.length === 0) return null

  const aniversariantes = todos
    .filter((a) => {
      const mes = new Date(a.data_nascimento).getMonth() + 1
      return mes === mesAtual
    })
    .sort((a, b) => {
      const da = new Date(a.data_nascimento).getDate()
      const db = new Date(b.data_nascimento).getDate()
      return da - db
    })

  if (aniversariantes.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Cake className="h-5 w-5 text-pink-500" />
          Aniversariantes — {meses[mesAtual - 1]}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AniversariantesTable data={aniversariantes} />
      </CardContent>
    </Card>
  )
}
