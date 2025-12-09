"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

import { RoleShell } from "@/components/layout/role-shell"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import type { User } from "@/lib/types"

interface CadenaSuministroDashboardProps {
  user: User & { hospital?: any }
  hospitals: any[]
  inventory: any[]
  transferOrders: any[]
  products: any[]
}

type Section = "dashboard" | "transferencias" | "crear" | "inventario"

/**
 * Dashboard for the supply chain manager.  This component allows the
 * user to monitor existing transfer orders, create new transfers and
 * view inventory across all hospitals.  A simple dashboard provides
 * high‑level counts of pending/completed transfers and low‑stock
 * products.  See comments in the gerente‑almacen dashboard for
 * patterns reused here.
 */
export function CadenaSuministroDashboard({
  user,
  hospitals,
  inventory,
  transferOrders,
  products,
}: CadenaSuministroDashboardProps) {
  const router = useRouter()
  const supabase = createClient()

  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<Section>("dashboard")

  // Form state for creating a new transfer order
  const [originHospitalId, setOriginHospitalId] = useState<string | "">("")
  const [destinationHospitalId, setDestinationHospitalId] = useState<string | "">("")
  const [productId, setProductId] = useState<string | "">("")
  const [quantity, setQuantity] = useState<number | "">("")
  const [creating, setCreating] = useState(false)

  // Sign out handler
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  // Filter inventory by selected hospital (if any)
  const filteredInventory: any[] = useMemo(() => {
    if (!selectedHospitalId) return inventory
    return inventory.filter((inv: any) => inv.hospital_id === selectedHospitalId)
  }, [inventory, selectedHospitalId])

  // Count pending and completed transfers
  const pendingTransfers = transferOrders.filter(
    (tr: any) => !tr.status || ["pendiente", "en_transito"].includes(tr.status),
  )
  const completedTransfers = transferOrders.filter(
    (tr: any) => tr.status && ["completada", "recibida"].includes(tr.status),
  )
  const lowStockCount = filteredInventory.filter(
    (inv: any) => inv.quantity <= ((inv.product?.min_stock as number) || 0),
  ).length

  // Complete a transfer
  const handleCompleteTransfer = async (id: string) => {
    await supabase.from("transfer_orders").update({ status: "completada" }).eq("id", id)
    router.refresh()
  }

  // Create a new transfer order.  Minimal validation is performed
  // client‑side; additional constraints (e.g. ensuring origin != destination
  // and that quantity is positive) should be enforced in database triggers
  // or RPCs.  The creation happens in two steps: first insert into
  // transfer_orders, then into transfer_order_items.  On success the
  // form is cleared and the router is refreshed.
  const handleCreateTransfer = async () => {
    if (!originHospitalId || !destinationHospitalId || !productId || !quantity) {
      return
    }
    setCreating(true)
    // 1. Create the transfer order
    const { data: orderData, error: orderErr } = await supabase
      .from("transfer_orders")
      .insert({
        origin_hospital_id: originHospitalId,
        destination_hospital_id: destinationHospitalId,
        status: "pendiente",
      })
      .single()
    if (orderErr || !orderData) {
      console.error("Error creating transfer order", orderErr)
      setCreating(false)
      return
    }
    const orderId = orderData.id
    // 2. Create the transfer item row
    await supabase.from("transfer_order_items").insert({
      transfer_order_id: orderId,
      product_id: productId,
      quantity: Number(quantity),
    })
    // Reset form and refresh
    setOriginHospitalId("")
    setDestinationHospitalId("")
    setProductId("")
    setQuantity("")
    setCreating(false)
    router.refresh()
    setActiveSection("transferencias")
  }

  const navItems = [
    { id: "dashboard" as Section, label: "Dashboard" },
    { id: "transferencias" as Section, label: "Transferencias" },
    { id: "crear" as Section, label: "Crear transferencia" },
    { id: "inventario" as Section, label: "Inventario" },
  ]

  const handleHospitalChange = (id: string) => {
    setSelectedHospitalId(id)
  }

  return (
    <RoleShell
      user={user}
      roleLabel="Cadena de Suministro"
      navItems={navItems}
      activeSection={activeSection}
      onSectionChange={(id) => setActiveSection(id as Section)}
      hospitals={hospitals}
      selectedHospitalId={selectedHospitalId}
      onHospitalChange={handleHospitalChange}
      onSignOut={handleSignOut}
    >
      {/* Dashboard */}
      {activeSection === "dashboard" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Transferencias pendientes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{pendingTransfers.length}</p>
                <p className="text-sm text-muted-foreground">En espera o en tránsito</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Transferencias completadas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{completedTransfers.length}</p>
                <p className="text-sm text-muted-foreground">Marcar completadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Productos bajo mínimo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{lowStockCount}</p>
                <p className="text-sm text-muted-foreground">Filtrados por hospital</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Transferencias list */}
      {activeSection === "transferencias" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Transferencias</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-3 py-2">Origen</th>
                  <th className="px-3 py-2">Destino</th>
                  <th className="px-3 py-2">Producto</th>
                  <th className="px-3 py-2">Cantidad</th>
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
                    <td className="px-3 py-2">
                      {/* Show first product for simplicity; a real transfer may have multiple items */}
                      {tr.items && tr.items.length > 0 ? tr.items[0].product?.name : "–"}
                    </td>
                    <td className="px-3 py-2">
                      {tr.items && tr.items.length > 0 ? tr.items[0].quantity : "–"}
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

      {/* Crear transferencia */}
      {activeSection === "crear" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Crear transferencia</h2>
          <div className="max-w-xl space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Hospital origen</label>
              <Select value={originHospitalId} onValueChange={(v) => setOriginHospitalId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona hospital" />
                </SelectTrigger>
                <SelectContent>
                  {hospitals.map((h) => (
                    <SelectItem key={h.id} value={h.id} disabled={h.id === destinationHospitalId}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Hospital destino</label>
              <Select value={destinationHospitalId} onValueChange={(v) => setDestinationHospitalId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona hospital" />
                </SelectTrigger>
                <SelectContent>
                  {hospitals.map((h) => (
                    <SelectItem key={h.id} value={h.id} disabled={h.id === originHospitalId}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Producto</label>
              <Select value={productId} onValueChange={(v) => setProductId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Cantidad</label>
              <Input
                type="number"
                value={quantity as any}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="1"
                className="w-full"
              />
            </div>
            <div className="pt-2">
              <Button
                onClick={handleCreateTransfer}
                disabled={creating || !originHospitalId || !destinationHospitalId || !productId || !quantity}
              >
                Crear transferencia
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Inventario */}
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
    </RoleShell>
  )
}
