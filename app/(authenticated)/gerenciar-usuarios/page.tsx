"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Edit, Users } from "lucide-react"
import PageHeader from "@/components/page-header"

interface Profile {
  id: string
  nome_completo: string
  email: string
  telefone: string
  tipo_usuario: string
  created_at: string
}

interface EditFormData {
  nome_completo: string
  telefone: string
  tipo_usuario: string
}

export default function GerenciarUsuariosPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentUserTipo, setCurrentUserTipo] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [editFormData, setEditFormData] = useState<EditFormData>({
    nome_completo: "",
    telefone: "",
    tipo_usuario: "",
  })
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const supabase = createClient()

  useEffect(() => {
    checkPermissionAndLoadData()
  }, [])

  const checkPermissionAndLoadData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: currentProfile } = await supabase.from("profiles").select("tipo_usuario").eq("id", user.id).single()

      const allowedTipos = ["admin", "coordenacao", "secretaria", "diretor"]
      if (!currentProfile?.tipo_usuario || !allowedTipos.includes(currentProfile.tipo_usuario.toLowerCase())) {
        toast.error("Acesso negado. Apenas administradores podem gerenciar usuários.")
        return
      }

      setCurrentUserTipo(currentProfile.tipo_usuario)
      await loadProfiles()
    } catch (error) {
      console.error("Erro ao verificar permissões:", error)
      toast.error("Erro ao verificar permissões")
    } finally {
      setLoading(false)
    }
  }

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setProfiles(data || [])
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
      toast.error("Erro ao carregar usuários")
    }
  }

  const handleEditClick = (profile: Profile) => {
    setEditingProfile(profile)
    setEditFormData({
      nome_completo: profile.nome_completo || "",
      telefone: profile.telefone || "",
      tipo_usuario: profile.tipo_usuario || "professor",
    })
  }

  const handleSaveEdit = async () => {
    if (!editingProfile) return
    setSaving(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          nome_completo: editFormData.nome_completo,
          telefone: editFormData.telefone,
          tipo_usuario: editFormData.tipo_usuario,
        })
        .eq("id", editingProfile.id)

      if (error) throw error

      toast.success("Usuário atualizado com sucesso!")
      setEditingProfile(null)
      await loadProfiles()
    } catch (error) {
      console.error("Erro ao salvar usuário:", error)
      toast.error("Erro ao salvar usuário")
    } finally {
      setSaving(false)
    }
  }

  const getTipoLabel = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case "admin":
        return "Administrador"
      case "secretaria":
        return "Secretaria"
      case "coordenacao":
        return "Coordenação"
      case "diretor":
        return "Diretor"
      case "professor":
        return "Professor"
      default:
        return tipo
    }
  }

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "secretaria":
        return "bg-blue-100 text-blue-800"
      case "coordenacao":
        return "bg-purple-100 text-purple-800"
      case "diretor":
        return "bg-orange-100 text-orange-800"
      case "professor":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredProfiles = profiles.filter(
    (profile) =>
      profile.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando usuários...</p>
        </div>
      </div>
    )
  }

  if (currentUserTipo.toLowerCase() !== "admin" && currentUserTipo.toLowerCase() !== "diretor") {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={Users}
          title="Gerenciar Usuários"
          subtitle="Gerencie usuários e permissões do sistema"
          backHref="/configuracoes"
        />
        <Card>
          <CardContent className="pt-6">
            <div className="text-red-600 mb-4">
              <Users className="h-12 w-12 mx-auto mb-4" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-gray-600">Apenas administradores podem gerenciar usuários do sistema.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Gerenciar Usuários"
        subtitle="Visualize e edite informações dos usuários do sistema"
        backHref="/configuracoes"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Gerenciar Usuários
          </CardTitle>
          <CardDescription>
            Visualize e edite informações dos usuários do sistema. Apenas administradores podem alterar tipos de
            usuário.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="space-y-4">
            {filteredProfiles.map((profile) => (
              <div key={profile.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h3 className="font-medium">{profile.nome_completo || "Nome não informado"}</h3>
                      <p className="text-sm text-gray-600">{profile.email}</p>
                      {profile.telefone && <p className="text-sm text-gray-600">{profile.telefone}</p>}
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoBadgeColor(profile.tipo_usuario)}`}
                    >
                      {getTipoLabel(profile.tipo_usuario)}
                    </span>
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(profile)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar Usuário</DialogTitle>
                      <DialogDescription>
                        Altere as informações do usuário. Como administrador, você pode alterar o tipo de usuário.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="edit-email">Email</Label>
                        <Input
                          id="edit-email"
                          type="email"
                          value={editingProfile?.email || ""}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-nome">Nome Completo</Label>
                        <Input
                          id="edit-nome"
                          type="text"
                          value={editFormData.nome_completo}
                          onChange={(e) => setEditFormData({ ...editFormData, nome_completo: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-telefone">Telefone</Label>
                        <Input
                          id="edit-telefone"
                          type="tel"
                          value={editFormData.telefone}
                          onChange={(e) => setEditFormData({ ...editFormData, telefone: e.target.value })}
                          placeholder="(11) 99999-9999"
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-tipo">Tipo de Usuário</Label>
                        <Select
                          value={editFormData.tipo_usuario}
                          onValueChange={(value) => setEditFormData({ ...editFormData, tipo_usuario: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="secretaria">Secretaria</SelectItem>
                            <SelectItem value="coordenacao">Coordenação</SelectItem>
                            <SelectItem value="diretor">Diretor</SelectItem>
                            <SelectItem value="professor">Professor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setEditingProfile(null)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSaveEdit} disabled={saving}>
                          {saving ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </div>

          {filteredProfiles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? "Nenhum usuário encontrado com esse termo." : "Nenhum usuário cadastrado."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
