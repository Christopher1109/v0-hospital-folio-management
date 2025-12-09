"use client"

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
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
import { createClient } from "@/lib/supabase/client";
import { CreateFolioDialog } from "@/components/auxiliar/create-folio-dialog";
import { InventoryManagement } from "@/components/almacen/inventory-management";
import { SupervisorApprovalList } from "@/components/supervisor/supervisor-approval-list";
import { GlobalInventoryView } from "@/components/gerente/global-inventory-view";
import type { User, FolioRequest, Inventory } from "@/lib/types";

// Props para el dashboard del gerente de operaciones
interface GerenteDashboardProps {
  user: User & { hospital?: any };
  hospitals: any[];
  folios: (FolioRequest & {
    auxiliar: any;
    hospital: any;
    folio_items: any[];
  })[];
  inventory: Inventory[];
}

/**
 * Panel del Gerente de Operaciones.
 * - Ve folios por hospital (como supervisor, pero a nivel gerencial)
 * - Puede crear folios como si fuera un usuario operativo del hospital seleccionado
 * - Puede ajustar inventario del hospital seleccionado
 * - Tiene una vista global de inventario con alertas de stock bajo
 */
export function GerenteDashboard({
  user,
  hospitals,
  folios,
  inventory,
}: GerenteDashboardProps) {
  const router = useRouter();
  const [openCreateFolio, setOpenCreateFolio] = useState(false);

  // Hospital seleccionado (por defecto el primero)
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(
    hospitals.length > 0 ? hospitals[0].id : null,
  );

  // Pestaña activa del dashboard
  const [activeTab, setActiveTab] = useState<string>("pending");

  // Cerrar sesión
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  // Hospital actualmente seleccionado
  const selectedHospital = useMemo(() => {
    return hospitals.find((h) => h.id === selectedHospitalId) || null;
  }, [hospitals, selectedHospitalId]);

  // Folios del hospital seleccionado
  const filteredFolios = useMemo(() => {
    if (!selectedHospitalId) return [];
    return folios.filter((f) => f.hospital_id === selectedHospitalId);
  }, [folios, selectedHospitalId]);

  // Folios por estatus
  const pendingFolios = filteredFolios.filter(
    (f) => f.status === "pendiente" || f.status === "aprobado_lider",
  );
  const approvedFolios = filteredFolios.filter(
    (f) => f.status === "aprobado_supervisor" || f.status === "entregado",
  );
  const rejectedFolios = filteredFolios.filter((f) => f.status === "rechazado");

  // Inventario del hospital seleccionado
  const filteredInventory = useMemo(() => {
    if (!selectedHospitalId) return [];
    return inventory.filter((inv) => inv.hospital_id === selectedHospitalId);
  }, [inventory, selectedHospitalId]);

  // Métricas de productividad del hospital seleccionado
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

  // Inventario con stock bajo en TODOS los hospitales
  const lowStockGlobal = useMemo(() => {
    return inventory.filter(
      (inv) => inv.quantity <= (inv.product?.min_stock || 0),
    );
  }, [inventory]);

  // Usuario “actuando” en el hospital seleccionado (para pasar a hijos)
  const actingUser = useMemo(() => {
    return selectedHospitalId ? { ...user, hospital_id: selectedHospitalId } : user;
  }, [user, selectedHospitalId]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Panel de Gerente de Operaciones</h1>
          <p className="text-sm text-muted-foreground">{user.full_name}</p>
          {selectedHospital && (
            <p className="text-sm text-muted-foreground">
              Hospital seleccionado: {selectedHospital.name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hospitals.length > 0 && (
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
          )}
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
          </Button>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Pendientes / En revisión</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingFolios.length}</p>
            <p className="text-sm text-muted-foreground">
              Folios aún en flujo de aprobación
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
            <CardTitle>Total Folios del Hospital</CardTitle>
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap gap-2">
          <TabsTrigger value="pending">
            Pendientes ({pendingFolios.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Aprobados ({approvedFolios.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            Todos ({filteredFolios.length})
          </TabsTrigger>
          <TabsTrigger value="productivity">Productividad</TabsTrigger>
          <TabsTrigger value="register-folio">Registrar Folio</TabsTrigger>
          <TabsTrigger value="register-inventory">Registrar Insumo</TabsTrigger>
          <TabsTrigger value="global-inventory">
            Insumos Globales ({lowStockGlobal.length})
          </TabsTrigger>
        </TabsList>

        {/* Pendientes */}
        <TabsContent value="pending">
          <SupervisorApprovalList
            folios={pendingFolios}
            user={actingUser}
            onActionComplete={() => router.refresh()}
          />
        </TabsContent>

        {/* Aprobados */}
        <TabsContent value="approved">
          <SupervisorApprovalList
            folios={approvedFolios}
            user={actingUser}
            onActionComplete={() => router.refresh()}
          />
        </TabsContent>

        {/* Todos */}
        <TabsContent value="all">
          <SupervisorApprovalList
            folios={filteredFolios}
            user={actingUser}
            readOnly
            onActionComplete={() => router.refresh()}
          />
        </TabsContent>

        {/* Productividad */}
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
                    <span className="capitalize">{status.replace("_", " ")}</span>
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

        {/* Registrar folio */}
        <TabsContent value="register-folio">
          <div className="p-4 space-y-4">
            <h2 className="text-lg font-semibold">Registrar Folio</h2>
            <p className="text-sm text-muted-foreground">
              Crea folios como si fueras cualquier usuario operativo del hospital seleccionado.
            </p>
            <Button onClick={() => setOpenCreateFolio(true)}>Crear Folio</Button>
            <CreateFolioDialog
              open={openCreateFolio}
              onOpenChange={setOpenCreateFolio}
              actingUser={actingUser}
              onCreated={() => {
                router.refresh();
              }}
            />
          </div>
        </TabsContent>

        {/* Registrar inventario */}
        <TabsContent value="register-inventory">
          <div className="p-4 space-y-4">
            <h2 className="text-lg font-semibold">Registrar Insumo en Almacén</h2>
            <p className="text-sm text-muted-foreground">
              Ajusta existencias, entradas y salidas del almacén del hospital seleccionado.
            </p>
            <InventoryManagement
              user={actingUser}
              inventory={filteredInventory}
              onUpdated={() => {
                router.refresh();
              }}
            />
          </div>
        </TabsContent>

        {/* Inventario global */}
        <TabsContent value="global-inventory">
          <div className="p-4 space-y-4">
            <h2 className="text-lg font-semibold">Inventario Global y Alertas</h2>
            <GlobalInventoryView inventory={inventory} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
