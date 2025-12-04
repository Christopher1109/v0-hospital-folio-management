import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { GerenteAlmacenDashboard } from "@/components/gerente-almacen/gerente-almacen-dashboard"

export default async function GerenteAlmacenPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (userError || !userData || userData.role !== "gerente_almacen") {
    redirect("/dashboard")
  }

  // Obtener corridas de reabasto pendientes
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
    .order("created_at", { ascending: false })

  // Obtener proveedores activos
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("*")
    .eq("active", true)
    .order("name", { ascending: true })

  // Obtener ofertas de proveedores
  const { data: supplierOffers } = await supabase
    .from("supplier_offers")
    .select(`
      *,
      supplier:suppliers(*),
      batch:restock_batches(*),
      supplier_offer_items(
        *,
        product:products(*)
      )
    `)
    .order("created_at", { ascending: false })

  // Obtener órdenes de compra
  const { data: purchaseOrders } = await supabase
    .from("purchase_orders")
    .select(`
      *,
      supplier:suppliers(*),
      created_by_user:users!purchase_orders_created_by_fkey(full_name, email),
      purchase_order_items(
        *,
        product:products(*)
      )
    `)
    .order("created_at", { ascending: false })

  // Obtener inventario del almacén central
  const { data: centralStorage } = await supabase
    .from("storages")
    .select("*")
    .eq("type", "central")
    .is("hospital_id", null)
    .single()

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

  return (
    <GerenteAlmacenDashboard
      user={userData}
      restockBatches={restockBatches || []}
      suppliers={suppliers || []}
      supplierOffers={supplierOffers || []}
      purchaseOrders={purchaseOrders || []}
      storageInventory={storageInventory}
      centralStorage={centralStorage}
    />
  )
}
