//
// Extend user roles to include warehouse‑department roles.  These new roles
// support the logistics side of the hospital network:
//
//   gerente_almacen – oversees the inventory and purchasing functions across
//     all hospitals.  This role can approve restock requests, create
//     purchase orders and manage transfer orders between hospitals.
//   cadena_suministro – manages the distribution network.  This role
//     focuses on moving stock from one hospital to another and balancing
//     inventory levels.
//
export type UserRole =
  | "auxiliar"
  | "lider"
  | "supervisor"
  | "almacen"
  | "gerente"
  | "gerente_almacen"
  | "cadena_suministro"

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

/**
 * Inventory records track the quantity on hand of a given product in a
 * particular hospital.  Each row corresponds to one product at one
 * hospital.  The optional `expiration_date` field is present on rows
 * where items are tracked by lot/batch and have a known expiry.  When
 * working with aggregated inventory data you should favour the
 * `quantity` field; clients can inspect `expiration_date` to warn
 * about expiring lots.
 */
export interface Inventory {
  /** Primary key for the inventory record */
  id: string
  /** Hospital that owns this stock */
  hospital_id: string
  /** Product identifier */
  product_id: string
  /** Current quantity available */
  quantity: number
  /** Timestamp of the last update */
  updated_at: string
  /** Associated product details (joined) */
  product?: Product
  /** Associated hospital details (joined) */
  hospital?: Hospital
  /** Optional expiry date if the stock is lot‑controlled */
  expiration_date?: string | null
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

// Duplicate Inventory interface removed; see the definition above for the
// consolidated version that includes an optional expiration_date field.
