import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { GerenteAlmacenDashboard } from "@/components/gerente-almacen/gerente-almacen-dashboard"

/**
 * Page component for the warehouse manager (gerente de almacén).  This
 * server component verifies the authenticated user and role, loads the
 * data needed by the dashboard (hospitals, inventory, restock requests,
 * purchase orders, transfer orders and suppliers) and then renders
 * the client‑side dashboard component.  If the user is not logged in
 * or does not have the appropriate role, the request is redirected
 * back to the generic dashboard.
 */
export default async function GerenteAlmacenPage() {
  const supabase = await createClient()
  // 1. Ensure user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // 2. Fetch the full user record with hospital information
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*, hospital:hospitals(*)")
    .eq("id", user.id)
    .single()

  if (userError || !userData || userData.role !== "gerente_almacen") {
    // If the user isn't a warehouse manager, send them back to the
    // dashboard to be routed by their actual role.
    redirect("/dashboard")
  }

  // 3. Load all hospitals for filtering and reporting
  const { data: hospitals } = await supabase
    .from("hospitals")
    .select("*")
    .order("name", { ascending: true })

  // 4. Load full inventory across the network.  Join the related
  // product and hospital so the client component can render human
  // friendly names.
  const { data: inventory } = await supabase
    .from("inventory")
    .select(
      `
      *,
      product:products(*),
      hospital:hospitals(*)
    `,
    )

  // 5. Load restock requests raised by hospitals.  These records
  // indicate that a local store has fallen below its minimum stock
  // threshold and needs resupply.  We join the requesting hospital and
  // user so the dashboard can display names.  A status field
  // (e.g. "pendiente", "aprobado", "rechazado") is assumed to exist on
  // the table.
  const { data: restockRequests } = await supabase
    .from("hospital_restock_requests")
    .select(
      `*,
      hospital:hospitals(*),
      requested_by:users(full_name, email)
    `,
    )
    .order("created_at", { ascending: false })

  // 6. Load purchase orders.  Each order may target a specific
  // hospital or be for the central warehouse.  We join supplier and
  // hospital information for display.
  const { data: purchaseOrders } = await supabase
    .from("purchase_orders")
    .select(
      `*,
      supplier:suppliers(*),
      hospital:hospitals(*),
      items:purchase_order_items(*, product:products(*))
    `,
    )
    .order("created_at", { ascending: false })

  // 7. Load transfer orders.  These records capture movements of
  // inventory between hospitals or from the central warehouse to
  // hospitals.  We join origin/destination hospitals for clarity.
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

  // 8. Load suppliers list
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("*")
    .order("name", { ascending: true })

  return (
    <GerenteAlmacenDashboard
      user={userData}
      hospitals={hospitals || []}
      inventory={inventory || []}
      restockRequests={restockRequests || []}
      purchaseOrders={purchaseOrders || []}
      transferOrders={transferOrders || []}
      suppliers={suppliers || []}
    />
  )
}
