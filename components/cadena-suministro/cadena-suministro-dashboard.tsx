"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TransferOrdersList } from "./transfer-orders-list"
import { CreateTransferDialog } from "./create-transfer-dialog"
import { Truck, Package, Warehouse, AlertCircle } from "lucide-react"

interface CadenaSuministroDashboardProps {
  user: any
  restockBatches: any[]
  centralStorage: any
  storageInventory: any[]
  transferOrders: any[]
  hospitals: any[]
}

export function CadenaSuministroDashboard({
  user,
  restockBatches,
  centralStorage,
  storageInventory,
  transferOrders,
  hospitals,
}: CadenaSuministroDashboardProps) {
  const [activeTab, setActiveTab] = useState("transfers")

  const pendingTransfers = transferOrders.filter((t) => t.status === "pending")
  const inTransitTransfers = transferOrders.filter((t) => t.status === "in_transit")
  const completedTransfers = transferOrders.filter((t) => t.status === "completed")

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Cadena de Suministro</h1>
            <p className="text-muted-foreground">Bienvenido, {user.full_name}</p>
          </div>
          <CreateTransferDialog
            hospitals={hospitals}
            centralStorage={centralStorage}
            storageInventory={storageInventory}
            restockBatches={restockBatches}
          />
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Traspasos Pendientes</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingTransfers.length}</div>
              <p className="text-xs text-muted-foreground">Por enviar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Tránsito</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inTransitTransfers.length}</div>
              <p className="text-xs text-muted-foreground">Enviados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completados</CardTitle>
              <Warehouse className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTransfers.length}</div>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Corridas Disponibles</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{restockBatches.length}</div>
              <p className="text-xs text-muted-foreground">Para procesar</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transfers">Traspasos</TabsTrigger>
            <TabsTrigger value="inventory">Inventario Central</TabsTrigger>
          </TabsList>

          <TabsContent value="transfers" className="space-y-4">
            <TransferOrdersList transfers={transferOrders} centralStorage={centralStorage} />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inventario del Almacén Central</CardTitle>
                <CardDescription>Productos disponibles para traspasar a hospitales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {storageInventory.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay productos en inventario</p>
                  ) : (
                    storageInventory.map((item) => (
                      <div key={item.id} className="flex items-center justify-between border-b py-2">
                        <div>
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-sm text-muted-foreground">{item.product?.unit}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{item.stock}</p>
                          <p className="text-xs text-muted-foreground">en stock</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
