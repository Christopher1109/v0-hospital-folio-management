"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileText, Package, AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { FolioRequest, Inventory } from "@/lib/types"

interface FolioDeliveryListProps {
  folios: (FolioRequest & { auxiliar: any; hospital: any; folio_items: any[] })[]
  userId: string
  inventory: Inventory[]
  onUpdate: () => void
  readOnly?: boolean
}

const priorityConfig = {
  normal: { label: "Normal", className: "bg-gray-100 text-gray-800" },
  urgente: { label: "Urgente", className: "bg-red-100 text-red-800" },
}

export function FolioDeliveryList({ folios, userId, inventory, onUpdate, readOnly = false }: FolioDeliveryListProps) {
  const [selectedFolio, setSelectedFolio] = useState<any | null>(null)
  const [isDelivering, setIsDelivering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getInventoryForProduct = (productId: string) => {
    return inventory.find((inv) => inv.product_id === productId)
  }

  const canDeliverFolio = (folio: any) => {
    return folio.folio_items?.every((item: any) => {
      const inv = getInventoryForProduct(item.product_id)
      return inv && inv.quantity >= item.quantity_approved
    })
  }

  const handleDeliver = async () => {
    if (!selectedFolio) return
    setError(null)
    setIsDelivering(true)

    const supabase = createClient()

    try {
      // Check if we have enough stock for all items
      for (const item of selectedFolio.folio_items) {
        const inv = getInventoryForProduct(item.product_id)
        if (!inv || inv.quantity < item.quantity_approved) {
          throw new Error(`Stock insuficiente para ${item.product?.name}`)
        }
      }

      // Update inventory - deduct quantities
      for (const item of selectedFolio.folio_items) {
        const inv = getInventoryForProduct(item.product_id)
        if (inv) {
          const { error: invError } = await supabase
            .from("inventory")
            .update({
              quantity: inv.quantity - item.quantity_approved,
              updated_at: new Date().toISOString(),
            })
            .eq("id", inv.id)

          if (invError) throw invError
        }
      }

      // Update folio status to delivered
      const { error: folioError } = await supabase
        .from("folio_requests")
        .update({
          status: "entregado",
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedFolio.id)

      if (folioError) throw folioError

      // Add history entry
      await supabase.from("folio_history").insert({
        folio_id: selectedFolio.id,
        user_id: userId,
        action: "Material entregado",
        previous_status: "aprobado_supervisor",
        new_status: "entregado",
      })

      setSelectedFolio(null)
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al entregar el folio")
    } finally {
      setIsDelivering(false)
    }
  }

  if (folios.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="mb-4 h-12 w-12 text-gray-400" />
          <p className="text-lg font-medium text-gray-600">No hay folios para mostrar</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {folios.map((folio) => {
          const priority = priorityConfig[folio.priority]
          const canDeliver = canDeliverFolio(folio)

          return (
            <Card key={folio.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{folio.folio_number}</CardTitle>
                    <p className="text-sm text-muted-foreground">Solicitado por: {folio.auxiliar?.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Fecha: {new Date(folio.created_at).toLocaleDateString("es-MX")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={priority.className}>{priority.label}</Badge>
                    {folio.status === "entregado" && (
                      <Badge className="bg-purple-100 text-purple-800">
                        <Package className="mr-1 h-3 w-3" />
                        Entregado
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Productos a entregar:</p>
                    <ul className="mt-1 space-y-2">
                      {folio.folio_items?.map((item: any) => {
                        const inv = getInventoryForProduct(item.product_id)
                        const hasStock = inv && inv.quantity >= item.quantity_approved

                        return (
                          <li key={item.id} className="rounded-md border p-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">{item.product?.name}</p>
                                <p className="text-sm text-muted-foreground">Cantidad: {item.quantity_approved}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm">Stock: {inv?.quantity || 0}</p>
                                {!hasStock && (
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertTriangle className="mr-1 h-3 w-3" />
                                    Insuficiente
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                  {!readOnly && folio.status === "aprobado_supervisor" && (
                    <Button onClick={() => setSelectedFolio(folio)} disabled={!canDeliver} size="sm" className="w-full">
                      {canDeliver ? "Marcar como Entregado" : "Stock Insuficiente"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Delivery Confirmation Dialog */}
      <Dialog open={selectedFolio !== null} onOpenChange={(open) => !open && setSelectedFolio(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirmar Entrega - {selectedFolio?.folio_number}</DialogTitle>
            <DialogDescription>Verifica los productos antes de confirmar la entrega</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Entregar a:</p>
              <p className="text-sm text-muted-foreground">{selectedFolio?.auxiliar?.full_name}</p>
            </div>
            <div className="space-y-3">
              <Label>Productos a Entregar</Label>
              {selectedFolio?.folio_items?.map((item: any) => {
                const inv = getInventoryForProduct(item.product_id)

                return (
                  <div key={item.id} className="rounded-lg border p-3">
                    <div className="mb-2">
                      <p className="font-medium">{item.product?.name}</p>
                      <p className="text-sm text-muted-foreground">{item.product?.category}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs">Cantidad a Entregar</Label>
                        <p className="text-lg font-bold text-green-600">{item.quantity_approved}</p>
                      </div>
                      <div className="text-right">
                        <Label className="text-xs">Stock Actual</Label>
                        <p className="text-lg font-bold">{inv?.quantity || 0}</p>
                      </div>
                      <div className="text-right">
                        <Label className="text-xs">Stock Después</Label>
                        <p className="text-lg font-bold text-blue-600">
                          {(inv?.quantity || 0) - item.quantity_approved}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="rounded-md bg-blue-50 p-3">
              <p className="text-sm text-blue-800">
                Al confirmar la entrega, se descontará el stock del inventario y se marcará el folio como completado.
              </p>
            </div>
            {error && (
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedFolio(null)}>
              Cancelar
            </Button>
            <Button onClick={handleDeliver} disabled={isDelivering}>
              {isDelivering ? "Procesando..." : "Confirmar Entrega"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
