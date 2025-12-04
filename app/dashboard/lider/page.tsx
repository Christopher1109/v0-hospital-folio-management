import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { LiderDashboard } from "@/components/lider/lider-dashboard"

export default async function LiderPage() {
  const supabase = await createClient()

  // Obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Obtener datos completos del usuario (incluyendo hospital)
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*, hospital:hospitals(*)")
    .eq("id", user.id)
    .single()

  if (userError || !userData || userData.role !== "lider") {
    redirect("/dashboard")
  }

  // Folios del hospital del líder (pendientes / aprobados / entregados / rechazados)
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
    .eq("hospital_id", userData.hospital_id)
    .in("status", ["pendiente", "aprobado_lider", "aprobado_supervisor", "entregado", "rechazado"])
    .order("created_at", { ascending: false })

  // Inventario del hospital del líder (para que pueda registrar insumos como almacenista)
  const { data: inventory } = await supabase
    .from("inventory")
    .select(
      `
      product_id,
      quantity,
      product:products(*)
    `,
    )
    .eq("hospital_id", userData.hospital_id)

  return (
    <LiderDashboard
      user={userData}
      folios={folios || []}
      inventory={inventory || []}
    />
  )
}
