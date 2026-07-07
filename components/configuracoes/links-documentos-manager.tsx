"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type LinkDocumento = {
  id: string
  titulo: string
  url: string
  descricao: string | null
  icone: string
  cor: string
  ordem: number
  ativo: boolean
}

const iconOptions = [
  { value: "file-text", label: "Documento" },
  { value: "book-open", label: "Livro" },
  { value: "graduation-cap", label: "Graduação" },
  { value: "school", label: "Escola" },
  { value: "clipboard", label: "Prancheta" },
  { value: "folder", label: "Pasta" },
  { value: "link", label: "Link" },
  { value: "external-link", label: "Link Externo" },
]

const colorOptions = [
  { value: "blue", label: "Azul" },
  { value: "green", label: "Verde" },
  { value: "purple", label: "Roxo" },
  { value: "orange", label: "Laranja" },
  { value: "red", label: "Vermelho" },
  { value: "cyan", label: "Ciano" },
  { value: "pink", label: "Rosa" },
]

export function LinksDocumentosManager() {
  const [links, setLinks] = useState<LinkDocumento[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<LinkDocumento | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    titulo: "",
    url: "",
    descricao: "",
    icone: "file-text",
    cor: "blue",
    ativo: true,
  })

  useEffect(() => {
    loadLinks()
  }, [])

  async function loadLinks() {
    try {
      const { data, error } = await supabase.from("links_documentos").select("id, titulo, url, descricao, icone, cor, ordem, ativo").order("ordem", { ascending: true })

      if (error) {
        throw error
      }
      setLinks(data || [])
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os links",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      if (editingLink) {
        // Atualizar
        const { error } = await supabase
          .from("links_documentos")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingLink.id)

        if (error) {
          throw error
        }

        toast({
          title: "Sucesso",
          description: "Link atualizado com sucesso",
        })
      } else {
        // Criar novo
        const maxOrdem = links.length > 0 ? Math.max(...links.map((l) => l.ordem)) : 0

        const { error } = await supabase.from("links_documentos").insert({
          ...formData,
          ordem: maxOrdem + 1,
        })

        if (error) {
          throw error
        }

        toast({
          title: "Sucesso",
          description: "Link criado com sucesso",
        })
      }

      setDialogOpen(false)
      resetForm()
      loadLinks()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível salvar o link",
        variant: "destructive",
      })
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja realmente excluir este link?")) return

    try {
      const { error } = await supabase.from("links_documentos").delete().eq("id", id)

      if (error) {
        throw error
      }

      toast({
        title: "Sucesso",
        description: "Link excluído com sucesso",
      })
      loadLinks()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível excluir o link",
        variant: "destructive",
      })
    }
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    try {
      const { error } = await supabase
        .from("links_documentos")
        .update({ ativo, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) {
        throw error
      }

      toast({
        title: "Sucesso",
        description: `Link ${ativo ? "ativado" : "desativado"} com sucesso`,
      })
      loadLinks()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível atualizar o status",
        variant: "destructive",
      })
    }
  }

  function openEditDialog(link: LinkDocumento) {
    setEditingLink(link)
    setFormData({
      titulo: link.titulo,
      url: link.url,
      descricao: link.descricao || "",
      icone: link.icone,
      cor: link.cor,
      ativo: link.ativo,
    })
    setDialogOpen(true)
  }

  function resetForm() {
    setEditingLink(null)
    setFormData({
      titulo: "",
      url: "",
      descricao: "",
      icone: "file-text",
      cor: "blue",
      ativo: true,
    })
  }

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Os links ativos serão exibidos no dashboard como botões de acesso rápido
        </p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Link
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingLink ? "Editar Link" : "Novo Link"}</DialogTitle>
              <DialogDescription>
                {editingLink
                  ? "Edite as informações do link de documento"
                  : "Adicione um novo link de documento ao dashboard"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ex: Documentação do Sistema"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL *</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Breve descrição do documento"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="icone">Ícone</Label>
                  <Select value={formData.icone} onValueChange={(value) => setFormData({ ...formData, icone: value })}>
                    <SelectTrigger id="icone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value}>
                          {icon.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cor">Cor</Label>
                  <Select value={formData.cor} onValueChange={(value) => setFormData({ ...formData, cor: value })}>
                    <SelectTrigger id="cor">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          {color.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
                <Label htmlFor="ativo">Link ativo</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingLink ? "Salvar" : "Criar"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {links.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Nenhum link cadastrado. Clique em "Adicionar Link" para começar.
            </CardContent>
          </Card>
        ) : (
          links.map((link) => (
            <Card key={link.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <GripVertical className="h-5 w-5 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{link.titulo}</CardTitle>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            link.ativo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {link.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                      <CardDescription className="mt-1">{link.url}</CardDescription>
                      {link.descricao && <p className="text-sm text-gray-600 mt-1">{link.descricao}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>Ícone: {link.icone}</span>
                        <span>Cor: {link.cor}</span>
                        <span>Ordem: {link.ordem}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={link.ativo} onCheckedChange={(checked) => toggleAtivo(link.id, checked)} />
                    <Button variant="outline" size="icon" onClick={() => openEditDialog(link)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleDelete(link.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
