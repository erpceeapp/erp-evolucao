"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useState } from "react"

interface ConflictStrategyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityName: string
  onConfirm: (strategy: "skip" | "overwrite") => void
  onCancel: () => void
}

export function ConflictStrategyDialog({
  open,
  onOpenChange,
  entityName,
  onConfirm,
  onCancel,
}: ConflictStrategyDialogProps) {
  const [strategy, setStrategy] = useState<"skip" | "overwrite">("skip")

  const handleConfirm = () => {
    onConfirm(strategy)
  }

  const handleCancel = () => {
    onCancel()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Conflitos ao importar {entityName}</DialogTitle>
          <DialogDescription>
            Como deseja lidar com registros duplicados?
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={strategy} onValueChange={(v: "skip" | "overwrite") => setStrategy(v)} className="gap-3">
          <div className="flex items-center gap-3 rounded-md border p-3 has-data-[state=checked]:border-primary">
            <RadioGroupItem value="skip" id="skip" />
            <Label htmlFor="skip" className="font-normal cursor-pointer">Pular duplicatas</Label>
          </div>
          <div className="flex items-center gap-3 rounded-md border p-3 has-data-[state=checked]:border-primary">
            <RadioGroupItem value="overwrite" id="overwrite" />
            <Label htmlFor="overwrite" className="font-normal cursor-pointer">Sobrescrever duplicatas</Label>
          </div>
        </RadioGroup>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
