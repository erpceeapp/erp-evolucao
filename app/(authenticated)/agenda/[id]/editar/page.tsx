import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Calendar } from "lucide-react"
import Link from "next/link"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { DescricaoField } from "@/components/agenda/descricao-field"
import { DiaInteiroField } from "@/components/agenda/dia-inteiro-field"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditarEventoPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Buscar evento
  const { data: evento, error } = await supabase.from("eventos").select("*").eq("id", id).single()

  if (error || !evento) {
    notFound()
  }

  async function updateEvento(formData: FormData) {
    "use server"

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Usuário não autenticado")
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tipo_usuario")
      .eq("id", user.id)
      .single()

    const isAdmin = profile && ["admin", "diretor"].includes(profile.tipo_usuario)

    if (!isAdmin && evento.created_by !== user.id) {
      throw new Error("Você não tem permissão para editar este evento")
    }
    const titulo = formData.get("titulo") as string
    const descricao = formData.get("descricao") as string
    const data_inicio = formData.get("data_inicio") as string
    const data_fim = formData.get("data_fim") as string
    const dia_inteiro = formData.get("dia_inteiro") === "true"
    const hora_inicio = dia_inteiro ? null : (formData.get("hora_inicio") as string)
    const hora_fim = dia_inteiro ? null : (formData.get("hora_fim") as string)

    const { error } = await supabase
      .from("eventos")
      .update({
        titulo,
        descricao,
        data_inicio,
        data_fim,
        hora_inicio,
        hora_fim,
      })
      .eq("id", id)

    if (error) {
      throw new Error("Erro ao atualizar evento")
    }

    redirect("/agenda")
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Link href="/agenda">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Agenda
          </Button>
        </Link>
      </div>

      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Agenda Escolar", href: "/agenda" },
          { label: "Editar Evento" },
        ]}
        className="mt-2 mb-6"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Editar Evento
          </CardTitle>
          <CardDescription>Atualize as informações do evento</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateEvento} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="titulo">
                Título do Evento <span className="text-red-500">*</span>
              </Label>
              <Input
                id="titulo"
                name="titulo"
                defaultValue={evento.titulo}
                placeholder="Ex: Reunião de Pais e Mestres"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <DescricaoField defaultValue={evento.descricao || ""} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_inicio">
                  Data Início <span className="text-red-500">*</span>
                </Label>
                <Input id="data_inicio" name="data_inicio" type="date" defaultValue={evento.data_inicio} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_fim">Data Fim</Label>
                <Input id="data_fim" name="data_fim" type="date" defaultValue={evento.data_fim || ""} />
              </div>
            </div>

            <DiaInteiroField
              allDay={!evento.hora_inicio}
              horaInicioDefault={evento.hora_inicio || ""}
              horaFimDefault={evento.hora_fim || ""}
            />

            <div className="flex gap-3 justify-end pt-4">
              <Link href="/agenda">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit">Salvar Alterações</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
