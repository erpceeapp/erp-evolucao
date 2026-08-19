"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { UserPlus, Copy, Check } from "lucide-react"
import { toast } from "sonner"
import { translateError } from "@/lib/error-messages"
import { createProfessorAccess } from "@/app/(authenticated)/professores/novo/actions"

interface CreateAccessButtonProps {
  professorId: string
  professorName: string
}

export function CreateAccessButton({ professorId, professorName }: CreateAccessButtonProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [senhaTemporaria, setSenhaTemporaria] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCreateAccess = async () => {
    setIsLoading(true)
    try {
      const result = await createProfessorAccess(professorId)
      if (result.error) {
        toast.error(translateError(result.error))
        setShowConfirmDialog(false)
      } else if (result.success && result.senhaTemporaria) {
        setSenhaTemporaria(result.senhaTemporaria)
        setShowConfirmDialog(false)
        setShowPasswordDialog(true)
        toast.success("Acesso criado com sucesso")
      }
    } catch {
      toast.error("Erro ao criar acesso")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(senhaTemporaria)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Erro ao copiar senha")
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        onClick={() => setShowConfirmDialog(true)}
        title="Criar acesso ao sistema"
      >
        <UserPlus className="h-4 w-4" />
      </Button>

      {/* Dialog de confirmação */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Acesso ao Sistema</DialogTitle>
            <DialogDescription>
              Será criado um usuário de acesso para <strong>{professorName}</strong>.
              Uma senha temporária será gerada e exibida abaixo. Anote-a e repasse ao professor.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleCreateAccess} disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar Acesso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog com a senha */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acesso Criado com Sucesso</DialogTitle>
            <DialogDescription>
              Repasse a senha abaixo ao professor. Ao fazer o primeiro login, ele será obrigado a trocar a senha.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 border rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-2">Senha temporária:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-lg font-mono font-bold bg-white px-3 py-2 border rounded">
                  {senhaTemporaria}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPassword}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-sm text-amber-600">
              Anote esta senha. Ela não será exibida novamente.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPasswordDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
