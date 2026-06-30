"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { LogOut } from "lucide-react"
import { logoutAction } from "@/app/auth/logout/actions"

export function LogoutConfirmDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <LogOut className="h-6 w-6 text-blue-600" />
          </div>
          <DialogTitle>Sair do Sistema</DialogTitle>
          <DialogDescription>Tem certeza que deseja sair?</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <form action={logoutAction}>
            <Button type="submit" className="w-full">
              Sim, sair
            </Button>
          </form>
          <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
            Voltar ao Dashboard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
