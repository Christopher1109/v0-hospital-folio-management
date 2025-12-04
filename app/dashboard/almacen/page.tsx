import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AlmacenDashboard } from "@/components/almacen/almacen-dashboard"

export default async function AlmacenPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: userData } = await supabase.from("users").select("*, hospital:hospitals(*)").eq("id", user.id).single()

  if (!userData || userData.role !== "almacen") {
    redirect("/dashboard")
  }

  // Fetch approved folios ready for delivery
  const { data: folios } = await supabase
    .from("folio_requests")
    .select(`
      *,
      auxiliar:users!folio_requests_auxiliar_id_fkey(full_name, email),
      hospital:hospitals(*),
      folio_items:folio_items(
        *,
        product:products(*)
      )
    `)
    .eq("hospital_id", userData.hospital_id)
    .in("status", ["aprobado_supervisor", "entregado"])
    .order("created_at", { ascending: false })

  // Fetch inventory for the warehouse's hospital
  const { data: inventory } = await supabase
    .from("inventory")
    .select(`
      *,
      product:products(*),
      hospital:hospitals(*)
    `)
    .eq("hospital_id", userData.hospital_id)
    .order("product(name)")

  return <AlmacenDashboard user={userData} folios={folios || []} inventory={inventory || []} />
}
