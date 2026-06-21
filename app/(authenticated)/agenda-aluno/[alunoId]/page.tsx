"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { salvarAviso, deletarAviso } from "../actions"
import {
  BookUser,
  Plus,
  Calendar,
  Clock,
  Edit2,
  X,
  Trash2,
  User,
  Phone,
  Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PageHeader } from "@/components/page-header"
import { AgendaCalendar } from "@/components/agenda/agenda-calendar"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { translateError } from "@/lib/error-messages"

const categorias = [
  { value: "comportamento", label: "Comportamento" },
  { value: "reuniao", label: "Reuniao" },
  { value: "aviso", label: "Aviso aos Pais" },
  { value: "ocorrencia", label: "Ocorrencia" },
  { value: "elogio", label: "Elogio" },
  { value: "outro", label: "Outro" },
]

const categoriaCores: Record<string, string> = {
  comportamento: "bg-orange-100 text-orange-700 border-orange-200",
  reuniao: "bg-blue-100 text-blue-700 border-blue-200",
  aviso: "bg-yellow-100 text-yellow-700 border-yellow-200",
  ocorrencia: "bg-red-100 text-red-700 border-red-200",
  elogio: "bg-green-100 text-green-700 border-green-200",
  outro: "bg-gray-100 text-gray-700 border-gray-200",
}

export default function AgendaAlunoDetailPage() {
  const params = useParams()
  const alunoId = params.alunoId as string
  const supabase = createClient()

  const [aluno, setAluno] = useState<any>(null)
  const [avisos, setAvisos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modal de detalhes
  const [selectedAviso, setSelectedAviso] = useState<any>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // Modal de novo/editar aviso
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingAviso, setEditingAviso] = useState<any>(null)
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    categoria: "aviso",
    data: new Date().toISOString().split("T")[0],
    hora: "",
  })
  const [saving, setSaving] = useState(false)

  // Delete
  const [avisoToDelete, setAvisoToDelete] = useState<any>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (alunoId) {
      loadData()
    }
  }, [alunoId])

  async function loadData() {
    if (!alunoId) return
    setLoading(true)

    // Buscar aluno
    const { data: alunoData } = await supabase
      .from("alunos")
      .select("*")
      .eq("id", alunoId)
      .single()

    setAluno(alunoData)

    // Buscar avisos
    const { data: avisosData, error } = await supabase
      .from("avisos_aluno")
      .select("*")
      .eq("aluno_id", alunoId)
      .order("data_aviso", { ascending: false })

    if (error) {
      console.error("[v0] Erro ao buscar avisos:", error)
    }

    setAvisos(avisosData || [])
    setLoading(false)
  }

  // Mapear avisos para o formato de eventos do calendario
  const eventosCalendario = avisos.map((aviso) => ({
    id: aviso.id,
    titulo: aviso.titulo,
    descricao: aviso.descricao,
    data_inicio: aviso.data_aviso,
    data_fim: aviso.data_aviso,
    hora_inicio: aviso.hora_aviso,
    hora_fim: null,
    tipo_evento: aviso.tipo_aviso,
    local: null,
    created_at: aviso.created_at,
  })) as any[]

  function openNewAviso() {
    setEditingAviso(null)
    setFormData({
      titulo: "",
      descricao: "",
      categoria: "aviso",
      data: new Date().toISOString().split("T")[0],
      hora: "",
    })
    setIsFormModalOpen(true)
  }

  function openEditAviso(aviso: any) {
    setEditingAviso(aviso)
    setFormData({
      titulo: aviso.titulo,
      descricao: aviso.descricao || "",
      categoria: aviso.tipo_aviso || "aviso",
      data: aviso.data_aviso,
      hora: aviso.hora_aviso || "",
    })
    setIsDetailModalOpen(false)
    setIsFormModalOpen(true)
  }

  async function handleSaveAviso() {
    if (!formData.titulo || !formData.data) {
      toast.error("Preencha pelo menos o titulo e a data")
      return
    }

    setSaving(true)

    try {
      const result = await salvarAviso({
        alunoId,
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        tipo_aviso: formData.categoria,
        data_aviso: formData.data,
        hora_aviso: formData.hora || null,
        editingAvisoId: editingAviso?.id,
      })

      if (result.error) throw new Error(result.error)

      toast.success(editingAviso ? "Aviso atualizado com sucesso" : "Aviso registrado com sucesso")
      setIsFormModalOpen(false)
      loadData()
    } catch (error: any) {
      toast.error(translateError(error.message || "Erro ao salvar aviso"))
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAviso() {
    if (!avisoToDelete) return
    setIsDeleting(true)

    const result = await deletarAviso(avisoToDelete.id, alunoId)

    if (result.error) {
      toast.error(translateError(result.error || "Erro ao excluir aviso"))
      setIsDeleting(false)
      return
    }

    toast.success("Aviso excluido com sucesso")
    setIsDeleteDialogOpen(false)
    setAvisoToDelete(null)
    setIsDeleting(false)
    loadData()
  }

  function handleAvisoClick(aviso: any) {
    setSelectedAviso(aviso)
    setIsDetailModalOpen(true)
  }

  function openDeleteDialog(aviso: any, e: React.MouseEvent) {
    e.stopPropagation()
    setAvisoToDelete(aviso)
    setIsDeleteDialogOpen(true)
  }

  if (loading) {
    return (
      <>
        <PageHeader
          icon={BookUser}
          title="Agenda do Aluno"
          subtitle="Carregando..."
          backHref="/agenda-aluno"
        />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" />
        </div>
      </>
    )
  }

  if (!aluno) {
    return (
      <>
        <PageHeader
          icon={BookUser}
          title="Agenda do Aluno"
          subtitle="Aluno nao encontrado"
          backHref="/agenda-aluno"
        />
      </>
    )
  }

  return (
    <>
      <PageHeader
        icon={BookUser}
        title={`Agenda - ${aluno.nome_completo}`}
        subtitle="Avisos, ocorrencias e comunicados do aluno"
        backHref="/agenda-aluno"
      />
      {/* Card com dados do aluno */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-cyan-100 flex items-center justify-center">
                  <User className="h-7 w-7 text-cyan-700" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{aluno.nome_completo}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    {aluno.cpf && <span>CPF: {aluno.cpf}</span>}
                    {aluno.telefone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {aluno.telefone}
                      </span>
                    )}
                    {aluno.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {aluno.email}
                      </span>
                    )}
                  </div>
                  {aluno.nome_responsavel && (
                    <p className="text-sm text-gray-500 mt-1">
                      Responsavel: {aluno.nome_responsavel}
                      {aluno.telefone_responsavel && ` - ${aluno.telefone_responsavel}`}
                    </p>
                  )}
                </div>
              </div>
              <Button onClick={openNewAviso} className="bg-cyan-600 hover:bg-cyan-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Aviso
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Calendario */}
        <Card>
          <CardContent className="p-6">
            <AgendaCalendar
              eventos={eventosCalendario}
              onDayClick={(data) => {
                setEditingAviso(null)
                setFormData({
                  titulo: "",
                  descricao: "",
                  categoria: "aviso",
                  data,
                  hora: "",
                })
                setIsFormModalOpen(true)
              }}
            />
          </CardContent>
        </Card>

        {/* Lista de avisos */}
        <Card>
          <CardHeader>
            <CardTitle>Avisos Registrados</CardTitle>
          </CardHeader>
          <CardContent>
            {avisos.length > 0 ? (
              <div className="space-y-3">
                {avisos.map((aviso) => (
                  <div
                    key={aviso.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleAvisoClick(aviso)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{aviso.titulo}</h4>
                          <Badge
                            variant="outline"
                            className={categoriaCores[aviso.tipo_aviso] || categoriaCores.outro}
                          >
                            {categorias.find((c) => c.value === aviso.tipo_aviso)?.label || aviso.tipo_aviso}
                          </Badge>
                        </div>
                        {aviso.descricao && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{aviso.descricao}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => openDeleteDialog(aviso, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">
                Nenhum aviso registrado para este aluno
              </p>
            )}
          </CardContent>
        </Card>

      {/* Modal de detalhes do aviso */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Aviso</DialogTitle>
          </DialogHeader>

          {selectedAviso && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-xl font-semibold">{selectedAviso.titulo}</h3>
                  <Badge
                    variant="outline"
                    className={categoriaCores[selectedAviso.tipo_aviso] || categoriaCores.outro}
                  >
                    {categorias.find((c) => c.value === selectedAviso.tipo_aviso)?.label || selectedAviso.tipo_aviso}
                  </Badge>
                </div>
                {selectedAviso.descricao && (
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedAviso.descricao}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Data</label>
                  <p className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {new Date(selectedAviso.data_aviso + "T00:00:00").toLocaleDateString("pt-BR")}
                  </p>
                </div>

                {selectedAviso.hora_aviso && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Horario</label>
                    <p className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {selectedAviso.hora_aviso}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                  Fechar
                </Button>
                <Button onClick={() => openEditAviso(selectedAviso)} className="bg-cyan-600 hover:bg-cyan-700">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Editar Aviso
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de novo/editar aviso */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAviso ? "Editar Aviso" : "Novo Aviso"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="titulo">Titulo *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ex: Aviso sobre comportamento"
              />
            </div>

            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData({ ...formData, categoria: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="hora">Horario</Label>
                <Input
                  id="hora"
                  type="time"
                  value={formData.hora}
                  onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="descricao">Descricao</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva detalhes do aviso..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAviso} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">
              {saving ? "Salvando..." : editingAviso ? "Salvar Alteracoes" : "Registrar Aviso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmacao de exclusao */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o aviso &quot;{avisoToDelete?.titulo}&quot;? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAviso}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
