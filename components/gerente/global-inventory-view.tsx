"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, AlertTriangle } from "lucide-react"
import type { Inventory } from "@/lib/types"

interface GlobalInventoryViewProps {
  inventory: Inventory[]
}

export function GlobalInventoryView({ inventory }: GlobalInventoryViewProps) {
  if (inventory.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="mb-4 h-12 w-12 text-gray-400" />
          <p className="text-lg font-medium text-gray-600">No hay inventario disponible</p>
        </CardContent>
      </Card>
    )
  }

  // Group inventory by hospital
  const inventoryByHospital = inventory.reduce(
    (acc, item) => {
      const hospitalId = item.hospital_id
      if (!acc[hospitalId]) {
        acc[hospitalId] = []
      }
      acc[hospitalId].push(item)
      return acc
    },
    {} as Record<string, Inventory[]>,
  )

  return (
    <div className="space-y-6">
      {Object.entries(inventoryByHospital).map(([hospitalId, items]) => {
        const hospitalName = items[0]?.hospital?.name || "Hospital Desconocido"
        const lowStockCount = items.filter((i) => i.quantity <= (i.product?.min_stock || 0)).length

        return (
          <div key={hospitalId} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{hospitalName}</h3>
              {lowStockCount > 0 && (
                <Badge variant="destructive">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  {lowStockCount} productos con stock bajo
                </Badge>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                const isLowStock = item.quantity <= (item.product?.min_stock || 0)

                return (
                  <Card key={item.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.product?.name}</h4>
                            <p className="text-sm text-muted-foreground">{item.product?.category}</p>
                          </div>
                          {isLowStock && <AlertTriangle className="h-5 w-5 text-orange-500" />}
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold">{item.quantity}</p>
                            <p className="text-xs text-muted-foreground">{item.product?.unit}</p>
                            <p className="text-xs text-muted-foreground">Mínimo: {item.product?.min_stock}</p>
                          </div>
                          {isLowStock ? (
                            <Badge variant="destructive">Stock Bajo</Badge>
                          ) : (
                            <Badge variant="secondary">Disponible</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
