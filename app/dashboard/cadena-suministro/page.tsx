import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CadenaSuministroDashboard } from "@/components/cadena-suministro/cadena-suministro-dashboard";

export default async function CadenaSuministroPage() {
  const supabase = await createClient();

  // 1. Usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // 2. Datos del usuario (debe tener rol "cadena_suministro")
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*, hospital:hospitals(*)")
    .eq("id", user.id)
    .single();

  if (userError || !userData || userData.role !== "cadena_suministro") {
    redirect("/dashboard");
  }

  // 3. Obtener hospitales ordenados por nombre
  const { data: hospitals } = await supabase
    .from("hospitals")
    .select("*")
    .order("name");

  // 4. Obtener inventario completo (con producto y hospital asociados)
  const { data: inventory } = await supabase
    .from("inventory")
    .select(
      `
      *,
      hospital:hospitals(*),
      product:products(*)
    `
    );

  // 5. Obtener órdenes de transferencia con datos de hospital origen/destino e items
  const { data: transferOrders } = await supabase
    .from("transfer_orders")
    .select(
      `
      *,
      origin_hospital:hospitals!transfer_orders_origin_hospital_id_fkey(*),
      destination_hospital:hospitals!transfer_orders_destination_hospital_id_fkey(*),
      items:transfer_order_items(*, product:products(*))
    `
    )
    .order("created_at", { ascending: false });

  // 6. Obtener catálogo de productos
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("name");

  return (
    <CadenaSuministroDashboard
      user={userData}
      hospitals={hospitals || []}
      inventory={inventory || []}
      transferOrders={transferOrders || []}
      products={products || []}
    />
  );
}
