"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { Calendar, Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { translateError } from "@/lib/error-messages"

type PeriodoLetivo = {
  id: string
  ano_letivo: number
  numero_periodo: number
  nome: string
  data_inicio: string
  data_fim: string
  ativo: boolean
}

type EventoCalendario = {
  id: string
  titulo: string
  descricao?: string | null
  data_inicio: string
  data_fim: string | null
  tipo_evento?: string
}

function formatDate(dateStr: string) {
  if (!dateStr) return ""
  const [year, month, day] = dateStr.split("-")
  return `${day}/${month}/${year}`
}

export default function CalendarioLetivoPage() {
  const supabase = createClient()
  const [canEdit, setCanEdit] = useState(false)
  const [loading, setLoading] = useState(true)

  const [periodos, setPeriodos] = useState<PeriodoLetivo[]>([])
  const [ferias, setFerias] = useState<EventoCalendario[]>([])
  const [feriados, setFeriados] = useState<EventoCalendario[]>([])

  const [periodoDialogOpen, setPeriodoDialogOpen] = useState(false)
  const [feriasDialogOpen, setFeriasDialogOpen] = useState(false)
  const [feriadoDialogOpen, setFeriadoDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: "periodo" | "ferias" | "feriado"; titulo: string } | null>(null)
  const [editingPeriodo, setEditingPeriodo] = useState<PeriodoLetivo | null>(null)
  const [editingFerias, setEditingFerias] = useState<EventoCalendario | null>(null)
  const [editingFeriado, setEditingFeriado] = useState<EventoCalendario | null>(null)

  const [periodoForm, setPeriodoForm] = useState({ ano_letivo: new Date().getFullYear(), numero_periodo: 1, nome: "", data_inicio: "", data_fim: "", ativo: true })

  async function reloadData() {
    const [periodosRes, feriasRes, feriadosRes] = await Promise.all([
      supabase.from("periodos_letivos").select("id, ano_letivo, numero_periodo, nome, data_inicio, data_fim, ativo").order("ano_letivo", { ascending: false }).order("numero_periodo"),
      supabase.from("eventos").select("id, titulo, data_inicio, data_fim").eq("tipo_evento", "ferias").order("data_inicio"),
      supabase.from("eventos").select("id, titulo, data_inicio, data_fim").eq("tipo_evento", "feriado").order("data_inicio"),
    ])
    if (periodosRes.data) setPeriodos(periodosRes.data)
    if (feriasRes.data) setFerias(feriasRes.data)
    if (feriadosRes.data) setFeriados(feriadosRes.data)
  }
  const [feriasForm, setFeriasForm] = useState({ titulo: "", data_inicio: "", data_fim: "" })
  const [feriadoForm, setFeriadoForm] = useState({ titulo: "", data_inicio: "", data_fim: "" })

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("tipo_usuario").eq("id", user.id).single()
        const tipo = profile?.tipo_usuario?.toLowerCase()
        setCanEdit(["admin", "diretor", "coordenacao"].includes(tipo))
      }

      const [periodosRes, feriasRes, feriadosRes] = await Promise.all([
        supabase.from("periodos_letivos").select("id, ano_letivo, numero_periodo, nome, data_inicio, data_fim, ativo").order("ano_letivo", { ascending: false }).order("numero_periodo"),
        supabase.from("eventos").select("id, titulo, data_inicio, data_fim").eq("tipo_evento", "ferias").order("data_inicio"),
        supabase.from("eventos").select("id, titulo, data_inicio, data_fim").eq("tipo_evento", "feriado").order("data_inicio"),
      ])
      if (periodosRes.data) setPeriodos(periodosRes.data)
      if (feriasRes.data) setFerias(feriasRes.data)
      if (feriadosRes.data) setFeriados(feriadosRes.data)
      setLoading(false)
    }
    init()
  }, [])

  async function savePeriodo(e: React.FormEvent) {
    e.preventDefault()
    if (!periodoForm.nome || !periodoForm.data_inicio || !periodoForm.data_fim) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }
    if (periodoForm.data_inicio > periodoForm.data_fim) {
      toast.error("Data início não pode ser maior que data fim")
      return
    }

    const payload = { ...periodoForm }
    const { error } = editingPeriodo
      ? await supabase.from("periodos_letivos").update(payload).eq("id", editingPeriodo.id)
      : await supabase.from("periodos_letivos").insert(payload)

    if (error) {
      toast.error(translateError(error.message))
      return
    }
    toast.success(editingPeriodo ? "Período atualizado" : "Período criado")
    setPeriodoDialogOpen(false)
    setEditingPeriodo(null)
    setPeriodoForm({ ano_letivo: new Date().getFullYear(), numero_periodo: 1, nome: "", data_inicio: "", data_fim: "", ativo: true })
    reloadData()
  }

  async function saveFerias(e: React.FormEvent) {
    e.preventDefault()
    if (!feriasForm.titulo || !feriasForm.data_inicio || !feriasForm.data_fim) {
      toast.error("Preencha todos os campos")
      return
    }
    if (feriasForm.data_inicio > feriasForm.data_fim) {
      toast.error("Data início não pode ser maior que data fim")
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const payload = { ...feriasForm, tipo_evento: "ferias", created_by: user?.id }

    const { error } = editingFerias
      ? await supabase.from("eventos").update({ ...payload, created_by: undefined }).eq("id", editingFerias.id)
      : await supabase.from("eventos").insert(payload)

    if (error) {
      toast.error(translateError(error.message))
      return
    }
    toast.success(editingFerias ? "Férias atualizadas" : "Férias cadastradas")
    setFeriasDialogOpen(false)
    setEditingFerias(null)
    setFeriasForm({ titulo: "", data_inicio: "", data_fim: "" })
    reloadData()
  }

  async function saveFeriado(e: React.FormEvent) {
    e.preventDefault()
    if (!feriadoForm.titulo || !feriadoForm.data_inicio) {
      toast.error("Preencha todos os campos")
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const payload = { ...feriadoForm, tipo_evento: "feriado", created_by: user?.id }

    const payloadObj: Record<string, any> = { ...feriadoForm, tipo_evento: "feriado", created_by: user?.id }
    if (!payloadObj.data_fim) {
      payloadObj.data_fim = null
    }

    const { error } = editingFeriado
      ? await supabase.from("eventos").update({ ...payloadObj, created_by: undefined }).eq("id", editingFeriado.id)
      : await supabase.from("eventos").insert(payloadObj)

    if (error) {
      toast.error(translateError(error.message))
      return
    }
    toast.success(editingFeriado ? "Feriado atualizado" : "Feriado cadastrado")
    setFeriadoDialogOpen(false)
    setEditingFeriado(null)
    setFeriadoForm({ titulo: "", data_inicio: "", data_fim: "" })
    reloadData()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const { id, type } = deleteTarget

    let error: any
    if (type === "periodo") {
      ({ error } = await supabase.from("periodos_letivos").delete().eq("id", id))
    } else {
      ({ error } = await supabase.from("eventos").delete().eq("id", id))
    }

    if (error) {
      toast.error(translateError(error.message))
      return
    }
    toast.success("Excluído com sucesso")
    setDeleteTarget(null)
    reloadData()
  }

  function openPeriodoDialog(periodo?: PeriodoLetivo) {
    if (periodo) {
      setEditingPeriodo(periodo)
      setPeriodoForm({
        ano_letivo: periodo.ano_letivo,
        numero_periodo: periodo.numero_periodo,
        nome: periodo.nome,
        data_inicio: periodo.data_inicio,
        data_fim: periodo.data_fim,
        ativo: periodo.ativo,
      })
    } else {
      setEditingPeriodo(null)
      setPeriodoForm({ ano_letivo: new Date().getFullYear(), numero_periodo: 1, nome: "", data_inicio: "", data_fim: "", ativo: true })
    }
    setPeriodoDialogOpen(true)
  }

  function openFeriasDialog(evento?: EventoCalendario) {
    if (evento) {
      setEditingFerias(evento)
      setFeriasForm({ titulo: evento.titulo, data_inicio: evento.data_inicio, data_fim: evento.data_fim || "" })
    } else {
      setEditingFerias(null)
      setFeriasForm({ titulo: "", data_inicio: "", data_fim: "" })
    }
    setFeriasDialogOpen(true)
  }

  function openFeriadoDialog(evento?: EventoCalendario) {
    if (evento) {
      setEditingFeriado(evento)
      setFeriadoForm({ titulo: evento.titulo, data_inicio: evento.data_inicio, data_fim: evento.data_fim ?? "" })
    } else {
      setEditingFeriado(null)
      setFeriadoForm({ titulo: "", data_inicio: "", data_fim: "" })
    }
    setFeriadoDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader icon={Calendar} title="Calendário Letivo" subtitle="Gerencie períodos letivos, férias e feriados" backHref="/configuracoes" />
        <BreadcrumbNav
          items={[
            { label: "Inicio", href: "/dashboard" },
            { label: "Configuracoes", href: "/configuracoes" },
            { label: "Calendario Letivo" },
          ]}
          className="mt-2"
        />
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={Calendar} title="Calendário Letivo" subtitle="Gerencie períodos letivos, férias e feriados" backHref="/configuracoes" />
      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Configuracoes", href: "/configuracoes" },
          { label: "Calendario Letivo" },
        ]}
        className="mt-2"
      />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Períodos Letivos</CardTitle>
                <CardDescription>Defina os períodos (bimestres/trimestres) do ano letivo</CardDescription>
              </div>
              {canEdit && (
                <Dialog open={periodoDialogOpen} onOpenChange={setPeriodoDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => openPeriodoDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Período
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingPeriodo ? "Editar Período" : "Novo Período"}</DialogTitle>
                      <DialogDescription>Registre um período letivo no calendário escolar</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={savePeriodo} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="ano_letivo">Ano Letivo *</Label>
                          <Input id="ano_letivo" type="number" value={periodoForm.ano_letivo} onChange={(e) => setPeriodoForm({ ...periodoForm, ano_letivo: Number.parseInt(e.target.value) || new Date().getFullYear() })} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="numero_periodo">Nº do Período *</Label>
                          <Select value={String(periodoForm.numero_periodo)} onValueChange={(v) => setPeriodoForm({ ...periodoForm, numero_periodo: Number(v) })}>
                            <SelectTrigger id="numero_periodo">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4].map((n) => (
                                <SelectItem key={n} value={String(n)}>{n}º Período</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome *</Label>
                        <Input id="nome" value={periodoForm.nome} onChange={(e) => setPeriodoForm({ ...periodoForm, nome: e.target.value })} placeholder="Ex: 1º Bimestre" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="periodo_inicio">Data Início *</Label>
                          <Input id="periodo_inicio" type="date" value={periodoForm.data_inicio} onChange={(e) => setPeriodoForm({ ...periodoForm, data_inicio: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="periodo_fim">Data Fim *</Label>
                          <Input id="periodo_fim" type="date" value={periodoForm.data_fim} onChange={(e) => setPeriodoForm({ ...periodoForm, data_fim: e.target.value })} required />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch id="periodo_ativo" checked={periodoForm.ativo} onCheckedChange={(v) => setPeriodoForm({ ...periodoForm, ativo: v })} />
                        <Label htmlFor="periodo_ativo">Período ativo</Label>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setPeriodoDialogOpen(false)}>Cancelar</Button>
                        <Button type="submit">{editingPeriodo ? "Salvar" : "Criar"}</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {periodos.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Nenhum período letivo cadastrado.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ano</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Fim</TableHead>
                    <TableHead>Ativo</TableHead>
                    {canEdit && <TableHead className="w-[100px]">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periodos.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.ano_letivo}</TableCell>
                      <TableCell>{p.numero_periodo}º</TableCell>
                      <TableCell>{p.nome}</TableCell>
                      <TableCell>{formatDate(p.data_inicio)}</TableCell>
                      <TableCell>{formatDate(p.data_fim)}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded ${p.ativo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                          {p.ativo ? "Sim" : "Não"}
                        </span>
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="outline" size="icon" onClick={() => openPeriodoDialog(p)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => setDeleteTarget({ id: p.id, type: "periodo", titulo: p.nome })}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Férias Escolares</CardTitle>
                <CardDescription>Registre os períodos de férias da escola</CardDescription>
              </div>
              {canEdit && (
                <Dialog open={feriasDialogOpen} onOpenChange={setFeriasDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => openFeriasDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Férias
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingFerias ? "Editar Férias" : "Novo Período de Férias"}</DialogTitle>
                      <DialogDescription>Registre um período de férias no calendário escolar</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={saveFerias} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="ferias_titulo">Título *</Label>
                        <Input id="ferias_titulo" value={feriasForm.titulo} onChange={(e) => setFeriasForm({ ...feriasForm, titulo: e.target.value })} placeholder="Ex: Férias de Julho" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="ferias_inicio">Data Início *</Label>
                          <Input id="ferias_inicio" type="date" value={feriasForm.data_inicio} onChange={(e) => setFeriasForm({ ...feriasForm, data_inicio: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ferias_fim">Data Fim *</Label>
                          <Input id="ferias_fim" type="date" value={feriasForm.data_fim} onChange={(e) => setFeriasForm({ ...feriasForm, data_fim: e.target.value })} required />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setFeriasDialogOpen(false)}>Cancelar</Button>
                        <Button type="submit">{editingFerias ? "Salvar" : "Criar"}</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {ferias.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Nenhum período de férias cadastrado.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Fim</TableHead>
                    {canEdit && <TableHead className="w-[100px]">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ferias.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell>{f.titulo}</TableCell>
                      <TableCell>{formatDate(f.data_inicio)}</TableCell>
                      <TableCell>{formatDate(f.data_fim || "")}</TableCell>
                      {canEdit && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="outline" size="icon" onClick={() => openFeriasDialog(f)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => setDeleteTarget({ id: f.id, type: "ferias", titulo: f.titulo })}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Feriados</CardTitle>
                <CardDescription>Registre os feriados do calendário escolar</CardDescription>
              </div>
              {canEdit && (
                <Dialog open={feriadoDialogOpen} onOpenChange={setFeriadoDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => openFeriadoDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Feriado
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingFeriado ? "Editar Feriado" : "Novo Feriado"}</DialogTitle>
                      <DialogDescription>Registre um feriado no calendário escolar</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={saveFeriado} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="feriado_titulo">Nome do Feriado *</Label>
                        <Input id="feriado_titulo" value={feriadoForm.titulo} onChange={(e) => setFeriadoForm({ ...feriadoForm, titulo: e.target.value })} placeholder="Ex: Natal" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="feriado_inicio">Data Início *</Label>
                          <Input id="feriado_inicio" type="date" value={feriadoForm.data_inicio} onChange={(e) => setFeriadoForm({ ...feriadoForm, data_inicio: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="feriado_fim">Data Fim</Label>
                          <Input id="feriado_fim" type="date" value={feriadoForm.data_fim} onChange={(e) => setFeriadoForm({ ...feriadoForm, data_fim: e.target.value })} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setFeriadoDialogOpen(false)}>Cancelar</Button>
                        <Button type="submit">{editingFeriado ? "Salvar" : "Criar"}</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {feriados.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Nenhum feriado cadastrado.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feriado</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Fim</TableHead>
                    {canEdit && <TableHead className="w-[100px]">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feriados.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell>{f.titulo}</TableCell>
                      <TableCell>{formatDate(f.data_inicio)}</TableCell>
                      <TableCell>{f.data_fim ? formatDate(f.data_fim) : "-"}</TableCell>
                      {canEdit && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="outline" size="icon" onClick={() => openFeriadoDialog(f)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => setDeleteTarget({ id: f.id, type: "feriado", titulo: f.titulo })}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.titulo}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
