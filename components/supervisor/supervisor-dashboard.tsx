"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, FileText, CheckCircle2, Clock, ClipboardPlus, Boxes, History } from "lucide-react"

import { SupervisorApprovalList } from "./supervisor-approval-list"
import { CreateFolioDialog } from "@/components/auxiliar/create-folio-dialog"
import { InventoryManagement } from "@/components/almacen/inventory-management"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { User, FolioRequest, Inventory } from "@/lib/types"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Hospital = {
  id: string
  name: string
}

interface SupervisorDashboardProps {
  user: User & { hospital?: any }
  hospitals: Hospital[]
}

type Section = "dashboard" | "folios" | "insumos" | "supervision" | "historial"

export function SupervisorDashboard({ user, hospitals }: SupervisorDashboardProps) {
  const router = useRouter()
  const supabase = createClient()

  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(hospitals[0]?.id ?? null)

  const [activeSection, setActiveSection] = useState<Section>("dashboard")

  const [folios, setFolios] = useState<(FolioRequest & { auxiliar: any; hospital: any; folio_items: any[] })[]>([])
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [loadingFolios, setLoadingFolios] = useState(false)
  const [loadingInventory, setLoadingInventory] = useState(false)
  const [openCreateFolio, setOpenCreateFolio] = useState(false)

  // Tabs de la sección FOLIOS (ya no hay "all/historial" aquí)
  const [foliosTab, setFoliosTab] = useState<"registrarFolio" | "pending" | "approved" | "rejected">("registrarFolio")

  const selectedHospital = hospitals.find((h) => h.id === selectedHospitalId) ?? null

  // MUY IMPORTANTE: mandamos hospital_id para que el CreateFolioDialog cargue cirujanos/anestesiólogos del hospital correcto
  const userWithSelectedHospital = {
    ...user,
    hospital_id: selectedHospital?.id ?? null,
    hospital: selectedHospital ? { id: selectedHospital.id, name: selectedHospital.name } : null,
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const fetchFolios = async (hospitalId: string | null) => {
    if (!hospitalId) {
      setFolios([])
      return
    }

    setLoadingFolios(true)

    const { data, error } = await supabase
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
      .eq("hospital_id", hospitalId)
      .in("status", ["pendiente", "aprobado_lider", "aprobado_supervisor", "entregado", "rechazado"])
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error cargando folios como supervisor:", error)
      setFolios([])
    } else {
      setFolios((data as any) || [])
    }

    setLoadingFolios(false)
  }

  const fetchInventory = async (hospitalId: string | null) => {
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
      console.error("Error cargando inventario para supervisor:", error)
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

  // Agrupaciones por estado
  const pendingFolios = folios.filter((f) => f.status === "pendiente")
  const approvedFolios = folios.filter((f) => ["aprobado_lider", "aprobado_supervisor", "entregado"].includes(f.status))
  const rejectedFolios = folios.filter((f) => f.status === "rechazado")

  const handleRefresh = () => {
    fetchFolios(selectedHospitalId)
    fetchInventory(selectedHospitalId)
  }

  return (
    <div className="min-h-screen bg-slate-900/5">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="hidden w-64 flex-col border-r border-slate-800 bg-slate-950 text-slate-100 md:flex">
          <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/90 text-white text-sm font-bold">
              SA
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sistema Anestesia</span>
              <span className="text-sm font-semibold">Panel Supervisor</span>
            </div>
          </div>

          <div className="px-5 py-4 border-b border-slate-800 text-xs">
            <p className="text-slate-400">Usuario actual</p>
            <p className="font-semibold text-slate-50">{user.full_name}</p>
            {selectedHospital && (
              <p className="mt-1 text-[11px] text-slate-400">
                Hospital: <span className="font-medium">{selectedHospital.name}</span>
              </p>
            )}
          </div>

          <nav className="flex-1 px-3 py-4 text-sm">
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Navegación</p>
            <ul className="space-y-1">
              <li>
                <button
                  type="button"
                  onClick={() => setActiveSection("dashboard")}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs ${
                    activeSection === "dashboard"
                      ? "bg-slate-900 text-slate-100"
                      : "text-slate-300 hover:bg-slate-900/70"
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  <span>Dashboard</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveSection("folios")}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs ${
                    activeSection === "folios" ? "bg-slate-900 text-slate-100" : "text-slate-300 hover:bg-slate-900/70"
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Folios</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveSection("insumos")}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs ${
                    activeSection === "insumos" ? "bg-slate-900 text-slate-100" : "text-slate-300 hover:bg-slate-900/70"
                  }`}
                >
                  <Boxes className="h-4 w-4" />
                  <span>Insumos</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveSection("supervision")}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs ${
                    activeSection === "supervision"
                      ? "bg-slate-900 text-slate-100"
                      : "text-slate-300 hover:bg-slate-900/70"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Supervisión</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveSection("historial")}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs ${
                    activeSection === "historial"
                      ? "bg-slate-900 text-slate-100"
                      : "text-slate-300 hover:bg-slate-900/70"
                  }`}
                >
                  <History className="h-4 w-4" />
                  <span>Historial</span>
                </button>
              </li>
            </ul>
          </nav>

          <div className="border-t border-slate-800 px-5 py-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-slate-700 bg-slate-900 text-xs text-slate-100 hover:bg-slate-800"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex flex-1 flex-col">
          {/* Header superior */}
          <header className="border-b bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {activeSection === "dashboard" && "Dashboard · Supervisor"}
                  {activeSection === "folios" && "Folios · Supervisor"}
                  {activeSection === "insumos" && "Insumos · Supervisor"}
                  {activeSection === "supervision" && "Supervisión · Supervisor"}
                  {activeSection === "historial" && "Historial · Supervisor"}
                </span>
                <h1 className="text-xl font-semibold text-slate-900">
                  Bienvenido, <span className="font-bold">{user.full_name}</span>
                </h1>
                {selectedHospital && (
                  <p className="text-xs text-slate-500">
                    Actualmente trabajando en <span className="font-semibold">{selectedHospital.name}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 md:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-300 text-slate-700 bg-transparent"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </Button>
              </div>
            </div>
          </header>

          <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
            {/* Selector de hospital */}
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">Hospital seleccionado</p>
                  {hospitals.length === 0 && (
                    <p className="text-xs text-red-600">No tienes hospitales asignados. Contacta al administrador.</p>
                  )}
                  {selectedHospital && (
                    <p className="text-xs text-slate-500">
                      Actualmente trabajando en: <span className="font-semibold">{selectedHospital.name}</span>
                    </p>
                  )}
                </div>

                {hospitals.length > 0 && (
                  <Select
                    value={selectedHospitalId ?? undefined}
                    onValueChange={(value) => {
                      setSelectedHospitalId(value)
                      setFoliosTab("registrarFolio")
                    }}
                  >
                    <SelectTrigger className="w-full rounded-lg border-slate-300 bg-slate-50 text-sm md:w-80">
                      <SelectValue placeholder="Selecciona un hospital" />
                    </SelectTrigger>
                    <SelectContent>
                      {hospitals.map((h) => (
                        <SelectItem key={h.id} value={h.id}>
                          {h.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </section>

            {!selectedHospitalId ? (
              <p className="text-sm text-slate-500">
                No tienes un hospital seleccionado. Asigna hospitales al supervisor o selecciona uno del listado.
              </p>
            ) : (
              <>
                {/* DASHBOARD */}
                {activeSection === "dashboard" && (
                  <>
                    <section className="grid gap-4 md:grid-cols-3">
                      <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-xs font-medium text-slate-500">Pendientes</CardTitle>
                          <Clock className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-semibold text-slate-900">{pendingFolios.length}</div>
                          <p className="mt-1 text-[11px] text-slate-500">
                            Folios recién creados o en espera de revisión.
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-xs font-medium text-slate-500">Aprobados</CardTitle>
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-semibold text-slate-900">{approvedFolios.length}</div>
                          <p className="mt-1 text-[11px] text-slate-500">Listos para almacén o entregados.</p>
                        </CardContent>
                      </Card>

                      <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-xs font-medium text-slate-500">Total Folios</CardTitle>
                          <FileText className="h-4 w-4 text-slate-400" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-semibold text-slate-900">{folios.length}</div>
                          <p className="mt-1 text-[11px] text-slate-500">Del hospital seleccionado.</p>
                        </CardContent>
                      </Card>
                    </section>

                    {loadingFolios && <p className="text-sm text-slate-500">Cargando folios...</p>}
                  </>
                )}

                {/* FOLIOS */}
                {activeSection === "folios" && (
                  <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    {loadingFolios && <p className="text-sm text-slate-500">Cargando folios...</p>}

                    <Tabs
                      value={foliosTab}
                      onValueChange={(v) =>
                        setFoliosTab(v as "registrarFolio" | "pending" | "approved" | "rejected")
                      }
                      className="space-y-5"
                    >
                      <TabsList className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
                        <TabsTrigger
                          value="registrarFolio"
                          className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm"
                        >
                          <ClipboardPlus className="mr-2 h-4 w-4" />
                          Registrar Folio
                        </TabsTrigger>

                        <TabsTrigger
                          value="pending"
                          className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm"
                        >
                          Pendientes ({pendingFolios.length})
                        </TabsTrigger>

                        <TabsTrigger
                          value="approved"
                          className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm"
                        >
                          Aprobados ({approvedFolios.length})
                        </TabsTrigger>

                        <TabsTrigger
                          value="rejected"
                          className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm"
                        >
                          Rechazados ({rejectedFolios.length})
                        </TabsTrigger>
                      </TabsList>

                      {/* REGISTRAR FOLIO */}
                      <TabsContent value="registrarFolio" className="space-y-4">
                        <div className="flex justify-end">
                          <Button
                            onClick={() => setOpenCreateFolio(true)}
                            disabled={!selectedHospital}
                            className="bg-indigo-600 text-sm text-white hover:bg-indigo-700"
                          >
                            <ClipboardPlus className="mr-2 h-4 w-4" />
                            Crear Folio en este hospital
                          </Button>
                        </div>

                        <CreateFolioDialog
                          open={openCreateFolio}
                          onOpenChange={setOpenCreateFolio}
                          user={userWithSelectedHospital}
                          inventory={inventory}
                          onSuccess={() => {
                            handleRefresh()
                            setFoliosTab("pending")
                          }}
                        />
                      </TabsContent>

                      {/* PENDIENTES */}
                      <TabsContent value="pending" className="space-y-4">
                        <h2 className="text-base font-semibold text-slate-900">Folios Pendientes</h2>
                        <p className="text-xs text-slate-500">Folios que están en espera de revisión o aprobación.</p>
                        <SupervisorApprovalList folios={pendingFolios} userId={user.id} onUpdate={handleRefresh} />
                      </TabsContent>

                      {/* APROBADOS */}
                      <TabsContent value="approved" className="space-y-4">
                        <h2 className="text-base font-semibold text-slate-900">Folios Aprobados</h2>
                        <SupervisorApprovalList
                          folios={approvedFolios}
                          userId={user.id}
                          onUpdate={handleRefresh}
                          readOnly
                        />
                      </TabsContent>

                      {/* RECHAZADOS */}
                      <TabsContent value="rejected" className="space-y-4">
                        <h2 className="text-base font-semibold text-slate-900">Folios Rechazados / Cancelados</h2>
                        <SupervisorApprovalList
                          folios={rejectedFolios}
                          userId={user.id}
                          onUpdate={handleRefresh}
                          readOnly
                        />
                      </TabsContent>
                    </Tabs>
                  </section>
                )}

          
                {/* INSUMOS */}
                {activeSection === "insumos" && (
                  <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    {loadingInventory ? (
                      <p className="text-sm text-slate-500">Cargando inventario...</p>
                    ) : (
                      <>
                        <div className="mb-2 flex items-center justify-between">
                          <h2 className="text-base font-semibold text-slate-900">Inventario de Insumos</h2>
                          <p className="text-xs text-slate-500">
                            Gestiona el inventario del hospital seleccionado.
                          </p>
                        </div>
                        <InventoryManagement
                          inventory={inventory}
                          hospitalId={selectedHospitalId}
                          onUpdate={handleRefresh}
                        />
                      </>
                    )}
                  </section>
                )}

                {/* SUPERVISIÓN */}
                {activeSection === "supervision" && (
                  <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    {loadingFolios && <p className="text-sm text-slate-500">Cargando folios...</p>}

                    <div className="grid gap-4 md:grid-cols-3">
                      <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-medium text-slate-500">
                            Pendientes del Supervisor
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-semibold text-slate-900">{pendingFolios.length}</div>
                          <p className="mt-1 text-[11px] text-slate-500">Folios por revisar.</p>
                        </CardContent>
                      </Card>
                      <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-medium text-slate-500">Aprobados por Supervisor</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-semibold text-slate-900">{approvedFolios.length}</div>
                          <p className="mt-1 text-[11px] text-slate-500">Enviados a almacén.</p>
                        </CardContent>
                      </Card>
                      <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-medium text-slate-500">Rechazados</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-semibold text-slate-900">{rejectedFolios.length}</div>
                          <p className="mt-1 text-[11px] text-slate-500">Folios rechazados o cancelados.</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-base font-semibold text-slate-900">Folios pendientes de revisión</h2>
                      <SupervisorApprovalList folios={pendingFolios} userId={user.id} onUpdate={handleRefresh} />
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-base font-semibold text-slate-900">Folios aprobados recientemente</h2>
                      <SupervisorApprovalList
                        folios={approvedFolios}
                        userId={user.id}
                        onUpdate={handleRefresh}
                        readOnly
                      />
                    </div>
                  </section>
                )}

                {/* HISTORIAL – similar al historial del auxiliar: solo ver folios aprobados y rechazados */}
                {activeSection === "historial" && (
                  <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    {loadingFolios && <p className="text-sm text-slate-500">Cargando folios...</p>}

                    <div className="grid gap-4 md:grid-cols-3">
                      <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-medium text-slate-500">Folios aprobados</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-semibold text-emerald-600">{approvedFolios.length}</div>
                        </CardContent>
                      </Card>
                      <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-medium text-slate-500">Folios rechazados</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-semibold text-red-500">{rejectedFolios.length}</div>
                        </CardContent>
                      </Card>
                      <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-medium text-slate-500">Total histórico</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-semibold text-slate-900">
                            {approvedFolios.length + rejectedFolios.length}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-base font-semibold text-slate-900">Folios Aprobados</h2>
                      <SupervisorApprovalList
                        folios={approvedFolios}
                        userId={user.id}
                        onUpdate={handleRefresh}
                        readOnly
                      />
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-base font-semibold text-slate-900">Folios Rechazados / Cancelados</h2>
                      <SupervisorApprovalList
                        folios={rejectedFolios}
                        userId={user.id}
                        onUpdate={handleRefresh}
                        readOnly
                      />
                    </div>
                  </section>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
