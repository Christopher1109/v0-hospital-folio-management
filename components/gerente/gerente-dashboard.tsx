"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { SupervisorApprovalList } from "@/components/supervisor/supervisor-approval-list"
import { GlobalInventoryView } from "@/components/gerente/global-inventory-view"
import { InventoryManagement } from "@/components/almacen/inventory-management"
import { CreateFolioDialog } from "@/components/auxiliar/create-folio-dialog"

type AnyFolio = any
type AnyHospital = any
type AnyInventory = any

interface GerenteDashboardProps {
  // Mantengo tipos flexibles para que no truene con tu page.tsx actual
  user?: any
  hospitals?: AnyHospital[]
  folios?: AnyFolio[]
  inventory?: AnyInventory[]
}

/**
 * Dashboard del Gerente de Operaciones
 * - Mismas vistas base que el supervisor (pendientes, aprobados, total)
 * - + vistas extra: folios globales, inventario global, resumen por hospital
 */
export function GerenteDashboard(props: GerenteDashboardProps) {
  const router = useRouter()

  const user = props.user ?? {}
  const hospitals = Array.isArray(props.hospitals) ? props.hospitals : []
  const folios: AnyFolio[] = Array.isArray(props.folios) ? props.folios : []
  const inventory: AnyInventory[] = Array.isArray(props.inventory) ? props.inventory : []

  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(
    hospitals.length > 0 && hospitals[0]?.id ? hospitals[0].id : null,
  )

  const [openCreateFolio, setOpenCreateFolio] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("hospital-folios")

  const handleSignOut = async () => {
    // si ya tienes lógica de logout en otra parte, puedes ajustar esto
    router.push("/auth/login")
  }

  const selectedHospital = useMemo(
    () => hospitals.find((h: any) => h?.id === selectedHospitalId) ?? null,
    [hospitals, selectedHospitalId],
  )

  /** Folios filtrados por hospital seleccionado (igual que supervisor) */
  const hospitalFolios = useMemo(() => {
    if (!selectedHospitalId) return []
    return folios.filter((f: any) => f?.hospital_id === selectedHospitalId)
  }, [folios, selectedHospitalId])

  const pendingHospitalFolios = hospitalFolios.filter(
    (f: any) => f?.status === "pendiente" || f?.status === "aprobado_lider",
  )
  const approvedHospitalFolios = hospitalFolios.filter(
    (f: any) => f?.status === "aprobado_supervisor" || f?.status === "entregado",
  )

  /** Inventario filtrado por hospital seleccionado */
  const hospitalInventory = useMemo(() => {
    if (!selectedHospitalId) return []
    return inventory.filter((inv: any) => inv?.hospital_id === selectedHospitalId)
  }, [inventory, selectedHospitalId])

  /** Stock bajo global (todos los hospitales) */
  const lowStockGlobal = useMemo(
    () =>
      inventory.filter(
        (inv: any) =>
          inv?.quantity !== null && inv?.quantity !== undefined && inv?.quantity <= (inv?.product?.min_stock ?? 0),
      ),
    [inventory],
  )

  /** Resumen por hospital para la pestaña "Resumen Hospitales" */
  const hospitalsSummary = useMemo(() => {
    return hospitals
      .map((h: any) => {
        if (!h?.id) return null
        const hf = folios.filter((f: any) => f?.hospital_id === h.id)
        const total = hf.length
        const pending = hf.filter((f: any) => f?.status === "pendiente" || f?.status === "aprobado_lider").length
        const approved = hf.filter((f: any) => f?.status === "aprobado_supervisor" || f?.status === "entregado").length
        const rejected = hf.filter((f: any) => f?.status === "rechazado").length

        const hosInventory = inventory.filter((inv: any) => inv?.hospital_id === h.id)
        const inventoryCount = hosInventory.length

        return {
          hospital: h,
          total,
          pending,
          approved,
          rejected,
          inventoryCount,
        }
      })
      .filter(Boolean) // Filtrar elementos null
  }, [hospitals, folios, inventory])

  const actingUser = useMemo(() => ({ ...user, hospital_id: selectedHospitalId }), [user, selectedHospitalId])

  return (
    <div className="flex flex-col h-full">
      {/* Header estilo supervisor */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Dashboard · Gerente</p>
            <h1 className="text-xl font-bold">Bienvenido, {user?.full_name ?? "Usuario"}</h1>
            {selectedHospital && (
              <p className="text-xs text-slate-500">
                Actualmente trabajando en: <span className="font-medium">{selectedHospital.name}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hospitals.length > 0 && (
              <Select value={selectedHospitalId ?? ""} onValueChange={(value) => setSelectedHospitalId(value)}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Selecciona hospital" />
                </SelectTrigger>
                <SelectContent>
                  {hospitals.map((h: any) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" size="sm" className="gap-1 bg-transparent" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="mx-auto flex-1 w-full max-w-6xl px-4 py-6 space-y-6">
        {/* Tarjetas principales (mismas que supervisor + alertas globales) */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{pendingHospitalFolios.length}</p>
              <p className="text-xs text-slate-500">Folios recién creados o en espera de revisión.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Aprobados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{approvedHospitalFolios.length}</p>
              <p className="text-xs text-slate-500">Listos para almacén o entregados.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Total folios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{hospitalFolios.length}</p>
              <p className="text-xs text-slate-500">Del hospital seleccionado.</p>
            </CardContent>
          </Card>

          {/* Extra para gerente: alertas de insumos globales */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Alertas de insumos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{lowStockGlobal.length}</p>
              <p className="text-xs text-slate-500">Productos con stock bajo en toda la red.</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de vista (para no crear muchas rutas nuevas) */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex flex-wrap gap-2">
            <TabsTrigger value="hospital-folios">Folios del hospital</TabsTrigger>
            <TabsTrigger value="global-folios">Folios globales</TabsTrigger>
            <TabsTrigger value="inventory">Inventario hospital</TabsTrigger>
            <TabsTrigger value="global-inventory">Insumos globales</TabsTrigger>
            <TabsTrigger value="summary">Resumen hospitales</TabsTrigger>
          </TabsList>

          {/* 1. Folios del hospital (igual que supervisor) */}
          <TabsContent value="hospital-folios" className="space-y-4">
            <SupervisorApprovalList folios={hospitalFolios} userId={user?.id ?? ""} onUpdate={() => router.refresh()} />
          </TabsContent>

          {/* 2. Folios globales (solo lectura) */}
          <TabsContent value="global-folios" className="space-y-4">
            <SupervisorApprovalList
              folios={folios}
              userId={user?.id ?? ""}
              readOnly
              onUpdate={() => router.refresh()}
            />
          </TabsContent>

          {/* 3. Inventario del hospital seleccionado */}
          <TabsContent value="inventory" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Inventario · {selectedHospital?.name ?? "Hospital"}</h2>
              <Button size="sm" onClick={() => setOpenCreateFolio(true)}>
                Crear folio rápido
              </Button>
            </div>
            <InventoryManagement user={actingUser} inventory={hospitalInventory} onUpdated={() => router.refresh()} />
          </TabsContent>

          {/* 4. Inventario global */}
          <TabsContent value="global-inventory" className="space-y-4">
            <h2 className="text-base font-semibold">Inventario global y alertas</h2>
            <GlobalInventoryView inventory={inventory} />
          </TabsContent>

          {/* 5. Resumen por hospital */}
          <TabsContent value="summary" className="space-y-4">
            <h2 className="text-base font-semibold">Resumen por hospital</h2>
            <p className="text-xs text-slate-500">Métricas clave de cada hospital en la red.</p>
            <div className="grid gap-4 md:grid-cols-2">
              {hospitalsSummary.map((item) => {
                if (!item?.hospital?.id) return null
                return (
                  <Card key={item.hospital.id} className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">{item.hospital.name}</CardTitle>
                      {item.hospital.location && <p className="text-[11px] text-slate-500">{item.hospital.location}</p>}
                    </CardHeader>
                    <CardContent className="space-y-1 text-xs text-slate-600">
                      <p>
                        Folios totales: <span className="font-semibold">{item.total}</span>
                      </p>
                      <p>
                        En proceso: <span className="font-semibold">{item.pending}</span>
                      </p>
                      <p>
                        Entregados / aprobados: <span className="font-semibold">{item.approved}</span>
                      </p>
                      <p>
                        Rechazados: <span className="font-semibold">{item.rejected}</span>
                      </p>
                      <p>
                        Inventario: <span className="font-semibold">{item.inventoryCount} productos</span>
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog para crear folio rápido desde el gerente */}
      <CreateFolioDialog
        open={openCreateFolio}
        onOpenChange={setOpenCreateFolio}
        actingUser={actingUser}
        onCreated={() => router.refresh()}
      />
    </div>
  )
}
