import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { GerenteDashboard } from "@/components/gerente/gerente-dashboard"

export default async function GerentePage() {
  const supabase = await createClient()

  // 1. Usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // 2. Datos del usuario
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*, hospital:hospitals(*)")
    .eq("id", user.id)
    .single()

  // 👀 Ajusta "gerente" si tu rol en BD se llama distinto (ej. "manager")
  if (userError || !userData || userData.role !== "gerente") {
    redirect("/dashboard")
  }

  // 3. Todos los hospitales
  const { data: hospitals, error: hospitalsError } = await supabase
    .from("hospitals")
    .select("*")
    .order("name", { ascending: true })

  if (hospitalsError || !hospitals) {
    redirect("/dashboard")
  }

  const hospitalIds = hospitals.map((h) => h.id)

  // 4. Todos los folios de todos los hospitales
  const { data: folios } = await supabase
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
    `,
    )
    .in("hospital_id", hospitalIds)
    .order("created_at", { ascending: false })

  // 5. Inventario de todos los hospitales
  const { data: inventory } = await supabase
    .from("inventory")
    .select(
      `
      hospital_id,
      product_id,
      quantity,
      product:products(*)
    `,
    )
    .in("hospital_id", hospitalIds)

  return (
    <GerenteDashboard
      user={userData}
      hospitals={hospitals}
      folios={folios || []}
      inventory={inventory || []}
    />
  )
}
