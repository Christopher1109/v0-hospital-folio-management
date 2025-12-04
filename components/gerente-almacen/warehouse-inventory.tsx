"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface WarehouseInventoryProps {
  inventory: any[]
  storage: any
}

export function WarehouseInventory({ inventory, storage }: WarehouseInventoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventario del Almacén Central</CardTitle>
        <CardDescription>{storage?.name || "Almacén Central CDMX"}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {inventory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay productos en inventario</p>
          ) : (
            inventory.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b py-2">
                <div>
                  <p className="font-medium">{item.product?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.product?.category} - {item.product?.unit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{item.stock}</p>
                  <p className="text-xs text-muted-foreground">en stock</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
