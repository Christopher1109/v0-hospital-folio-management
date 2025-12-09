import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CadenaSuministroDashboard } from "@/components/cadena-suministro/cadena-suministro-dashboard";

export default async function CadenaSuministroPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Verifica el rol y trae datos necesarios
  const { data: userData } = await supabase
    .from("users")
    .select("*, hospital:hospitals(*)")
    .eq("id", user.id)
    .single();

  if (!userData || userData.role !== "cadena_suministro") {
    redirect("/dashboard");
  }

  const { data: hospitals } = await supabase.from("hospitals").select("*").order("name");
  const { data: inventory } = await supabase
    .from("inventory")
    .select("*, product:products(*), hospital:hospitals(*)");
  const { data: transferOrders } = await supabase
    .from("transfer_orders")
    .select(`*, origin_hospital:hospitals!transfer_orders_origin_hospital_id_fkey(*),
              destination_hospital:hospitals!transfer_orders_destination_hospital_id_fkey(*),
              items:transfer_order_items(*, product:products(*))`)
    .order("created_at", { ascending: false });
  const { data: products } = await supabase.from("products").select("*").order("name");

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
