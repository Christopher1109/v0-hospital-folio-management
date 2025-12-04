import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CadenaSuministroDashboard } from "@/components/cadena-suministro/cadena-suministro-dashboard"

export default async function CadenaSuministroPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (userError || !userData || userData.role !== "cadena_suministro") {
    redirect("/dashboard")
  }

  // Obtener corridas de reabasto aprobadas
  const { data: restockBatches } = await supabase
    .from("restock_batches")
    .select(`
      *,
      created_by_user:users!restock_batches_created_by_fkey(full_name, email),
      restock_batch_items(
        *,
        product:products(*)
      )
    `)
    .eq("status", "approved")
    .order("created_at", { ascending: false })

  // Obtener almacén central
  const { data: centralStorage } = await supabase
    .from("storages")
    .select("*")
    .eq("type", "central")
    .is("hospital_id", null)
    .single()

  // Obtener inventario del almacén central
  let storageInventory = []
  if (centralStorage) {
    const { data: inventory } = await supabase
      .from("storage_inventory")
      .select(`
        *,
        product:products(*),
        storage:storages(*)
      `)
      .eq("storage_id", centralStorage.id)

    storageInventory = inventory || []
  }

  // Obtener traspasos creados
  const { data: transferOrders } = await supabase
    .from("transfer_orders")
    .select(`
      *,
      from_storage:storages!transfer_orders_from_storage_id_fkey(*),
      to_storage:storages!transfer_orders_to_storage_id_fkey(*, hospital:hospitals(*)),
      created_by_user:users!transfer_orders_created_by_fkey(full_name, email),
      transfer_order_items(
        *,
        product:products(*)
      )
    `)
    .order("created_at", { ascending: false })

  // Obtener hospitales
  const { data: hospitals } = await supabase.from("hospitals").select("*").order("name", { ascending: true })

  return (
    <CadenaSuministroDashboard
      user={userData}
      restockBatches={restockBatches || []}
      centralStorage={centralStorage}
      storageInventory={storageInventory}
      transferOrders={transferOrders || []}
      hospitals={hospitals || []}
    />
  )
}
