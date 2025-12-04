"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RestockBatchesList } from "./restock-batches-list"
import { SuppliersList } from "./suppliers-list"
import { PurchaseOrdersList } from "./purchase-orders-list"
import { WarehouseInventory } from "./warehouse-inventory"
import { Package, FileSpreadsheet, ShoppingCart, Warehouse } from "lucide-react"

interface GerenteAlmacenDashboardProps {
  user: any
  restockBatches: any[]
  suppliers: any[]
  supplierOffers: any[]
  purchaseOrders: any[]
  storageInventory: any[]
  centralStorage: any
}

export function GerenteAlmacenDashboard({
  user,
  restockBatches,
  suppliers,
  supplierOffers,
  purchaseOrders,
  storageInventory,
  centralStorage,
}: GerenteAlmacenDashboardProps) {
  const [activeTab, setActiveTab] = useState("batches")

  const pendingBatches = restockBatches.filter((b) => b.status === "pending")
  const pendingOrders = purchaseOrders.filter((o) => o.status === "pending")
  const activeSuppliers = suppliers.filter((s) => s.active)

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gerente de Almacén</h1>
            <p className="text-muted-foreground">Bienvenido, {user.full_name}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Corridas Pendientes</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingBatches.length}</div>
              <p className="text-xs text-muted-foreground">Por procesar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Órdenes de Compra</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders.length}</div>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proveedores Activos</CardTitle>
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSuppliers.length}</div>
              <p className="text-xs text-muted-foreground">Registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventario Central</CardTitle>
              <Warehouse className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{storageInventory.length}</div>
              <p className="text-xs text-muted-foreground">Productos</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="batches">Corridas de Reabasto</TabsTrigger>
            <TabsTrigger value="suppliers">Proveedores</TabsTrigger>
            <TabsTrigger value="orders">Órdenes de Compra</TabsTrigger>
            <TabsTrigger value="inventory">Inventario Central</TabsTrigger>
          </TabsList>

          <TabsContent value="batches" className="space-y-4">
            <RestockBatchesList batches={restockBatches} suppliers={suppliers} supplierOffers={supplierOffers} />
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-4">
            <SuppliersList suppliers={suppliers} />
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <PurchaseOrdersList orders={purchaseOrders} />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <WarehouseInventory inventory={storageInventory} storage={centralStorage} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
