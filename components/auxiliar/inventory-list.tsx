"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, AlertTriangle } from "lucide-react"
import type { Inventory } from "@/lib/types"

interface InventoryListProps {
  inventory: Inventory[]
}

export function InventoryList({ inventory }: InventoryListProps) {
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {inventory.map((item) => {
        const isLowStock = item.quantity <= (item.product?.min_stock || 0)

        return (
          <Card key={item.id}>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.product?.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.product?.category}</p>
                  </div>
                  {isLowStock && <AlertTriangle className="h-5 w-5 text-orange-500" />}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{item.product?.description}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{item.quantity}</p>
                    <p className="text-xs text-muted-foreground">{item.product?.unit}</p>
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
  )
}
