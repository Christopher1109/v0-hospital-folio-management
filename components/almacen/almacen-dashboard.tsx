// ===============================================
// components/almacen/almacen-dashboard.tsx
// SIN HISTORIAL
// ===============================================

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Package, Boxes } from "lucide-react"
import { FolioDeliveryList } from "./folio-delivery-list"
import { InventoryManagement } from "./inventory-management"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { User, FolioRequest, Inventory } from "@/lib/types"
import { RoleShell } from "@/components/layout/role-shell"

interface AlmacenDashboardProps {
  user: User & { hospital: any }
  folios: (FolioRequest & { auxiliar: any; hospital: any; folio_items: any[] })[]
  inventory: Inventory[]
}

type AlmacenSection = "dashboard" | "entregas" | "inventario"

export function AlmacenDashboard({ user, folios, inventory }: AlmacenDashboardProps) {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<AlmacenSection>("dashboard")
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const pendingDelivery = folios.filter((f) => f.status === "aprobado_supervisor")
  const delivered = folios.filter((f) => f.status === "entregado")
  const lowStock = inventory.filter((item) => item.quantity <= (item.product?.min_stock || 0))

  const hospitals =
    user.hospital && user.hospital_id
      ? [{ id: user.hospital_id as string, name: user.hospital?.name as string }]
      : []

  // ⚠️ HISTORIAL REMOVIDO
  const navItems = [
    { id: "dashboard" as AlmacenSection, label: "Dashboard", icon: <Clock className="h-4 w-4" /> },
    { id: "entregas" as AlmacenSection, label: "Entregas", icon: <Package className="h-4 w-4" /> },
    { id: "inventario" as AlmacenSection, label: "Inventario", icon: <Boxes className="h-4 w-4" /> },
  ]

  return (
    <RoleShell
      user={user}
      roleLabel="Almacén"
      navItems={navItems}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      hospitals={hospitals}
      selectedHospitalId={user.hospital_id ?? null}
      onHospitalChange={() => {}}
      onSignOut={handleSignOut}
    >
      {/* DASHBOARD */}
      {activeSection === "dashboard" && (
        <section className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendientes de entrega</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingDelivery.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Entregados</CardTitle>
                <Package className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{delivered.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Productos en stock</CardTitle>
                <Boxes className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inventory.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stock bajo</CardTitle>
                <Boxes className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lowStock.length}</div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* ENTREGAS */}
      {activeSection === "entregas" && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xl font-semibold">Folios listos para entrega</h2>
          <FolioDeliveryList
            folios={pendingDelivery}
            userId={user.id}
            inventory={inventory}
            onUpdate={() => router.refresh()}
          />
        </section>
      )}

      {/* INVENTARIO */}
      {activeSection === "inventario" && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xl font-semibold">Gestión de inventario</h2>
          <InventoryManagement
            inventory={inventory}
            hospitalId={user.hospital_id!}
            onUpdate={() => router.refresh()}
          />
        </section>
      )}
    </RoleShell>
  )
}
