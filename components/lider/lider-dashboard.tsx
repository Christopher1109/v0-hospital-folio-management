// ===============================================
// components/lider/lider-dashboard.tsx
// ===============================================

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LogOut,
  FileText,
  CheckCircle2,
  Clock,
  ClipboardPlus,
  Boxes,
} from "lucide-react"
import { FolioApprovalList } from "./folio-approval-list"
import { CreateFolioDialog } from "@/components/auxiliar/create-folio-dialog"
import { InventoryManagement } from "@/components/almacen/inventory-management"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { User, FolioRequest, Inventory } from "@/lib/types"
import { RoleShell } from "@/components/layout/role-shell"

interface LiderDashboardProps {
  user: User & { hospital: any }
  folios: (FolioRequest & { auxiliar: any; hospital: any; folio_items: any[] })[]
  inventory: Inventory[]
}

type LiderSection = "dashboard" | "folios" | "historial" | "insumos"

export function LiderDashboard({
  user,
  folios,
  inventory,
}: LiderDashboardProps) {
  const router = useRouter()
  const [openCreateFolio, setOpenCreateFolio] = useState(false)
  const [activeSection, setActiveSection] =
    useState<LiderSection>("dashboard")

  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const pendingFolios = folios.filter((f) => f.status === "pendiente")
  const approvedFolios = folios.filter(
    (f) => f.status !== "pendiente" && f.status !== "rechazado",
  )
  const rejectedFolios = folios.filter((f) => f.status === "rechazado")

  const hospitals =
    user.hospital && user.hospital_id
      ? [
          {
            id: user.hospital_id as string,
            name: (user.hospital as any)?.name as string,
          },
        ]
      : []

  const navItems = [
    {
      id: "dashboard" as LiderSection,
      label: "Dashboard",
      icon: <Clock className="h-4 w-4" />,
    },
    {
      id: "folios" as LiderSection,
      label: "Folios",
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: "historial" as LiderSection,
      label: "Historial",
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: "insumos" as LiderSection,
      label: "Insumos",
      icon: <Boxes className="h-4 w-4" />,
    },
  ]

  return (
    <RoleShell
      user={user}
      roleLabel="Líder"
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
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pendientes de Aprobación
                </CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pendingFolios.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requieren tu revisión
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Aprobados
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {approvedFolios.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Folios aprobados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Folios
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{folios.length}</div>
                <p className="text-xs text-muted-foreground">
                  De tu hospital
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
            {rejectedFolios.length > 0 ? (
              <p>
                Tienes{" "}
                <span className="font-semibold">
                  {rejectedFolios.length}
                </span>{" "}
                folios rechazados en el histórico. Revisa las razones
                para evitar recurrencias.
              </p>
            ) : (
              <p>No hay folios rechazados actualmente.</p>
            )}
          </div>
        </section>
      )}

      {/* FOLIOS */}
      {activeSection === "folios" && (
        <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <Tabs defaultValue="registrarFolio" className="space-y-6">
            <TabsList className="flex flex-wrap gap-2">
              <TabsTrigger value="registrarFolio">
                <ClipboardPlus className="mr-2 h-4 w-4" />
                Registrar Folio
              </TabsTrigger>

              <TabsTrigger value="pending">
                Pendientes ({pendingFolios.length})
              </TabsTrigger>

              <TabsTrigger value="approved">
                Aprobados ({approvedFolios.length})
              </TabsTrigger>

              <TabsTrigger value="rejected">
                Rechazados ({rejectedFolios.length})
              </TabsTrigger>

              <TabsTrigger value="all">
                Todos ({folios.length})
              </TabsTrigger>
            </TabsList>

            {/* REGISTRAR FOLIO */}
            <TabsContent value="registrarFolio" className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => setOpenCreateFolio(true)}>
                  <ClipboardPlus className="mr-2 h-4 w-4" />
                  Crear Folio
                </Button>
              </div>

              <CreateFolioDialog
                open={openCreateFolio}
                onOpenChange={setOpenCreateFolio}
                user={user}
                inventory={inventory}
                onSuccess={() => router.refresh()}
              />
            </TabsContent>

            {/* PENDIENTES */}
            <TabsContent value="pending" className="space-y-4">
              <h2 className="text-xl font-semibold">Folios Pendientes</h2>
              <FolioApprovalList
                folios={pendingFolios}
                userId={user.id}
                onUpdate={() => router.refresh()}
              />
            </TabsContent>

            {/* APROBADOS */}
            <TabsContent value="approved" className="space-y-4">
              <h2 className="text-xl font-semibold">Folios Aprobados</h2>
              <FolioApprovalList
                folios={approvedFolios}
                userId={user.id}
                onUpdate={() => router.refresh()}
                readOnly
              />
            </TabsContent>

            {/* RECHAZADOS */}
            <TabsContent value="rejected" className="space-y-4">
              <h2 className="text-xl font-semibold">Folios Rechazados</h2>
              <FolioApprovalList
                folios={rejectedFolios}
                userId={user.id}
                onUpdate={() => router.refresh()}
                readOnly
              />
            </TabsContent>

            {/* TODOS */}
            <TabsContent value="all" className="space-y-4">
              <h2 className="text-xl font-semibold">Todos los Folios</h2>
              <FolioApprovalList
                folios={folios}
                userId={user.id}
                onUpdate={() => router.refresh()}
                readOnly
              />
            </TabsContent>
          </Tabs>
        </section>
      )}

      {/* HISTORIAL (solo vista) */}
      {activeSection === "historial" && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xl font-semibold">Historial de folios</h2>
          <p className="text-xs text-slate-500 mb-2">
            Vista histórica de todos los folios del hospital (aprobados y
            rechazados).
          </p>

          <FolioApprovalList
            folios={folios}
            userId={user.id}
            onUpdate={() => router.refresh()}
            readOnly
          />
        </section>
      )}

      {/* INSUMOS */}
      {activeSection === "insumos" && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xl font-semibold">Gestión de Insumos</h2>
          <p className="text-sm text-muted-foreground">
            Ajusta mínimos, máximos y stock de los insumos del hospital.
          </p>
          <InventoryManagement
            inventory={inventory}
            hospitalId={user.hospital_id ?? null}
            onUpdate={() => router.refresh()}
          />
        </section>
      )}
    </RoleShell>
  )
}
