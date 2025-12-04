"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ClipboardPlus, FileText, Clock, Boxes } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { createClient } from "@/lib/supabase/client"
import type { User, FolioRequest, Inventory } from "@/lib/types"

import { RoleShell } from "@/components/layout/role-shell"
import type { Hospital } from "@/components/layout/role-shell"

import { CreateFolioDialog } from "@/components/auxiliar/create-folio-dialog"
import { FolioApprovalList } from "@/components/lider/folio-approval-list"

interface AuxiliarDashboardProps {
  user: User & { hospital?: any }
  hospitals: Hospital[]
}

type AuxiliarSection = "dashboard" | "folios" | "historial" | "inventario"

export function AuxiliarDashboard({ user, hospitals = [] }: AuxiliarDashboardProps) {
  const router = useRouter()
  const supabase = createClient()

  // Hospitales que se mostrarán: si no vienen por props, usamos el hospital del usuario
  const displayHospitals: Hospital[] = useMemo(() => {
    if (hospitals && hospitals.length > 0) return hospitals
    if ((user as any).hospital) {
      return [
        {
          id: (user as any).hospital.id,
          name: (user as any).hospital.name,
        },
      ]
    }
    return []
  }, [hospitals, user])

  // Id del hospital seleccionado (por defecto el del usuario)
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(() => {
    if ((user as any).hospital_id) return (user as any).hospital_id
    if ((user as any).hospital?.id) return (user as any).hospital.id
    if (displayHospitals[0]?.id) return displayHospitals[0].id
    return null
  })

  const [activeSection, setActiveSection] = useState<AuxiliarSection>("dashboard")

  const [folios, setFolios] = useState<
    (FolioRequest & { auxiliar: any; hospital: any; folio_items: any[] })[]
  >([])
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [loadingFolios, setLoadingFolios] = useState(false)
  const [loadingInventory, setLoadingInventory] = useState(false)
  const [openCreateFolio, setOpenCreateFolio] = useState(false)

  const selectedHospital =
    displayHospitals.find((h) => h.id === selectedHospitalId) ??
    ((user as any).hospital
      ? { id: (user as any).hospital.id, name: (user as any).hospital.name }
      : null)

  const userWithSelectedHospital = {
    ...user,
    hospital: selectedHospital
      ? { id: selectedHospital.id, name: selectedHospital.name }
      : user.hospital ?? null,
    hospital_id:
      selectedHospitalId ??
      (user as any).hospital_id ??
      (user as any).hospital?.id ??
      null,
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  // --------- CARGA DE FOLIOS ---------

  const fetchFolios = async (hospitalIdOverride?: string | null) => {
    const hospitalId = hospitalIdOverride ?? selectedHospitalId

    setLoadingFolios(true)

    let query = supabase
      .from("folio_requests")
      .select(
        `
        *,
        auxiliar:users!folio_requests_auxiliar_id_fkey(full_name, email),
        hospital:hospitals(*),
        folio_items:folio_items(
          *,
          product:products(*)
        )
      `,
      )
      .eq("auxiliar_id", user.id)
      .order("created_at", { ascending: false })

    if (hospitalId) {
      query = query.eq("hospital_id", hospitalId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error cargando folios del auxiliar:", error)
      setFolios([])
    } else {
      setFolios((data as any) || [])
    }

    setLoadingFolios(false)
  }

  // --------- CARGA DE INVENTARIO (se usa para crear folio y para vista de almacén) ---------

  const fetchInventory = async (hospitalIdOverride?: string | null) => {
    const hospitalId = hospitalIdOverride ?? selectedHospitalId
    if (!hospitalId) {
      setInventory([])
      return
    }

    setLoadingInventory(true)

    const { data, error } = await supabase
      .from("inventory")
      .select(
        `
        *,
        product:products(*)
      `,
      )
      .eq("hospital_id", hospitalId)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error cargando inventario para auxiliar:", error)
      setInventory([])
    } else {
      setInventory((data as any) || [])
    }

    setLoadingInventory(false)
  }

  useEffect(() => {
    fetchFolios(selectedHospitalId)
    fetchInventory(selectedHospitalId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHospitalId])

  // si entra a la sección de inventario y no hay datos aún, recarga
  useEffect(() => {
    if (activeSection === "inventario" && inventory.length === 0 && !loadingInventory) {
      fetchInventory(selectedHospitalId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection])

  const handleRefresh = () => {
    fetchFolios(selectedHospitalId)
    fetchInventory(selectedHospitalId)
  }

  // --------- DERIVADOS ---------

  const pendingFolios = folios.filter((f) => f.status === "pendiente")
  const approvedFolios = folios.filter(
    (f) => f.status !== "pendiente" && f.status !== "rechazado",
  )
  const rejectedFolios = folios.filter((f) => f.status === "rechazado")

  // --------- NAV LATERAL (agregamos Almacén) ---------

  const navItems = [
    {
      id: "dashboard" as AuxiliarSection,
      label: "Dashboard",
      icon: <Clock className="h-4 w-4" />,
    },
    {
      id: "folios" as AuxiliarSection,
      label: "Folios",
      icon: <ClipboardPlus className="h-4 w-4" />,
    },
    {
      id: "historial" as AuxiliarSection,
      label: "Historial",
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: "inventario" as AuxiliarSection,
      label: "Almacén",
      icon: <Boxes className="h-4 w-4" />,
    },
  ]

  return (
    <RoleShell
      user={user}
      roleLabel="Auxiliar"
      navItems={navItems}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      hospitals={displayHospitals}
      selectedHospitalId={selectedHospitalId}
      // el auxiliar realmente solo tendrá 1 hospital, pero dejamos el handler
      onHospitalChange={(id) => setSelectedHospitalId(id)}
      onSignOut={handleSignOut}
    >
      {/* DASHBOARD */}
      {activeSection === "dashboard" && (
        <section className="space-y-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-800">
                Resumen del día
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3 text-sm">
              <div>
                <p className="text-xs text-slate-500">Folios creados por ti</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {folios.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Pendientes de aprobación</p>
                <p className="text-2xl font-semibold text-amber-600">
                  {pendingFolios.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Rechazados</p>
                <p className="text-2xl font-semibold text-rose-600">
                  {rejectedFolios.length}
                </p>
              </div>
            </CardContent>
          </Card>

          {loadingFolios && (
            <p className="text-xs text-slate-500">Cargando folios...</p>
          )}
        </section>
      )}

      {/* FOLIOS (crear + ver propios folios) */}
      {activeSection === "folios" && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Gestión de folios
              </h2>
              <p className="text-xs text-slate-500">
                Crea nuevos folios y revisa los folios que has generado.
              </p>
            </div>
          </div>

          <Tabs defaultValue="crear" className="space-y-4">
            <TabsList className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
              <TabsTrigger
                value="crear"
                className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm"
              >
                <ClipboardPlus className="mr-2 h-4 w-4" />
                Crear folio
              </TabsTrigger>
              <TabsTrigger
                value="mis-folios"
                className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm"
              >
                Mis folios ({folios.length})
              </TabsTrigger>
              <TabsTrigger
                value="pendientes"
                className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm"
              >
                Pendientes ({pendingFolios.length})
              </TabsTrigger>
            </TabsList>

            {/* Crear folio */}
            <TabsContent value="crear" className="space-y-4">
              <div className="flex justify-end">
                <Button
                  onClick={() => setOpenCreateFolio(true)}
                  className="bg-indigo-600 text-sm text-white hover:bg-indigo-700"
                  disabled={!selectedHospital}
                >
                  <ClipboardPlus className="mr-2 h-4 w-4" />
                  Crear folio
                </Button>
              </div>

              <CreateFolioDialog
                open={openCreateFolio}
                onOpenChange={setOpenCreateFolio}
                user={userWithSelectedHospital}
                inventory={inventory}
                onSuccess={handleRefresh}
              />
            </TabsContent>

            {/* Mis folios */}
            <TabsContent value="mis-folios" className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Todos los folios creados por ti
              </h3>
              <FolioApprovalList
                folios={folios}
                userId={user.id}
                onUpdate={handleRefresh}
                readOnly
              />
            </TabsContent>

            {/* Pendientes */}
            <TabsContent value="pendientes" className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Folios pendientes de aprobación
              </h3>
              <FolioApprovalList
                folios={pendingFolios}
                userId={user.id}
                onUpdate={handleRefresh}
                readOnly
              />
            </TabsContent>
          </Tabs>
        </section>
      )}

      {/* HISTORIAL */}
      {activeSection === "historial" && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {loadingFolios && (
            <p className="text-sm text-slate-500">Cargando folios...</p>
          )}

          <h2 className="text-base font-semibold text-slate-900">
            Historial de folios
          </h2>
          <p className="text-xs text-slate-500 mb-2">
            Vista histórica de todos los folios que has creado.
          </p>

          <FolioApprovalList
            folios={folios}
            userId={user.id}
            onUpdate={handleRefresh}
            readOnly
          />
        </section>
      )}

      {/* ALMACÉN (INVENTARIO SOLO LECTURA) */}
      {activeSection === "inventario" && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            Almacén del hospital
          </h2>
          <p className="text-xs text-slate-500 mb-2">
            Como auxiliar solo puedes visualizar el inventario disponible, no realizar cambios.
          </p>

          {loadingInventory ? (
            <p className="text-sm text-slate-500">Cargando inventario...</p>
          ) : inventory.length === 0 ? (
            <p className="text-sm text-slate-500">
              No hay inventario registrado para este hospital o no tienes hospital asignado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Producto
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Clave
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">
                      Cantidad
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">
                      Mínimo
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">
                      Máximo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="px-3 py-2">
                        {item.product?.name ?? "Sin nombre"}
                      </td>
                      <td className="px-3 py-2">
                        {item.product?.clave ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {item.product?.min_stock ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {item.product?.max_stock ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </RoleShell>
  )
}
