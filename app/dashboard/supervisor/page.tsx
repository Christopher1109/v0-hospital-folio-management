// app/supervisor/page.tsx

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SupervisorDashboard } from "@/components/supervisor/supervisor-dashboard"
import type { User as AppUser } from "@/lib/types"

export default async function SupervisorPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/auth/login")
  }

  // Traer perfil de nuestra tabla users
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, email, full_name, role, hospital:hospitals(id, name)")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    console.error("Error cargando perfil de usuario:", profileError)
    redirect("/auth/login")
  }

  // Obtener hospitales asignados al supervisor
  let hospitals: { id: string; name: string }[] = []

  if (profile.role === "supervisor") {
    const { data: assigned, error: assignedError } = await supabase
      .from("supervisor_hospitals")
      .select("hospital:hospitals(id, name)")
      .eq("supervisor_id", profile.id)

    if (assignedError) {
      console.error("Error cargando hospitales del supervisor:", assignedError)
      hospitals = []
    } else {
      hospitals =
        assigned?.map((row: any) => ({
          id: row.hospital.id,
          name: row.hospital.name,
        })) ?? []
    }
  } else {
    // Por si algún día usas esta página para otro rol
    if (profile.hospital) {
      hospitals = [{ id: profile.hospital.id, name: profile.hospital.name }]
    }
  }

  return (
    <SupervisorDashboard
      user={profile as AppUser & { hospital?: any }}
      hospitals={hospitals}
    />
  )
}
