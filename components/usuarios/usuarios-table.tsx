"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, Pencil, Trash2, ArrowUp, ArrowDown, ArrowUpDown, X, Eye, EyeOff } from "lucide-react"
import { DataPagination } from "@/components/ui/data-pagination"
import { useRouter, useSearchParams } from "next/navigation"
import { updateUser, deleteUser } from "@/app/(authenticated)/usuarios/actions"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { translateError } from "@/lib/error-messages"

interface Profile {
  id: string
  nome_completo: string
  email: string
  tipo_usuario: string
  created_at: string
}

interface UsuariosTableProps {
  usuarios: Profile[]
  currentPage: number
  totalPages: number
  pageSize: number
  totalCount: number
  busca: string
  tipo: string
  sortBy: string
  sortOrder: string
  currentUserTipo: string
}

const tipoOptions = [
  { value: "admin", label: "Administrador" },
  { value: "secretaria", label: "Secretaria" },
  { value: "professor", label: "Professor" },
  { value: "coordenacao", label: "Coordenação" },
  { value: "diretor", label: "Diretor" },
]

function getTipoBadgeColor(tipo: string) {
  switch (tipo.toLowerCase()) {
    case "admin":
      return "bg-red-100 text-red-800 hover:bg-red-100"
    case "secretaria":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100"
    case "coordenacao":
      return "bg-purple-100 text-purple-800 hover:bg-purple-100"
    case "diretor":
      return "bg-orange-100 text-orange-800 hover:bg-orange-100"
    case "professor":
      return "bg-green-100 text-green-800 hover:bg-green-100"
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100"
  }
}

function getTipoLabel(tipo: string) {
  return tipoOptions.find((o) => o.value === tipo)?.label || tipo
}

function DeleteUserDialog({ user, onSuccess }: { user: Profile; onSuccess?: () => void }) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleDelete = async () => {
    setDeleting(true)
    setError("")

    const result = await deleteUser(user.id)

    setDeleting(false)

    if (result.error) {
      setError(translateError(result.error))
      return
    }

    setOpen(false)
    onSuccess?.()
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir Usuário</DialogTitle>
          <DialogDescription>
            Esta ação é irreversível. Tem certeza que deseja excluir o usuário{" "}
            <strong>{user.nome_completo || user.email}</strong>?
            {user.tipo_usuario === "professor" && (
              <span className="mt-2 block text-orange-600 font-medium">
                Este usuário é um professor e será removido também da tabela de professores.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Excluindo..." : "Excluir Usuário"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditUserDialog({ user }: { user: Profile }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [nome, setNome] = useState(user.nome_completo || "")
  const [email, setEmail] = useState(user.email || "")
  const [tipo, setTipo] = useState(user.tipo_usuario)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  function getPasswordStrength(pw: string) {
    if (!pw) return null
    let score = 0
    if (pw.length >= 8) score++
    if (/[a-z]/.test(pw)) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^a-zA-Z0-9]/.test(pw)) score++
    if (score <= 2) return { level: 33, label: "Fraca", color: "bg-red-500", textColor: "text-red-600" }
    if (score <= 3) return { level: 66, label: "Média", color: "bg-yellow-500", textColor: "text-yellow-600" }
    return { level: 100, label: "Forte", color: "bg-green-500", textColor: "text-green-600" }
  }

  const strength = getPasswordStrength(password)

  const handleSave = async () => {
    setSaving(true)
    setError("")

    const result = await updateUser(user.id, {
      email: email !== user.email ? email : undefined,
      password: password || undefined,
      nome_completo: nome !== user.nome_completo ? nome : undefined,
      tipo_usuario: tipo !== user.tipo_usuario ? tipo : undefined,
    })

    setSaving(false)

    if (result.error) {
      setError(translateError(result.error))
      return
    }

    if (result.message) {
      toast.success(result.message)
    }

    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>Altere os dados do usuário.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-nome">Nome</Label>
            <Input id="edit-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-senha">Nova Senha (deixe em branco para manter)</Label>
            <div className="relative">
              <Input
                id="edit-senha"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {strength && (
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                    style={{ width: `${strength.level}%` }}
                  />
                </div>
                <p className={`text-xs ${strength.textColor}`}>{strength.label}</p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-tipo">Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger id="edit-tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tipoOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter className="flex items-center justify-between">
          <DeleteUserDialog user={user} onSuccess={() => setOpen(false)} />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function UsuariosTable({ usuarios, currentPage, totalPages, pageSize, totalCount, busca, tipo, sortBy, sortOrder, currentUserTipo }: UsuariosTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(busca)
  const [tipoFilter, setTipoFilter] = useState(tipo || "todos")

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams)
    if (searchTerm) {
      params.set("busca", searchTerm)
    } else {
      params.delete("busca")
    }
    params.set("page", "1")
    router.push(`/usuarios?${params.toString()}`)
  }

  const handleTipoChange = (newTipo: string) => {
    setTipoFilter(newTipo)
    const params = new URLSearchParams(searchParams)
    if (newTipo !== "todos") {
      params.set("tipo", newTipo)
    } else {
      params.delete("tipo")
    }
    params.set("page", "1")
    router.push(`/usuarios?${params.toString()}`)
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setTipoFilter("todos")
    const params = new URLSearchParams()
    params.set("page", "1")
    router.push(`/usuarios?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", page.toString())
    router.push(`/usuarios?${params.toString()}`)
  }

  const handlePageSizeChange = (size: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("limit", size.toString())
    params.set("page", "1")
    router.push(`/usuarios?${params.toString()}`)
  }

  const handleSort = (column: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("sortBy", column)
    params.set("sortOrder", sortBy === column && sortOrder === "asc" ? "desc" : "asc")
    params.set("page", "1")
    router.push(`/usuarios?${params.toString()}`)
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <ArrowUpDown className="h-3 w-3 text-gray-400" />
    return sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
  }

  const columns = [
    { key: "nome_completo", label: "Nome" },
    { key: "email", label: "Email" },
    { key: "tipo_usuario", label: "Tipo" },
    { key: "created_at", label: "Criado em" },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
            <Select value={tipoFilter} onValueChange={handleTipoChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Tipos</SelectItem>
                {tipoOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={handleClearFilters}
              title="Limpar filtros"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col.key}>
                      <button
                        onClick={() => handleSort(col.key)}
                        className={cn(
                          "flex items-center gap-1 text-xs font-medium uppercase tracking-wider",
                          sortBy === col.key ? "text-gray-900" : "text-gray-500",
                        )}
                      >
                        {col.label}
                        <SortIcon column={col.key} />
                      </button>
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  usuarios.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell>
                        <div className="font-medium">{usuario.nome_completo || "—"}</div>
                      </TableCell>
                      <TableCell className="text-gray-600">{usuario.email}</TableCell>
                      <TableCell>
                        <Badge className={getTipoBadgeColor(usuario.tipo_usuario)} variant="outline">
                          {getTipoLabel(usuario.tipo_usuario)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {new Date(usuario.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <EditUserDialog user={usuario} />
                          {["admin", "diretor"].includes(currentUserTipo) && (
                            <DeleteUserDialog user={usuario} />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

      <DataPagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  )
}
