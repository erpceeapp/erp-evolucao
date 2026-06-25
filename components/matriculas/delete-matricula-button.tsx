"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

interface DeleteMatriculaButtonProps {
  matriculaId: string
  numeroMatricula: string
  isDisabled?: boolean
}

export function DeleteMatriculaButton({ matriculaId, numeroMatricula, isDisabled }: DeleteMatriculaButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [open, setOpen] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)

    const supabase = createClient()

    try {
      const { error } = await supabase.from("matriculas").update({ status: "cancelada" }).eq("id", matriculaId)

      if (error) throw error

      router.push("/matriculas")
      router.refresh()
    } catch (err: any) {
      console.error("Erro ao remover matrícula:", err)
      toast.error("Erro ao remover matrícula. Tente novamente.")
      setIsDeleting(false)
      setOpen(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={isDisabled || isDeleting}>
          <Trash2 className="h-4 w-4 mr-2" />
          {isDeleting ? "Removendo..." : "Remover"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja realmente remover a matrícula <strong>#{numeroMatricula}</strong>?<br />
            <br />
            Esta ação irá cancelar a matrícula e não poderá ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
            Confirmar Remoção
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
