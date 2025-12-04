import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AuxiliarDashboard } from "@/components/auxiliar/auxiliar-dashboard"

export default async function AuxiliarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: userData } = await supabase.from("users").select("*, hospital:hospitals(*)").eq("id", user.id).single()

  if (!userData || userData.role !== "auxiliar") {
    redirect("/dashboard")
  }

  // Fetch user's folios
  const { data: folios } = await supabase
    .from("folio_requests")
    .select(`
      *,
      hospital:hospitals(*),
      folio_items:folio_items(
        *,
        product:products(*)
      )
    `)
    .eq("auxiliar_id", user.id)
    .order("created_at", { ascending: false })

  // Fetch available products with inventory
  const { data: inventory } = await supabase
    .from("inventory")
    .select(`
      *,
      product:products(*),
      hospital:hospitals(*)
    `)
    .eq("hospital_id", userData.hospital_id)
    .order("product(name)")

  return <AuxiliarDashboard user={userData} folios={folios || []} inventory={inventory || []} />
}
