"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import { RoleShell } from "@/components/layout/role-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type AnyUser = any;
type AnyHospital = any;
type AnyFolio = any;
type AnyInventory = any;

interface GerenteDashboardProps {
  user: AnyUser;
  hospitals: AnyHospital[];
  folios: AnyFolio[];
  inventory: AnyInventory[];
}

export function GerenteDashboard({
  user,
  hospitals,
  folios,
  inventory,
}: GerenteDashboardProps) {
  const router = useRouter();
  const supabase = createClient();

  // Hospital seleccionado para crear folios y modificar inventario
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(
    hospitals.length > 0 ? hospitals[0].id : null,
  );

  // Sección activa del dashboard
  const [activeSection, setActiveSection] = useState<
    "dashboard" | "folios" | "inventario" | "alertas"
  >("dashboard");

  // ---- ESTADO: creación de folio ----
  const [newFolioHospitalId, setNewFolioHospitalId] = useState<string | null>(
    hospitals.length > 0 ? hospitals[0].id : null,
  );
  const [newFolioPatientName, setNewFolioPatientName] = useState("");
  const [newFolioSurgeryType, setNewFolioSurgeryType] = useState("");
  const [newFolioUrgency, setNewFolioUrgency] = useState("");

  const [isCreatingFolio, setIsCreatingFolio] = useState(false);

  // ---- ESTADO: actualización de inventario ----
  const [editingInventory, setEditingInventory] = useState<{
    [inventoryId: string]: string;
  }>({});

  const [isUpdatingInventoryId, setIsUpdatingInventoryId] = useState<
    string | null
  >(null);

  // -------- FILTROS BÁSICOS --------

  // Folios del hospital seleccionado (para la sección "Folios")
  const filteredFolios = useMemo(() => {
    if (!selectedHospitalId) return [];
    return folios.filter((f) => f.hospital_id === selectedHospitalId);
  }, [folios, selectedHospitalId]);

  // Inventario del hospital seleccionado (para "Inventario")
  const filteredInventory = useMemo(() => {
    if (!selectedHospitalId) return [];
    return inventory.filter((inv) => inv.hospital_id === selectedHospitalId);
  }, [inventory, selectedHospitalId]);

  // ---- ALERTAS: todos los hospitales, no solo el seleccionado ----
  // Un item está en alerta si quantity <= min_stock (si min_stock no existe, se toma 0)
  const lowStockItems = useMemo(() => {
    return inventory.filter((inv) => {
      const minStock = inv.product?.min_stock ?? 0;
      return typeof inv.quantity === "number" && inv.quantity <= minStock;
    });
  }, [inventory]);

  // -------- KPIs SIMPLES PARA DASHBOARD --------

  const totalFolios = folios.length;
  const foliosPendientes = folios.filter(
    (f) => f.status === "pendiente",
  ).length;
  const foliosAprobados = folios.filter(
    (f) =>
      f.status === "aprobado_lider" || f.status === "aprobado_supervisor",
  ).length;
  const foliosRechazados = folios.filter(
    (f) => f.status === "rechazado",
  ).length;

  const lowStockCount = lowStockItems.length;

  // -------- HANDLERS: CREAR FOLIO --------

  const handleCreateFolio = async () => {
    if (!newFolioHospitalId) return;
    if (!newFolioPatientName && !newFolioSurgeryType) return;

    try {
      setIsCreatingFolio(true);

      // Inserción mínima en folio_requests.
      // Ajusta nombres de columnas según tu esquema.
      const { error } = await supabase.from("folio_requests").insert({
        hospital_id: newFolioHospitalId,
        status: "pendiente",
        patient_name: newFolioPatientName || null,
        surgery_type: newFolioSurgeryType || null,
        urgency: newFolioUrgency || null,
        created_by_role: "gerente", // si tienes esta columna
      });

      if (error) {
        console.error("Error al crear folio:", error);
      } else {
        // Limpiar formulario
        setNewFolioPatientName("");
        setNewFolioSurgeryType("");
        setNewFolioUrgency("");
        // Refrescar datos del servidor
        router.refresh();
      }
    } finally {
      setIsCreatingFolio(false);
    }
  };

  // -------- HANDLERS: ACTUALIZAR INVENTARIO --------

  const handleInventoryInputChange = (id: string, value: string) => {
    setEditingInventory((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleUpdateInventory = async (invRow: any) => {
    const newQtyStr = editingInventory[invRow.id];
    if (!newQtyStr) return;

    const newQty = Number(newQtyStr);
    if (Number.isNaN(newQty) || newQty < 0) return;

    try {
      setIsUpdatingInventoryId(invRow.id);
      const { error } = await supabase
        .from("inventory")
        .update({ quantity: newQty })
        .eq("id", invRow.id);

      if (error) {
        console.error("Error al actualizar inventario:", error);
      } else {
        router.refresh();
      }
    } finally {
      setIsUpdatingInventoryId(null);
    }
  };

  // -------- HANDLERS: ENVIAR ALERTA (CARPETA) --------
  // Estas funciones suponen una tabla hospital_restock_requests o parecida

  const sendAlert = async (invRow: any, assignedTo: "gerente_almacen" | "cadena_suministro") => {
    try {
      const minStock = invRow.product?.min_stock ?? 0;
      const suggestedQty =
        minStock > invRow.quantity ? minStock - invRow.quantity : minStock;

      const { error } = await supabase.from("hospital_restock_requests").insert({
        hospital_id: invRow.hospital_id,
        product_id: invRow.product_id,
        // puedes ajustar estos campos según tu esquema
        current_quantity: invRow.quantity,
        min_stock: minStock,
        requested_qty: suggestedQty,
        requested_by_role: "gerente_operaciones",
        assigned_to: assignedTo,
        status: "pendiente",
      });

      if (error) {
        console.error("Error al crear solicitud de reabasto:", error);
      } else {
        router.refresh();
      }
    } catch (e) {
      console.error("Error inesperado al enviar alerta:", e);
    }
  };

  // -------- NAV ITEMS PARA RoleShell --------

  const navItems = [
    { id: "dashboard", label: "Resumen" },
    { id: "folios", label: "Folios" },
    { id: "inventario", label: "Inventario" },
    { id: "alertas", label: `Alertas (${lowStockCount})` },
  ];

  // -------- RENDER --------

  return (
    <RoleShell
      user={user}
      roleLabel="Gerente de Operaciones"
      hospitals={hospitals}
      selectedHospitalId={selectedHospitalId}
      onHospitalChange={setSelectedHospitalId}
      navItems={navItems}
      activeSection={activeSection}
      onSectionChange={(id) =>
        setActiveSection(id as "dashboard" | "folios" | "inventario" | "alertas")
      }
      onSignOut={async () => {
        await supabase.auth.signOut();
        router.push("/auth/login");
      }}
    >
      {/* ------- SECCIÓN RESUMEN ------- */}
      {activeSection === "dashboard" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total de folios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalFolios}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{foliosPendientes}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Aprobados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{foliosAprobados}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Rechazados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{foliosRechazados}</p>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-4">
            <CardHeader>
              <CardTitle>Alertas de stock bajo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">
                {lowStockCount === 0
                  ? "No hay alertas de stock bajo."
                  : `Hay ${lowStockCount} insumo(s) con stock por debajo del mínimo.`}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ------- SECCIÓN FOLIOS ------- */}
      {activeSection === "folios" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Crear folio (hospital seleccionado)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Hospital</Label>
                  <Select
                    value={newFolioHospitalId ?? ""}
                    onValueChange={(value) => setNewFolioHospitalId(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona hospital" />
                    </SelectTrigger>
                    <SelectContent>
                      {hospitals.map((h) => (
                        <SelectItem key={h.id} value={h.id}>
                          {h.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Nombre del paciente</Label>
                  <Input
                    value={newFolioPatientName}
                    onChange={(e) => setNewFolioPatientName(e.target.value)}
                    placeholder="Nombre"
                  />
                </div>

                <div className="space-y-1">
                  <Label>Tipo de cirugía</Label>
                  <Input
                    value={newFolioSurgeryType}
                    onChange={(e) => setNewFolioSurgeryType(e.target.value)}
                    placeholder="Ej. Artroscopia de rodilla"
                  />
                </div>

                <div className="space-y-1">
                  <Label>Urgencia</Label>
                  <Input
                    value={newFolioUrgency}
                    onChange={(e) => setNewFolioUrgency(e.target.value)}
                    placeholder="Programada / Urgente"
                  />
                </div>
              </div>

              <Button onClick={handleCreateFolio} disabled={isCreatingFolio}>
                {isCreatingFolio ? "Creando..." : "Crear folio"}
              </Button>
              <p className="text-xs text-muted-foreground">
                * Este formulario crea un folio sencillo con estado{" "}
                <strong>pendiente</strong>. Ajusta las columnas del insert según tu
                esquema de <code>folio_requests</code>.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Folios del hospital seleccionado</CardTitle>
            </CardHeader>
            <CardContent>
              {(!selectedHospitalId || filteredFolios.length === 0) && (
                <p className="text-sm text-muted-foreground">
                  No hay folios para el hospital seleccionado.
                </p>
              )}

              {selectedHospitalId && filteredFolios.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">ID</th>
                        <th className="text-left py-2">Paciente</th>
                        <th className="text-left py-2">Cirugía</th>
                        <th className="text-left py-2">Estatus</th>
                        <th className="text-left py-2">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFolios.map((f) => (
                        <tr key={f.id} className="border-b">
                          <td className="py-2 pr-2">{f.id}</td>
                          <td className="py-2 pr-2">
                            {f.patient_name || "—"}
                          </td>
                          <td className="py-2 pr-2">
                            {f.surgery_type || "—"}
                          </td>
                          <td className="py-2 pr-2 capitalize">{f.status}</td>
                          <td className="py-2 pr-2">
                            {f.created_at
                              ? new Date(f.created_at).toLocaleString()
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ------- SECCIÓN INVENTARIO ------- */}
      {activeSection === "inventario" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Inventario del hospital seleccionado
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(!selectedHospitalId || filteredInventory.length === 0) && (
                <p className="text-sm text-muted-foreground">
                  No hay inventario para el hospital seleccionado.
                </p>
              )}

              {selectedHospitalId && filteredInventory.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Producto</th>
                        <th className="text-left py-2">Cantidad</th>
                        <th className="text-left py-2">Mínimo</th>
                        <th className="text-left py-2">Actualizar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.map((inv) => (
                        <tr key={inv.id} className="border-b">
                          <td className="py-2 pr-2">
                            {inv.product?.name || inv.product_id}
                          </td>
                          <td className="py-2 pr-2">{inv.quantity}</td>
                          <td className="py-2 pr-2">
                            {inv.product?.min_stock ?? "—"}
                          </td>
                          <td className="py-2 pr-2">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                className="w-24"
                                placeholder="Nueva qty"
                                value={editingInventory[inv.id] ?? ""}
                                onChange={(e) =>
                                  handleInventoryInputChange(
                                    inv.id,
                                    e.target.value,
                                  )
                                }
                              />
                              <Button
                                size="sm"
                                onClick={() => handleUpdateInventory(inv)}
                                disabled={isUpdatingInventoryId === inv.id}
                              >
                                {isUpdatingInventoryId === inv.id
                                  ? "Guardando..."
                                  : "Guardar"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ------- SECCIÓN ALERTAS (todos los hospitales) ------- */}
      {activeSection === "alertas" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Alertas de stock bajo (todos los hospitales)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockItems.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hay insumos con stock por debajo del mínimo.
                </p>
              )}

              {lowStockItems.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Hospital</th>
                        <th className="text-left py-2">Producto</th>
                        <th className="text-left py-2">Cantidad</th>
                        <th className="text-left py-2">Mínimo</th>
                        <th className="text-left py-2">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockItems.map((inv) => (
                        <tr key={inv.id} className="border-b">
                          <td className="py-2 pr-2">
                            {inv.hospital?.name || inv.hospital_id}
                          </td>
                          <td className="py-2 pr-2">
                            {inv.product?.name || inv.product_id}
                          </td>
                          <td className="py-2 pr-2">{inv.quantity}</td>
                          <td className="py-2 pr-2">
                            {inv.product?.min_stock ?? "—"}
                          </td>
                          <td className="py-2 pr-2">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  sendAlert(inv, "gerente_almacen")
                                }
                              >
                                Enviar a almacén
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  sendAlert(inv, "cadena_suministro")
                                }
                              >
                                Enviar a cadena
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p className="mt-3 text-xs text-muted-foreground">
                * Estas acciones crean “carpetas”/solicitudes en la tabla{" "}
                <code>hospital_restock_requests</code> asignadas a gerente de
                almacén o cadena de suministro. Ajusta los nombres de columnas
                según tu esquema real.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </RoleShell>
  );
}
