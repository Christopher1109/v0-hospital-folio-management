export type UserRole = "auxiliar" | "lider" | "supervisor" | "almacen" | "gerente"

export type FolioStatus = "pendiente" | "aprobado_lider" | "aprobado_supervisor" | "entregado" | "rechazado"

export type FolioPriority = "normal" | "urgente"

export interface Hospital {
  id: string
  name: string
  location: string
  created_at: string
}

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  hospital_id: string | null
  created_at: string
}

export interface Product {
  id: string
  name: string
  description: string | null
  unit: string
  category: string
  min_stock: number
  created_at: string
}

export interface Inventory {
  id: string
  hospital_id: string
  product_id: string
  quantity: number
  updated_at: string
  product?: Product
  hospital?: Hospital
}

export interface FolioRequest {
  id: string
  folio_number: string
  auxiliar_id: string
  hospital_id: string
  status: FolioStatus
  priority: FolioPriority
  notes: string | null
  rejected_by: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
  patient_name: string | null
  patient_age: number | null
  patient_gender: "masculino" | "femenino" | "otro" | null
  patient_nss: string | null
  surgery_type: string | null
  is_urgent: boolean | null
  anesthesia_type: string | null
  surgeon_name: string | null
  anesthesiologist_name: string | null
  procedure_time: string | null
  auxiliar?: User
  hospital?: Hospital
}

export interface FolioItem {
  id: string
  folio_id: string
  product_id: string
  quantity_requested: number
  quantity_approved: number | null
  created_at: string
  product?: Product
}

export interface FolioHistory {
  id: string
  folio_id: string
  user_id: string
  action: string
  previous_status: string | null
  new_status: string | null
  notes: string | null
  created_at: string
  user?: User
}

export interface AnesthesiaType {
  id: string
  name: string
  description: string | null
  created_at: string
}

export interface Doctor {
  id: string
  name: string
  specialty: "cirujano" | "anestesiólogo"
  hospital_id: string
  created_at: string
}

export type AnesthesiaSimpleType = "general" | "locorregional" | "sedacion"

export interface SupervisorHospital {
  id: string
  supervisor_id: string
  hospital_id: string
  created_at: string
  hospital?: Hospital
}

export interface Inventory {
  hospital_id: string
  product_id: string
  quantity: number
  product?: {
    id: string
    name: string
    description?: string | null
  }
  expiration_date?: string | null  // 👈 agrégale esto
}
