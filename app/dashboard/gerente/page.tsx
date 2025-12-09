import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GerenteDashboard } from "@/components/gerente/gerente-dashboard";

export default async function GerentePage() {
  const supabase = await createClient();

  // 1. Usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // 2. Datos del usuario (debe ser GERENTE)
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*, hospital:hospitals(*)")
    .eq("id", user.id)
    .single();

  if (userError || !userData || userData.role !== "gerente") {
    redirect("/dashboard");
  }

  // 3. Todos los hospitales (el gerente ve TODA la red)
  const { data: hospitals, error: hospitalsError } = await supabase
    .from("hospitals")
    .select("*")
    .order("name", { ascending: true });

  if (hospitalsError || !hospitals || hospitals.length === 0) {
    return (
      <GerenteDashboard
        user={userData}
        hospitals={[]}
        folios={[]}
        inventory={[]}
        restockRequests={[]}
      />
    );
  }

  const hospitalIds = hospitals.map((h) => h.id);

  // 4. Todos los folios de todos los hospitales
  const { data: foliosRaw } = await supabase
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
    `
    )
    .in("hospital_id", hospitalIds)
    .order("created_at", { ascending: false });

  const folios = foliosRaw || [];

  // 5. Inventario de todos los hospitales
  const { data: inventoryRaw } = await supabase
    .from("inventory")
    .select(
      `
      id,
      hospital_id,
      product_id,
      quantity,
      product:products(*),
      hospital:hospitals(*)
    `
    )
    .in("hospital_id", hospitalIds);

  const inventory = inventoryRaw || [];

  // 6. Solicitudes de reabasto (las “carpetas”)
  // Ajusta nombres de columnas según tu tabla real
  const { data: restockRaw } = await supabase
    .from("hospital_restock_requests")
    .select(
      `
      id,
      hospital_id,
      product_id,
      current_quantity,
      min_stock,
      requested_qty,
      requested_by_role,
      assigned_to,
      status,
      created_at,
      hospital:hospitals(*),
      product:products(*)
    `
    )
    .in("hospital_id", hospitalIds)
    .order("created_at", { ascending: false });

  const restockRequests = restockRaw || [];

  // 7. Render
  return (
    <GerenteDashboard
      user={userData}
      hospitals={hospitals}
      folios={folios}
      inventory={inventory}
      restockRequests={restockRequests}
    />
  );
}
