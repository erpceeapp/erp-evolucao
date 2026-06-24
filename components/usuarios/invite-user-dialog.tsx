"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { UserPlus, Mail } from "lucide-react"
import { useRouter } from "next/navigation"
import { createInvite } from "@/app/(authenticated)/usuarios/actions"

const tipoOptions = [
  { value: "admin", label: "Administrador" },
  { value: "secretaria", label: "Secretaria" },
  { value: "professor", label: "Professor" },
  { value: "coordenacao", label: "Coordenação" },
  { value: "diretor", label: "Diretor" },
]

interface InviteUserDialogProps {
  currentUserTipo?: string
}

export function InviteUserDialog({ currentUserTipo }: InviteUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [tipo, setTipo] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async () => {
    if (!email || !tipo) {
      setError("Preencha todos os campos")
      return
    }

    setSending(true)
    setError("")

    const result = await createInvite(email, tipo)

    setSending(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setOpen(false)
    setEmail("")
    setTipo("")
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Convidar Usuário
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar Usuário</DialogTitle>
          <DialogDescription>Envie um convite por email para um novo usuário.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">E-mail</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@email.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-tipo">Tipo de Usuário</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger id="invite-tipo">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {tipoOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={sending}>
            <Mail className="h-4 w-4 mr-2" />
            {sending ? "Enviando..." : "Enviar Convite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
