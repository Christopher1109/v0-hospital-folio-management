"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  LogOut,
  FileText,
  CheckCircle2,
  Clock,
  ClipboardPlus,
  Boxes,
  MapPin,
  Activity,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { createClient } from "@/lib/supabase/client"
import { CreateFolioDialog } from "@/components/auxiliar/create-folio-dialog"
import { InventoryManagement } from "@/components/almacen/inventory-management"
import { SupervisorApprovalList } from "@/components/supervisor/supervisor-approval-list"

import type { User, FolioRequest, Inventory } from "@/lib/types"

interface GerenteDashboardProps {
  user: User & { hospital?: any }
  hospitals: any[]
  folios: (FolioRequest & { auxiliar: any; hospital: any; folio_items: any[] })[]
  inventory: Inventory[]
}

export function GerenteDashboard({ user, hospitals, folios, inventory }: GerenteDashboardProps) {
  const router = useRouter()
  const [openCreateFolio, setOpenCreateFolio] = useState(false)
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(
    hospitals.length > 0 ? hospitals[0].id : null,
  )

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  // Hospital seleccionado
  const selectedHospital = useMemo(
    () => hospitals.find((h) => h.id === selectedHospitalId) || null,
    [hospitals, selectedHospitalId],
  )

  // Folios filtrados por hospital
  const filteredFolios = useMemo(() => {
    if (!selectedHospitalId) return []
    return folios.filter((f) => f.hospital_id === selectedHospitalId)
  }, [folios, selectedHospitalId])

  const pendingFolios = filteredFolios.filter((f) => f.status === "pendiente" || f.status === "aprobado_lider")
  const approvedFolios = filteredFolios.filter(
    (f) => f.status === "aprobado_supervisor" || f.status === "entregado",
  )
  const rejectedFolios = filteredFolios.filter((f) => f.status === "rechazado")

  // Inventario filtrado por hospital
  const filteredInventory = useMemo(() => {
    if (!selectedHospitalId) return []
    return inventory.filter((inv) => inv.hospital_id === selectedHospitalId)
  }, [inventory, selectedHospitalId])

  // User "actuando" en el hospital seleccionado
  const actingUser = useMemo(
    () =>
      selectedHospitalId
        ? {
            ...user,
            hospital_id: selectedHospitalId,
          }
        : user,
    [user, selectedHospitalId],
  )

  // Métricas sencillas de productividad del hospital seleccionado
  const productivityStats = useMemo(() => {
    const total = filteredFolios.length
    const byStatus: Record<string, number> = {}
    filteredFolios.forEach((f) => {
      byStatus[f.status] = (byStatus[f.status] || 0) + 1
    })

    // Productos más utilizados (contando folio_items)
    const productUsage: Record<string, { name: string; count: number }> = {}
    filteredFolios.forEach((f) => {
      f.folio_items?.forEach((fi: any) => {
        const key = fi.product_id
        const name = fi.product?.name || "Producto sin nombre"
        if (!productUsage[key]) {
          productUsage[key] = { name, count: 0 }
        }
        productUsage[key].count += fi.quantity_requested ?? 0
      })
    })

    const topProducts = Object.values(productUsage)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return { total, byStatus, topProducts }
  }, [filteredFolios])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Gerente de Operaciones</h1>
            <p className="text-sm text-gray-600">{user.full_name}</p>
            {selectedHospital && (
              <p className="mt-1 flex items-center text-xs text-gray-500">
                <MapPin className="mr-1 h-3 w-3" />
                Hospital seleccionado:
                <span className="ml-1 font-medium text-gray-800">{selectedHospital.name}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            {/* Selector de hospital */}
            <Select
              value={selectedHospitalId ?? undefined}
              onValueChange={(value) => setSelectedHospitalId(value)}
            >
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue placeholder="Selecciona un hospital" />
              </SelectTrigger>
              <SelectContent>
                {hospitals.map((hospital) => (
                  <SelectItem key={hospital.id} value={hospital.id}>
                    {hospital.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        {/* Stats Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes / En revisión</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingFolios.length}</div>
              <p className="text-xs text-muted-foreground">Folios aún en flujo de aprobación</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprobados / Entregados</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedFolios.length}</div>
              <p className="text-xs text-muted-foreground">Folios que ya pasaron por almacén</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Folios del Hospital</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredFolios.length}</div>
              <p className="text-xs text-muted-foreground">Histórico del hospital seleccionado</p>
            </CardContent>
          </Card>
        </div>

        {selectedHospitalId ? (
          <Tabs defaultValue="registrarFolio" className="space-y-6">
            <TabsList className="flex flex-wrap gap-2">
              <TabsTrigger value="registrarFolio">
                <ClipboardPlus className="mr-2 h-4 w-4" />
                Registrar Folio
              </TabsTrigger>

              <TabsTrigger value="registrarInsumo">
                <Boxes className="mr-2 h-4 w-4" />
                Registrar Insumo
              </TabsTrigger>

              <TabsTrigger value="pending">
                Pendientes ({pendingFolios.length})
              </TabsTrigger>

              <TabsTrigger value="approved">
                Aprobados ({approvedFolios.length})
              </TabsTrigger>

              <TabsTrigger value="all">
                Todos ({filteredFolios.length})
              </TabsTrigger>

              <TabsTrigger value="productividad">
                <Activity className="mr-2 h-4 w-4" />
                Productividad
              </TabsTrigger>
            </TabsList>

            {/* TAB: Registrar folio */}
            <TabsContent value="registrarFolio" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Registrar Folio</h2>
                  <p className="text-sm text-muted-foreground">
                    Crea folios como si fueras cualquier usuario operativo del hospital seleccionado.
                  </p>
                </div>
                <Button onClick={() => setOpenCreateFolio(true)}>
                  <ClipboardPlus className="mr-2 h-4 w-4" />
                  Crear Folio
                </Button>
              </div>

              <CreateFolioDialog
                open={openCreateFolio}
                onOpenChange={setOpenCreateFolio}
                user={actingUser}
                inventory={filteredInventory}
                onSuccess={() => router.refresh()}
              />
            </TabsContent>

            {/* TAB: Registrar insumo */}
            <TabsContent value="registrarInsumo">
              <div className="space-y-2 mb-4">
                <h2 className="text-xl font-semibold">Registrar Insumo en Almacén</h2>
                <p className="text-sm text-muted-foreground">
                  Ajusta existencias, entradas y salidas del almacén del hospital seleccionado.
                </p>
              </div>
              <InventoryManagement user={actingUser} inventory={filteredInventory} />
            </TabsContent>

            {/* TAB: Pendientes */}
            <TabsContent value="pending" className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Folios Pendientes / En flujo</h2>
                <p className="text-sm text-muted-foreground">
                  Folios que siguen en proceso de aprobación o están pendientes de almacén.
                </p>
              </div>
              <SupervisorApprovalList
                folios={pendingFolios}
                userId={user.id}
                onUpdate={() => router.refresh()}
              />
            </TabsContent>

            {/* TAB: Aprobados */}
            <TabsContent value="approved" className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Folios Aprobados y Entregados</h2>
                <p className="text-sm text-muted-foreground">
                  Folios que ya fueron aprobados por supervisor o entregados por almacén.
                </p>
              </div>
              <SupervisorApprovalList
                folios={approvedFolios}
                userId={user.id}
                onUpdate={() => router.refresh()}
                readOnly
              />
            </TabsContent>

            {/* TAB: Todos */}
            <TabsContent value="all" className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Todos los Folios del Hospital</h2>
                <p className="text-sm text-muted-foreground">
                  Vista completa del historial de folios del hospital seleccionado.
                </p>
              </div>
              <SupervisorApprovalList
                folios={filteredFolios}
                userId={user.id}
                onUpdate={() => router.refresh()}
                readOnly
              />
            </TabsContent>

            {/* TAB: Productividad */}
            <TabsContent value="productividad" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total de folios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{productivityStats.total}</div>
                    <p className="text-xs text-muted-foreground">
                      Folios totales del hospital seleccionado
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Rechazados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{rejectedFolios.length}</div>
                    <p className="text-xs text-muted-foreground">Folios rechazados en el flujo</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Estados</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-xs">
                    {Object.entries(productivityStats.byStatus).map(([status, count]) => (
                      <div key={status} className="flex justify-between">
                        <span className="capitalize">{status.replace("_", " ")}</span>
                        <span className="font-semibold">{count as number}</span>
                      </div>
                    ))}
                    {Object.keys(productivityStats.byStatus).length === 0 && (
                      <p className="text-muted-foreground">Sin folios en este hospital.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Insumos más utilizados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {productivityStats.topProducts.length > 0 ? (
                    productivityStats.topProducts.map((p) => (
                      <div key={p.name} className="flex justify-between border-b pb-1 last:border-b-0">
                        <span>{p.name}</span>
                        <span className="font-semibold">{p.count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Aún no hay datos suficientes de consumo para este hospital.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="rounded-lg border bg-white p-6 text-center text-sm text-muted-foreground">
            No hay hospitales disponibles para mostrar.
          </div>
        )}
      </main>
    </div>
  )
}
