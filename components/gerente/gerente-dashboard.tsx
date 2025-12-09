"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RoleShell } from "@/components/layout/role-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { User, FolioRequest, Inventory } from "@/lib/types";

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

export function GerenteDashboard({
  user,
  hospitals,
  folios,
  inventory,
}: GerenteDashboardProps) {
  const router = useRouter();
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(
    hospitals.length > 0 ? hospitals[0].id : null,
  );
  const [activeSection, setActiveSection] = useState<
    "dashboard" | "folios" | "inventario" | "alertas"
  >("dashboard");
  const supabase = createClient();

  // Filtrar folios e inventario por hospital seleccionado
  const filteredFolios = useMemo(
    () =>
      selectedHospitalId
        ? folios.filter((f) => f.hospital_id === selectedHospitalId)
        : [],
    [folios, selectedHospitalId],
  );
  const filteredInventory = useMemo(
    () =>
      selectedHospitalId
        ? inventory.filter((inv) => inv.hospital_id === selectedHospitalId)
        : [],
    [inventory, selectedHospitalId],
  );

  // Detectar productos por debajo del mínimo
  const lowStockItems = useMemo(() => {
    return inventory.filter(
      (inv) => inv.quantity <= (inv.product?.min_stock || 0),
    );
  }, [inventory]);

  // Enviar solicitud al gerente de almacén
  const sendToAlmacen = async (inventoryRow: any) => {
    await supabase.from("hospital_restock_requests").insert({
      hospital_id: inventoryRow.hospital_id,
      product_id: inventoryRow.product_id,
      quantity: inventoryRow.product.min_stock - inventoryRow.quantity,
      requested_by_role: "gerente_operaciones",
      assigned_to: "gerente_almacen",
      status: "pendiente",
    });
    router.refresh();
  };

  // Enviar solicitud a la cadena de suministro
  const sendToCadena = async (inventoryRow: any) => {
    await supabase.from("hospital_restock_requests").insert({
      hospital_id: inventoryRow.hospital_id,
      product_id: inventoryRow.product_id,
      quantity: inventoryRow.product.min_stock - inventoryRow.quantity,
      requested_by_role: "gerente_operaciones",
      assigned_to: "cadena_suministro",
      status: "pendiente",
    });
    router.refresh();
  };

  // Definir elementos de navegación
  const navItems = [
    { id: "dashboard", label: "Resumen" },
    { id: "folios", label: "Folios" },
    { id: "inventario", label: "Inventario" },
    { id: "alertas", label: `Alertas (${lowStockItems.length})` },
  ];

  return (
    <RoleShell
      user={user}
      roleLabel="Gerente de Operaciones"
      hospitals={hospitals}
      selectedHospitalId={selectedHospitalId}
      onHospitalChange={setSelectedHospitalId}
      navItems={navItems}
      activeSection={activeSection}
      onSectionChange={(id) => setActiveSection(id as any)}
      onSignOut={async () => {
        await supabase.auth.signOut();
        router.push("/auth/login");
      }}
    >
      {/* Sección dashboard: tarjetas de resumen */}
      {activeSection === "dashboard" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* tarjetas similares a las actuales para pendientes, aprobados, etc. */}
        </div>
      )}

      {/* Sección folios: lista/aprobación como hasta ahora */}
      {activeSection === "folios" && (
        /* Aquí reutilizar SupervisorApprovalList o la tabla actual */
        null
      )}

      {/* Sección inventario: vista global con alertas en rojo */}
      {activeSection === "inventario" && (
        /* Aquí reutilizar GlobalInventoryView o tu propia tabla */
        null
      )}

      {/* Sección alertas: listar lowStockItems con botones de acción */}
      {activeSection === "alertas" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Alertas de Insumos</h2>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Hospital</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Mínimo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.map((inv) => (
                <tr key={inv.id} className="border-b">
                  <td>{inv.hospital?.name || inv.hospital_id}</td>
                  <td>{inv.product?.name || inv.product_id}</td>
                  <td>{inv.quantity}</td>
                  <td>{inv.product?.min_stock ?? "–"}</td>
                  <td className="flex gap-2">
                    <Button size="sm" onClick={() => sendToAlmacen(inv)}>
                      Enviar a Almacén
                    </Button>
                    <Button size="sm" onClick={() => sendToCadena(inv)}>
                      Enviar a Cadena
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </RoleShell>
  );
}
