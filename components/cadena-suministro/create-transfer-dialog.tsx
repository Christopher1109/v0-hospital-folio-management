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
import { Plus } from "lucide-react"

interface CreateTransferDialogProps {
  hospitals: any[]
  centralStorage: any
  storageInventory: any[]
  restockBatches: any[]
}

export function CreateTransferDialog({
  hospitals,
  centralStorage,
  storageInventory,
  restockBatches,
}: CreateTransferDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Crear Traspaso
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crear Traspaso a Hospital</DialogTitle>
          <DialogDescription>Selecciona el hospital destino y los productos a traspasar</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Funcionalidad en desarrollo</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
