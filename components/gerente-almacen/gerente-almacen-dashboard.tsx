"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

import { RoleShell } from "@/components/layout/role-shell"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { User, Inventory as InventoryType } from "@/lib/types"

/**
 * Props passed to the warehouse manager dashboard.  In addition to the
 * authenticated user, we provide lists of hospitals, inventory, restock
 * requests, purchase orders, transfer orders and suppliers.  The
 * generic types are kept broad to avoid tight coupling to the DB
 * schema; client logic inspects only the fields it needs.  If you
 * extend the back‑end tables you can still pass additional fields
 * without changing this interface.
 */
interface GerenteAlmacenDashboardProps {
  user: User & { hospital?: any }
  hospitals: any[]
  inventory: any[]
  restockRequests: any[]
  purchaseOrders: any[]
  transferOrders: any[]
  suppliers: any[]
}

type Section =
  | "dashboard"
  | "inventario"
  | "restock"
  | "ordenes"
  | "transferencias"
  | "proveedores"

/**
 * Dashboard for the warehouse manager (gerente de almacén).  This
 * component organizes the available data into several sections:
 *
 *  • Dashboard: high‑level counts of low‑stock products, pending
 *    restock requests, open purchase orders and pending transfers.
 *  • Inventario: global view of inventory with optional filtering by
 *    hospital and highlighting of items under minimum stock.
 *  • Restock: list of hospital restock requests with buttons to
 *    approve or reject each one.
 *  • Ordenes: list of purchase orders.  Creation of new orders is
 *    deferred to future iterations.
 *  • Transferencias: list of transfer orders between hospitals with
 *    ability to mark a transfer as completed.
 *  • Proveedores: simple listing of suppliers.
 */
export function GerenteAlmacenDashboard({
  user,
  hospitals,
  inventory,
  restockRequests,
  purchaseOrders,
  transferOrders,
  suppliers,
}: GerenteAlmacenDashboardProps) {
  const router = useRouter()
  const supabase = createClient()

  // Selected hospital for filtering inventory.  By default we show
  // aggregated data, so this is null until the user selects a hospital.
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<Section>("dashboard")

  // Sign out the current user.
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  // Filter inventory by selected hospital (if any).  Otherwise return
  // all inventory rows.  Use useMemo for efficient recomputation.
  const filteredInventory: any[] = useMemo(() => {
    if (!selectedHospitalId) return inventory
    return inventory.filter((inv: any) => inv.hospital_id === selectedHospitalId)
  }, [inventory, selectedHospitalId])

  // Items with quantity less than or equal to their minimum stock.
  const lowStockItems: any[] = useMemo(() => {
    return filteredInventory.filter(
      (item: any) => item.quantity <= ((item.product?.min_stock as number) || 0),
    )
  }, [filteredInventory])

  // Count of pending restock requests (status === 'pendiente' or null).
  const pendingRestockCount = useMemo(() => {
    return restockRequests.filter((r: any) => !r.status || r.status === "pendiente").length
  }, [restockRequests])

  // Count of open purchase orders (not finalised).  We treat orders
  // without a status or with status other than 'completada' or
  // 'cancelada' as open.
  const openPurchaseOrderCount = useMemo(() => {
    return purchaseOrders.filter(
      (po: any) => !po.status || !["completada", "cancelada"].includes(po.status),
    ).length
  }, [purchaseOrders])

  // Count of pending transfers (status pending or in transit)
  const pendingTransferCount = useMemo(() => {
    return transferOrders.filter(
      (tr: any) => !tr.status || ["pendiente", "en_transito"].includes(tr.status),
    ).length
  }, [transferOrders])

  // Approve a restock request by setting its status to 'aprobado'
  const handleApproveRestock = async (id: string) => {
    await supabase
      .from("hospital_restock_requests")
      .update({ status: "aprobado" })
      .eq("id", id)
    // Force a refresh to fetch updated data
    router.refresh()
  }

  // Reject a restock request by setting its status to 'rechazado'
  const handleRejectRestock = async (id: string) => {
    await supabase
      .from("hospital_restock_requests")
      .update({ status: "rechazado" })
      .eq("id", id)
    router.refresh()
  }

  // Mark a transfer order as completed.  A real implementation might
  // update inventory quantities for both origin and destination; here
  // we only set the status for simplicity.
  const handleCompleteTransfer = async (id: string) => {
    await supabase.from("transfer_orders").update({ status: "completada" }).eq("id", id)
    router.refresh()
  }

  // Prepare navigation items.  Use a consistent casing for the IDs
  // because RoleShell expects activeSection to match an item id.
  const navItems = [
    { id: "dashboard" as Section, label: "Dashboard" },
    { id: "inventario" as Section, label: "Inventario" },
    { id: "restock" as Section, label: "Reabasto" },
    { id: "ordenes" as Section, label: "Órdenes de compra" },
    { id: "transferencias" as Section, label: "Transferencias" },
    { id: "proveedores" as Section, label: "Proveedores" },
  ]

  // Handler for switching hospitals from RoleShell; update state
  const handleHospitalChange = (id: string) => {
    setSelectedHospitalId(id)
  }

  return (
    <RoleShell
      user={user}
      roleLabel="Gerente de Almacén"
      navItems={navItems}
      activeSection={activeSection}
      onSectionChange={(id) => setActiveSection(id as Section)}
      hospitals={hospitals}
      selectedHospitalId={selectedHospitalId}
      onHospitalChange={handleHospitalChange}
      onSignOut={handleSignOut}
    >
      {/* DASHBOARD SECTION */}
      {activeSection === "dashboard" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Productos bajo mínimo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{lowStockItems.length}</p>
                <p className="text-sm text-muted-foreground">Filtrados por hospital seleccionado</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Solicitudes de reabasto</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{pendingRestockCount}</p>
                <p className="text-sm text-muted-foreground">Pendientes de aprobación</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Órdenes de compra abiertas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{openPurchaseOrderCount}</p>
                <p className="text-sm text-muted-foreground">En proceso</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Transferencias pendientes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{pendingTransferCount}</p>
                <p className="text-sm text-muted-foreground">En tránsito o sin iniciar</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* INVENTARIO SECTION */}
      {activeSection === "inventario" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Inventario global</h2>
          <p className="text-sm text-muted-foreground">
            {selectedHospitalId
              ? `Mostrando inventario del hospital seleccionado.`
              : `Mostrando inventario de todos los hospitales.`}
          </p>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-3 py-2">Hospital</th>
                  <th className="px-3 py-2">Producto</th>
                  <th className="px-3 py-2">Cantidad</th>
                  <th className="px-3 py-2">Mínimo</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((inv: any) => (
                  <tr
                    key={inv.id}
                    className={
                      inv.quantity <= ((inv.product?.min_stock as number) || 0)
                        ? "bg-red-50"
                        : ""
                    }
                  >
                    <td className="border-b px-3 py-2">
                      {inv.hospital?.name || inv.hospital_id}
                    </td>
                    <td className="border-b px-3 py-2">
                      {inv.product?.name || inv.product_id}
                    </td>
                    <td className="border-b px-3 py-2">{inv.quantity}</td>
                    <td className="border-b px-3 py-2">
                      {inv.product?.min_stock ?? "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RESTOCK SECTION */}
      {activeSection === "restock" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Solicitudes de reabasto</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-3 py-2">Hospital</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {restockRequests.map((req: any) => (
                  <tr key={req.id} className="border-b">
                    <td className="px-3 py-2">
                      {req.hospital?.name || req.hospital_id}
                    </td>
                    <td className="px-3 py-2 capitalize">
                      {req.status || "pendiente"}
                    </td>
                    <td className="px-3 py-2">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 space-x-2">
                      {(!req.status || req.status === "pendiente") && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApproveRestock(req.id)}
                          >
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectRestock(req.id)}
                          >
                            Rechazar
                          </Button>
                        </>
                      )}
                      {req.status && req.status !== "pendiente" && (
                        <span className="text-sm text-muted-foreground">
                          {req.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ÓRDENES DE COMPRA SECTION */}
      {activeSection === "ordenes" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Órdenes de compra</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-3 py-2">Proveedor</th>
                  <th className="px-3 py-2">Hospital</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((po: any) => (
                  <tr key={po.id} className="border-b">
                    <td className="px-3 py-2">
                      {po.supplier?.name || po.supplier_id}
                    </td>
                    <td className="px-3 py-2">
                      {po.hospital?.name || po.hospital_id || "Central"}
                    </td>
                    <td className="px-3 py-2 capitalize">
                      {po.status || "pendiente"}
                    </td>
                    <td className="px-3 py-2">
                      {new Date(po.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TRANSFERENCIAS SECTION */}
      {activeSection === "transferencias" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Transferencias</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-3 py-2">Origen</th>
                  <th className="px-3 py-2">Destino</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {transferOrders.map((tr: any) => (
                  <tr key={tr.id} className="border-b">
                    <td className="px-3 py-2">
                      {tr.origin_hospital?.name || tr.origin_hospital_id || "–"}
                    </td>
                    <td className="px-3 py-2">
                      {tr.destination_hospital?.name || tr.destination_hospital_id || "–"}
                    </td>
                    <td className="px-3 py-2 capitalize">
                      {tr.status || "pendiente"}
                    </td>
                    <td className="px-3 py-2">
                      {new Date(tr.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">
                      {(!tr.status || ["pendiente", "en_transito"].includes(tr.status)) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCompleteTransfer(tr.id)}
                        >
                          Marcar completada
                        </Button>
                      )}
                      {tr.status && !["pendiente", "en_transito"].includes(tr.status) && (
                        <span className="text-sm text-muted-foreground">{tr.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PROVEEDORES SECTION */}
      {activeSection === "proveedores" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Proveedores</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Contacto</th>
                  <th className="px-3 py-2">Email</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((sup: any) => (
                  <tr key={sup.id} className="border-b">
                    <td className="px-3 py-2">{sup.name}</td>
                    <td className="px-3 py-2">{sup.contact || "–"}</td>
                    <td className="px-3 py-2">{sup.email || "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </RoleShell>
  )
}
