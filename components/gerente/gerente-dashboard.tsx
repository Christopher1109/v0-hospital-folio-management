"use client"

/*
 * Custom dashboard for the Gerente de Operaciones (operations manager).
 *
 * This component reuses many of the existing building blocks from the
 * supervisor and almacen dashboards, but it wraps them in a persistent
 * sidebar similar to the supervisor UI.  The gerente can switch
 * between high‑level sections from the sidebar: a per‑hospital
 * dashboard, folio management, per‑hospital inventory, a global
 * inventory view, a summary view across all hospitals and a folio
 * history.  Inside the folios section the gerente can review
 * outstanding requests, approved requests, all requests and create
 * new folios or adjust inventory.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Boxes,
  BarChart2,
  History as HistoryIcon,
  LogOut,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CreateFolioDialog } from "@/components/auxiliar/create-folio-dialog";
import { InventoryManagement } from "@/components/almacen/inventory-management";
import { SupervisorApprovalList } from "@/components/supervisor/supervisor-approval-list";
import { GlobalInventoryView } from "@/components/gerente/global-inventory-view";
import { GlobalFoliosList } from "@/components/gerente/global-folios-list";
import { HospitalStats } from "@/components/gerente/hospital-stats";
import { createClient } from "@/lib/supabase/client";
import type { User, FolioRequest, Inventory } from "@/lib/types";

// Data structures for props.  The gerente receives all hospitals, all
// folios across hospitals, and the full inventory across hospitals.
interface GerenteDashboardProps {
  user: User & { hospital?: any };
  hospitals: { id: string; name: string }[];
  folios: (FolioRequest & {
    auxiliar: any;
    hospital: any;
    folio_items: any[];
  })[];
  inventory: Inventory[];
}

export function GerenteDashboard({
  user,
  hospitals,
  folios,
  inventory,
}: GerenteDashboardProps) {
  const router = useRouter();
  const supabase = createClient();

  // Currently selected hospital.  The gerente can switch between
  // hospitals using the selector in the sidebar or header.  Default
  // to the first hospital if any exist.
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(
    hospitals.length > 0 ? hospitals[0].id : null,
  );

  // Top‑level section active in the sidebar.  This determines
  // which panel is shown on the right side.
  const [activeSection, setActiveSection] = useState<string>("dashboard");

  // Tabs inside the folios section.  These control the view of
  // pending, approved, all folios and creation actions.
  const [foliosTab, setFoliosTab] = useState<
    "pending" | "approved" | "all" | "productivity" | "createFolio" | "registerInventory"
  >("pending");

  // Perform sign out via Supabase auth then navigate to login.
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  // Helper to derive the selected hospital object for display.
  const selectedHospital = useMemo(() => {
    return hospitals.find((h) => h.id === selectedHospitalId) ?? null;
  }, [hospitals, selectedHospitalId]);

  // Filter folios by the selected hospital for per‑hospital views.
  const filteredFolios = useMemo(() => {
    if (!selectedHospitalId) return [];
    return folios.filter((f) => f.hospital_id === selectedHospitalId);
  }, [folios, selectedHospitalId]);

  // Partition per‑hospital folios by status.
  const pendingFolios = filteredFolios.filter(
    (f) => f.status === "pendiente" || f.status === "aprobado_lider",
  );
  const approvedFolios = filteredFolios.filter(
    (f) => f.status === "aprobado_supervisor" || f.status === "entregado",
  );
  const rejectedFolios = filteredFolios.filter((f) => f.status === "rechazado");

  // Filter inventory by the selected hospital for adjustments.
  const filteredInventory = useMemo(() => {
    if (!selectedHospitalId) return [];
    return inventory.filter((inv) => inv.hospital_id === selectedHospitalId);
  }, [inventory, selectedHospitalId]);

  // Productivity stats summarise statuses and top products for the
  // selected hospital.  This is displayed in the productivity tab.
  const productivityStats = useMemo(() => {
    const total = filteredFolios.length;
    const byStatus: Record<string, number> = {};
    filteredFolios.forEach((f) => {
      byStatus[f.status] = (byStatus[f.status] || 0) + 1;
    });
    const productUsage: Record<string, { name: string; count: number }> = {};
    filteredFolios.forEach((f) => {
      f.folio_items?.forEach((fi: any) => {
        const key = fi.product_id;
        const name = fi.product?.name || "Producto sin nombre";
        if (!productUsage[key]) {
          productUsage[key] = { name, count: 0 };
        }
        productUsage[key].count += fi.quantity_requested ?? 0;
      });
    });
    const topProducts = Object.values(productUsage)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    return { total, byStatus, topProducts };
  }, [filteredFolios]);

  // Identify low‑stock items across all hospitals.  These are items
  // where the quantity is less than or equal to the minimum stock.
  const lowStockGlobal = useMemo(() => {
    return inventory.filter(
      (inv) => inv.quantity <= (inv.product?.min_stock || 0),
    );
  }, [inventory]);

  // Acting user clones the current user but overrides hospital_id to
  // ensure child components operate in the context of the selected
  // hospital.  If no hospital is selected the user is left unchanged.
  const actingUser = useMemo(() => {
    return selectedHospitalId ? { ...user, hospital_id: selectedHospitalId } : user;
  }, [user, selectedHospitalId]);

  // Define sidebar navigation items.  Each item has an id, label and
  // icon from lucide-react.  Icons are rendered at a consistent size.
  const navItems: { id: string; label: string; icon: JSX.Element }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />, // summary metrics
    },
    {
      id: "folios",
      label: "Folios",
      icon: <ClipboardList className="h-4 w-4" />, // manage folios
    },
    {
      id: "inventario",
      label: "Inventario",
      icon: <Boxes className="h-4 w-4" />, // per‑hospital inventory management
    },
    {
      id: "global-inventory",
      label: "Insumos Globales",
      icon: <Boxes className="h-4 w-4" />, // global inventory and alerts
    },
    {
      id: "resumen",
      label: "Resumen Hospitales",
      icon: <BarChart2 className="h-4 w-4" />, // summary across hospitals
    },
    {
      id: "historial",
      label: "Historial",
      icon: <HistoryIcon className="h-4 w-4" />, // list all folios across hospitals
    },
  ];

  return (
    <div className="flex h-full min-h-screen">
      {/* Sidebar navigation */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-900 text-slate-200">
        {/* Logo and title */}
        <div className="px-4 py-6 border-b border-slate-700">
          <div className="text-lg font-bold leading-tight">SA</div>
          <div className="text-xs text-slate-400">Sistema Anestesia</div>
          <div className="text-xs mt-2">Panel Gerente</div>
        </div>
        {/* User info */}
        <div className="px-4 py-4 border-b border-slate-700">
          <div className="text-xs uppercase text-slate-500 mb-1">Usuario actual</div>
          <div className="text-sm font-medium">{user.full_name ?? "Usuario"}</div>
          {selectedHospital && (
            <div className="text-xs text-slate-400 mt-1">
              Hospital: {selectedHospital.name}
            </div>
          )}
        </div>
        {/* Navigation links */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          <div className="text-xs uppercase text-slate-500 px-2 mb-2">
            Navegación
          </div>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                activeSection === item.id
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        {/* Mobile hospital selector for small screens hidden on large */}
        <div className="px-4 py-4 border-t border-slate-700 md:hidden">
          {hospitals.length > 0 && (
            <Select
              value={selectedHospitalId ?? ""}
              onValueChange={(value) => setSelectedHospitalId(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona hospital" />
              </SelectTrigger>
              <SelectContent>
                {hospitals.map((hospital) => (
                  <SelectItem key={hospital.id} value={hospital.id}>
                    {hospital.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {/* Sign out button */}
        <div className="px-4 py-4 border-t border-slate-700">
          <Button
            variant="outline"
            className="w-full justify-center gap-2"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 bg-white dark:bg-slate-950 p-4 md:ml-64">
        {/* Header with hospital selector (desktop) */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {(() => {
                switch (activeSection) {
                  case "dashboard":
                    return "Dashboard · Gerente";
                  case "folios":
                    return "Folios · Gerente";
                  case "inventario":
                    return "Inventario · Gerente";
                  case "global-inventory":
                    return "Insumos Globales";
                  case "resumen":
                    return "Resumen Hospitales";
                  case "historial":
                    return "Historial de Folios";
                  default:
                    return "Panel Gerente";
                }
              })()}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Bienvenido, {user.full_name ?? "Usuario"}
            </p>
            {selectedHospital && activeSection !== "global-inventory" && activeSection !== "resumen" && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Actualmente trabajando en: {selectedHospital.name}
              </p>
            )}
          </div>
          {hospitals.length > 0 && (
            <div className="hidden md:block">
              <Select
                value={selectedHospitalId ?? ""}
                onValueChange={(value) => setSelectedHospitalId(value)}
              >
                <SelectTrigger className="w-60">
                  <SelectValue placeholder="Selecciona hospital" />
                </SelectTrigger>
                <SelectContent>
                  {hospitals.map((hospital) => (
                    <SelectItem key={hospital.id} value={hospital.id}>
                      {hospital.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Section: Dashboard metrics (per hospital) */}
        {activeSection === "dashboard" && (
          <div className="space-y-4">
            {/* Cards summarising folios and alerts for the selected hospital */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pendientes / En revisión</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{pendingFolios.length}</p>
                  <p className="text-sm text-muted-foreground">
                    Folios en flujo de aprobación
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Aprobados / Entregados</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{approvedFolios.length}</p>
                  <p className="text-sm text-muted-foreground">
                    Folios que ya pasaron por almacén
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Total Folios</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{filteredFolios.length}</p>
                  <p className="text-sm text-muted-foreground">
                    Histórico del hospital seleccionado
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Alertas de Insumos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{lowStockGlobal.length}</p>
                  <p className="text-sm text-muted-foreground">
                    Productos con stock bajo en todos los hospitales
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Section: Folios management */}
        {activeSection === "folios" && (
          <div className="space-y-4">
            <Tabs value={foliosTab} onValueChange={setFoliosTab} className="space-y-4">
              <TabsList className="flex flex-wrap gap-2">
                <TabsTrigger value="pending">Pendientes ({pendingFolios.length})</TabsTrigger>
                <TabsTrigger value="approved">Aprobados ({approvedFolios.length})</TabsTrigger>
                <TabsTrigger value="all">Todos ({filteredFolios.length})</TabsTrigger>
                <TabsTrigger value="productivity">Productividad</TabsTrigger>
                <TabsTrigger value="createFolio">Crear folio</TabsTrigger>
                <TabsTrigger value="registerInventory">Registrar insumo</TabsTrigger>
              </TabsList>
              {/* Pending */}
              <TabsContent value="pending">
                <SupervisorApprovalList
                  folios={pendingFolios}
                  user={actingUser}
                  onActionComplete={() => router.refresh()}
                />
              </TabsContent>
              {/* Approved */}
              <TabsContent value="approved">
                <SupervisorApprovalList
                  folios={approvedFolios}
                  user={actingUser}
                  onActionComplete={() => router.refresh()}
                />
              </TabsContent>
              {/* All */}
              <TabsContent value="all">
                <SupervisorApprovalList
                  folios={filteredFolios}
                  user={actingUser}
                  readOnly
                  onActionComplete={() => router.refresh()}
                />
              </TabsContent>
              {/* Productivity */}
              <TabsContent value="productivity">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Total de folios</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold">{productivityStats.total}</p>
                      <p className="text-sm text-muted-foreground">
                        Folios totales del hospital seleccionado
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Rechazados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold">{rejectedFolios.length}</p>
                      <p className="text-sm text-muted-foreground">
                        Folios rechazados en el flujo
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Estados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {Object.entries(productivityStats.byStatus).map(([status, count]) => (
                        <div key={status} className="flex justify-between py-1">
                          <span className="capitalize">{status.replace(/_/g, " ")}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                      {Object.keys(productivityStats.byStatus).length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          Sin folios en este hospital.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Insumos más utilizados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {productivityStats.topProducts.length > 0 ? (
                        <ul className="space-y-1">
                          {productivityStats.topProducts.map((p) => (
                            <li key={p.name} className="flex justify-between">
                              <span>{p.name}</span>
                              <span className="font-medium">{p.count}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Aún no hay datos suficientes de consumo para este hospital.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              {/* Create folio */}
              <TabsContent value="createFolio">
                <div className="p-4 space-y-4">
                  <h2 className="text-lg font-semibold">Registrar Folio</h2>
                  <p className="text-sm text-muted-foreground">
                    Crea folios como si fueras cualquier usuario operativo del hospital seleccionado.
                  </p>
                  <Button onClick={() => setOpenCreateFolio(true)}>Crear folio</Button>
                  <CreateFolioDialog
                    open={openCreateFolio}
                    onOpenChange={setOpenCreateFolio}
                    actingUser={actingUser}
                    onCreated={() => router.refresh()}
                  />
                </div>
              </TabsContent>
              {/* Register inventory adjustments */}
              <TabsContent value="registerInventory">
                <div className="p-4 space-y-4">
                  <h2 className="text-lg font-semibold">Registrar Insumo</h2>
                  <p className="text-sm text-muted-foreground">
                    Ajusta existencias, entradas y salidas del almacén del hospital seleccionado.
                  </p>
                  <InventoryManagement
                    user={actingUser}
                    inventory={filteredInventory}
                    onUpdated={() => router.refresh()}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Section: Per-hospital inventory management outside folios tab */}
        {activeSection === "inventario" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Inventario del hospital</h2>
            <InventoryManagement
              user={actingUser}
              inventory={filteredInventory}
              onUpdated={() => router.refresh()}
            />
          </div>
        )}

        {/* Section: Global inventory with alerts */}
        {activeSection === "global-inventory" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Inventario Global y Alertas</h2>
            <GlobalInventoryView inventory={inventory} />
          </div>
        )}

        {/* Section: Summary across hospitals */}
        {activeSection === "resumen" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Resumen por Hospital</h2>
            <HospitalStats
              hospitals={hospitals}
              folios={folios}
              inventory={inventory}
            />
          </div>
        )}

        {/* Section: Global folios history */}
        {activeSection === "historial" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Folios de todos los hospitales</h2>
            <GlobalFoliosList folios={folios} />
          </div>
        )}
      </main>
    </div>
  );
}
