"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Send } from "lucide-react"

interface PurchaseOrdersListProps {
  orders: any[]
}

export function PurchaseOrdersList({ orders }: PurchaseOrdersListProps) {
  const handleSendToFinance = async (orderId: string) => {
    console.log("[v0] Sending order to finance:", orderId)
  }

  return (
    <div className="space-y-4">
      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <p className="text-muted-foreground">No hay órdenes de compra</p>
          </CardContent>
        </Card>
      ) : (
        orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>OC - {order.supplier?.name}</CardTitle>
                  <CardDescription>Creado: {new Date(order.created_at).toLocaleDateString()}</CardDescription>
                </div>
                <Badge variant={order.status === "pending" ? "default" : "secondary"}>{order.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Productos ({order.purchase_order_items?.length || 0})</p>
                <div className="space-y-1">
                  {order.purchase_order_items?.slice(0, 3).map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.product?.name}</span>
                      <span className="font-medium">
                        {item.quantity} x ${item.unit_price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {order.status === "pending" && (
                <Button variant="default" size="sm" onClick={() => handleSendToFinance(order.id)}>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar a Finanzas
                </Button>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
