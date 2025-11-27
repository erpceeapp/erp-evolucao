"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users, UserPlus, Mail, Trash2 } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface UserInvite {
  id: string
  email: string
  tipo_usuario: string
  created_at: string
  accepted_at: string | null
  expires_at: string
}

interface Profile {
  id: string
  nome_completo: string
  email: string
  tipo_usuario: string
  created_at: string
}

export default function UsuariosPage() {
  const [invites, setInvites] = useState<UserInvite[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [userTipo, setUserTipo] = useState<string | null>(null)
  const [newInvite, setNewInvite] = useState({
    email: "",
    tipo_usuario: "",
  })
  const supabase = createBrowserClient()
  const router = useRouter()

  useEffect(() => {
    checkUserTipo()
    loadData()
  }, [])

  const checkUserTipo = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }

    const { data: profile } = await supabase.from("profiles").select("tipo_usuario").eq("id", user.id).single()

    const allowedTipos = ["admin", "diretor"]
    if (!profile?.tipo_usuario || !allowedTipos.includes(profile.tipo_usuario.toLowerCase())) {
      router.push("/dashboard")
      return
    }

    setUserTipo(profile.tipo_usuario)
  }

  const loadData = async () => {
    try {
      const { data: invitesData } = await supabase
        .from("user_invites")
        .select("*")
        .order("created_at", { ascending: false })

      if (invitesData) {
        setInvites(invitesData)
      }

      const { data: usersData } = await supabase
        .from("profiles")
        .select("id, nome_completo, email, tipo_usuario, created_at")
        .order("created_at", { ascending: false })

      if (usersData) {
        setUsers(usersData)
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  const sendInvite = async () => {
    if (!newInvite.email || !newInvite.tipo_usuario) {
      alert("Preencha todos os campos")
      return
    }

    setInviting(true)
    try {
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error } = await supabase.from("user_invites").insert([
        {
          email: newInvite.email,
          tipo_usuario: newInvite.tipo_usuario,
          invited_by: user?.id,
          token,
          expires_at: expiresAt.toISOString(),
        },
      ])

      if (error) throw error

      console.log(`Email enviado para ${newInvite.email} com token: ${token}`)
      alert(`Convite enviado para ${newInvite.email}!`)

      setNewInvite({ email: "", tipo_usuario: "" })
      loadData()
    } catch (error) {
      console.error("Erro ao enviar convite:", error)
      alert("Erro ao enviar convite")
    } finally {
      setInviting(false)
    }
  }

  const deleteInvite = async (id: string) => {
    if (!confirm("Deseja cancelar este convite?")) return

    try {
      const { error } = await supabase.from("user_invites").delete().eq("id", id)

      if (error) throw error

      loadData()
    } catch (error) {
      console.error("Erro ao cancelar convite:", error)
      alert("Erro ao cancelar convite")
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (userTipo?.toLowerCase() !== "admin" && userTipo?.toLowerCase() !== "diretor") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Acesso Negado</CardTitle>
            <CardDescription>Apenas administradores podem acessar esta página.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Usuários</h1>
        </div>
        <p className="text-gray-600">Gerencie os usuários que têm acesso ao sistema.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Convidar Novo Usuário
            </CardTitle>
            <CardDescription>Envie um convite por email para um novo usuário.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={newInvite.email}
                onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
                placeholder="usuario@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_usuario">Tipo de Usuário</Label>
              <Select
                value={newInvite.tipo_usuario}
                onValueChange={(value) => setNewInvite({ ...newInvite, tipo_usuario: value })}
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

            <Button onClick={sendInvite} disabled={inviting} className="w-full">
              <Mail className="h-4 w-4 mr-2" />
              {inviting ? "Enviando..." : "Enviar Convite"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Convites Pendentes</CardTitle>
            <CardDescription>Convites enviados aguardando aceitação.</CardDescription>
          </CardHeader>
          <CardContent>
            {invites.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum convite pendente</p>
            ) : (
              <div className="space-y-3">
                {invites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{invite.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getTipoBadgeColor(invite.tipo_usuario)}>
                          {getTipoLabel(invite.tipo_usuario)}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(invite.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => deleteInvite(invite.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
          <CardDescription>Lista de todos os usuários com acesso ao sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nenhum usuário cadastrado</p>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{user.nome_completo || "Nome não informado"}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getTipoBadgeColor(user.tipo_usuario)}>{getTipoLabel(user.tipo_usuario)}</Badge>
                      <span className="text-sm text-gray-500">
                        Desde {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
