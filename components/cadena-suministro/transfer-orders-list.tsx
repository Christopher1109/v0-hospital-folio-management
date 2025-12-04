"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Truck } from "lucide-react"

interface TransferOrdersListProps {
  transfers: any[]
  centralStorage: any
}

export function TransferOrdersList({ transfers, centralStorage }: TransferOrdersListProps) {
  const handleMarkInTransit = async (transferId: string) => {
    console.log("[v0] Marking transfer as in transit:", transferId)
  }

  return (
    <div className="space-y-4">
      {transfers.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <p className="text-muted-foreground">No hay traspasos registrados</p>
          </CardContent>
        </Card>
      ) : (
        transfers.map((transfer) => (
          <Card key={transfer.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Traspaso a {transfer.to_storage?.hospital?.name}</CardTitle>
                  <CardDescription>Creado: {new Date(transfer.created_at).toLocaleDateString()}</CardDescription>
                </div>
                <Badge
                  variant={
                    transfer.status === "pending"
                      ? "default"
                      : transfer.status === "in_transit"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {transfer.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Productos ({transfer.transfer_order_items?.length || 0})</p>
                <div className="space-y-1">
                  {transfer.transfer_order_items?.slice(0, 3).map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.product?.name}</span>
                      <span className="font-medium">{item.quantity}</span>
                    </div>
                  ))}
                  {(transfer.transfer_order_items?.length || 0) > 3 && (
                    <p className="text-xs text-muted-foreground">+{transfer.transfer_order_items.length - 3} más...</p>
                  )}
                </div>
              </div>

              {transfer.status === "pending" && (
                <Button variant="default" size="sm" onClick={() => handleMarkInTransit(transfer.id)}>
                  <Truck className="mr-2 h-4 w-4" />
                  Marcar como En Tránsito
                </Button>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
