"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { FolioDeliveryList } from "./folio-delivery-list"
import { InventoryManagement } from "./inventory-management"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { User, FolioRequest, Inventory } from "@/lib/types"
import { RoleShell } from "@/components/layout/role-shell"

// The sections available in the warehouse (almacén) dashboard.  Users can
// switch between a summary of key metrics, folios ready for delivery,
// and detailed inventory management.
type AlmacenSection = "dashboard" | "entregas" | "inventario"

interface AlmacenDashboardProps {
  user: User & { hospital: any }
  folios: (FolioRequest & {
    auxiliar: any
    hospital: any
    folio_items: any[]
  })[]
  inventory: Inventory[]
}

/**
 * The AlmacenDashboard component presents a concise overview for
 * warehouse personnel.  It retains the original navigation
 * structure but enriches the dashboard with a summary card for
 * low‑stock items and a short list of those products.  This helps
 * staff quickly identify which supplies are below their minimum
 * threshold without diving into the inventory management page.  A
 * RoleShell wraps the content to provide a consistent sidebar and
 * hospital selector.
 */
export function AlmacenDashboard({ user, folios, inventory }: AlmacenDashboardProps) {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<AlmacenSection>("dashboard")
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  // Folios awaiting delivery and those already delivered
  const pendingDelivery = folios.filter((f) => f.status === "aprobado_supervisor")
  const delivered = folios.filter((f) => f.status === "entregado")

  // Products at or below their minimum stock level
  const lowStock = inventory.filter((item) => item.quantity <= (item.product?.min_stock || 0))

  // Only the current hospital is relevant for warehouse staff
  const hospitals =
    user.hospital && user.hospital_id ? [{ id: user.hospital_id as string, name: user.hospital?.name as string }] : []

  // A short list of the first few low‑stock items for display on the dashboard
  const lowStockList = lowStock.slice(0, 5)

  const navItems = [
    { id: "dashboard" as AlmacenSection, label: "Resumen" },
    { id: "entregas" as AlmacenSection, label: "Entregas" },
    { id: "inventario" as AlmacenSection, label: "Inventario" },
  ]

  return (
    <RoleShell
      user={user}
      roleLabel="Almacén"
      navItems={navItems}
      activeSection={activeSection}
      onSectionChange={(id) => setActiveSection(id as AlmacenSection)}
      hospitals={hospitals}
      selectedHospitalId={hospitals.length > 0 ? hospitals[0].id : null}
      onHospitalChange={() => {}}
      onSignOut={handleSignOut}
    >
      {/* Section: Dashboard / Resumen */}
      {activeSection === "dashboard" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Pendientes de entrega</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{pendingDelivery.length}</p>
                <p className="text-sm text-muted-foreground">Folios listos para entregar</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Entregados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{delivered.length}</p>
                <p className="text-sm text-muted-foreground">Folios entregados</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Productos en stock</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{inventory.length}</p>
                <p className="text-sm text-muted-foreground">Total de líneas de inventario</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Stock bajo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{lowStock.length}</p>
                <p className="text-sm text-muted-foreground">Productos bajo el mínimo</p>
              </CardContent>
            </Card>
          </div>
          {/* Low‑stock detail list */}
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Productos con stock bajo
            </h3>
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay productos con stock bajo en este momento.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {lowStockList.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>{item.product?.name}</span>
                    <span>
                      {item.quantity} {item.product?.unit} (mín: {item.product?.min_stock})
                    </span>
                  </li>
                ))}
                {lowStock.length > lowStockList.length && (
                  <li className="text-sm text-muted-foreground">...y {lowStock.length - lowStockList.length} más</li>
                )}
              </ul>
            )}
          </div>
        </div>
      )}
      {/* Section: Entregas */}
      {activeSection === "entregas" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Folios listos para entrega</h2>
          <FolioDeliveryList folios={pendingDelivery} onDelivered={() => router.refresh()} />
        </div>
      )}
      {/* Section: Inventario */}
      {activeSection === "inventario" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Gestión de inventario</h2>
          <InventoryManagement
            user={user}
            inventory={inventory}
            onUpdated={() => {
              router.refresh()
            }}
          />
        </div>
      )}
    </RoleShell>
  )
}
