import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CadenaSuministroDashboard } from "@/components/cadena-suministro/cadena-suministro-dashboard"

/**
 * Page component for the supply chain manager (cadena de suministro).
 * Verifies authentication and role, loads hospitals, inventory and
 * transfer orders, then renders the client dashboard.  Unauthorized
 * users are redirected to their own dashboard route.
 */
export default async function CadenaSuministroPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user with hospital info
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*, hospital:hospitals(*)")
    .eq("id", user.id)
    .single()

  if (userError || !userData || userData.role !== "cadena_suministro") {
    redirect("/dashboard")
  }

  // Load all hospitals for selection and reporting
  const { data: hospitals } = await supabase
    .from("hospitals")
    .select("*")
    .order("name", { ascending: true })

  // Load global inventory (same as gerente_almacen)
  const { data: inventory } = await supabase
    .from("inventory")
    .select(
      `*, product:products(*), hospital:hospitals(*)`
    )

  // Load all transfer orders
  const { data: transferOrders } = await supabase
    .from("transfer_orders")
    .select(
      `*,
      origin_hospital:hospitals!transfer_orders_origin_hospital_id_fkey(*),
      destination_hospital:hospitals!transfer_orders_destination_hospital_id_fkey(*),
      items:transfer_order_items(*, product:products(*))
    `,
    )
    .order("created_at", { ascending: false })

  // Load products list for creating new transfers
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true })

  return (
    <CadenaSuministroDashboard
      user={userData}
      hospitals={hospitals || []}
      inventory={inventory || []}
      transferOrders={transferOrders || []}
      products={products || []}
    />
  )
}
