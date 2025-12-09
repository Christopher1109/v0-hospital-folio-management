import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user role
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (!userData) {
    redirect("/auth/login")
  }

  // Redirect based on role
  switch (userData.role) {
    case "auxiliar":
      redirect("/dashboard/auxiliar")
    case "lider":
      redirect("/dashboard/lider")
    case "supervisor":
      redirect("/dashboard/supervisor")
    case "almacen":
      redirect("/dashboard/almacen")
    case "gerente":
      redirect("/dashboard/gerente")
    case "gerente_almacen":
      // Route managers of the warehouse department to their dedicated panel
      redirect("/dashboard/gerente-almacen")
    case "cadena_suministro":
      // Route supply chain managers to the logistics dashboard
      redirect("/dashboard/cadena-suministro")
    default:
      redirect("/auth/login")
  }
}
