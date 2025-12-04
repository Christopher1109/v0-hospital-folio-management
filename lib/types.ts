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

export interface Inventory {
  id: string
  hospital_id: string
  product_id: string
  quantity: number
  updated_at: string
  product?: Product
  hospital?: Hospital
  expiration_date?: string | null // 👈 agrégale esto
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

export interface HospitalMinStock {
  id: string
  hospital_id: string
  product_id: string
  min_stock: number
  product?: Product
  hospital?: Hospital
}

export interface HospitalRestockRequest {
  id: string
  hospital_id: string
  status: string
  created_at: string
  hospital?: Hospital
}

export interface HospitalRestockItem {
  id: string
  restock_request_id: string
  product_id: string
  quantity_needed: number
  product?: Product
}

export interface RestockBatch {
  id: string
  created_by: string
  created_at: string
  status: string
  segmented_file_url: string | null
  consolidated_file_url: string | null
  created_by_user?: User
}

export interface RestockBatchItem {
  id: string
  batch_id: string
  product_id: string
  total_quantity: number
  product?: Product
}

export interface Storage {
  id: string
  name: string
  type: string
  hospital_id: string | null
  active: boolean
  created_at: string
  hospital?: Hospital
}

export interface StorageInventory {
  id: string
  storage_id: string
  product_id: string
  stock: number
  storage?: Storage
  product?: Product
}

export interface StorageLot {
  id: string
  storage_id: string
  product_id: string
  lot: string
  quantity: number
  expiration_date: string
  created_at: string
  product?: Product
}

export interface StorageMovement {
  id: string
  storage_id: string
  product_id: string
  type: string
  quantity: number
  source: string | null
  reference_id: string | null
  created_by: string
  created_at: string
  product?: Product
  created_by_user?: User
}

export interface Supplier {
  id: string
  name: string
  rfc: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  active: boolean
  created_at: string
}

export interface SupplierOffer {
  id: string
  batch_id: string
  supplier_id: string
  template_file_url: string | null
  reply_file_url: string | null
  status: string
  created_at: string
  supplier?: Supplier
  batch?: RestockBatch
}

export interface SupplierOfferItem {
  id: string
  offer_id: string
  product_id: string
  total_required: number
  quantity_offered: number
  created_at: string
  product?: Product
}

export interface PurchaseOrder {
  id: string
  batch_id: string
  supplier_id: string
  offer_id: string
  status: string
  created_by: string
  po_file_url: string | null
  sent_to_finance_at: string | null
  created_at: string
  supplier?: Supplier
  created_by_user?: User
}

export interface PurchaseOrderItem {
  id: string
  purchase_order_id: string
  product_id: string
  quantity: number
  unit_price: number
  created_at: string
  product?: Product
}

export interface TransferOrder {
  id: string
  batch_id: string | null
  from_storage_id: string
  to_storage_id: string
  status: string
  created_by: string
  created_at: string
  from_storage?: Storage
  to_storage?: Storage
  created_by_user?: User
}

export interface TransferOrderItem {
  id: string
  transfer_id: string
  product_id: string
  quantity: number
  lot: string
  expiration_date: string
  product?: Product
}

export interface Reception {
  id: string
  transfer_id: string
  storekeeper_id: string
  status: string
  comments: string | null
  created_at: string
  transfer?: TransferOrder
  storekeeper?: User
}

export interface ReceptionItem {
  id: string
  reception_id: string
  transfer_item_id: string
  quantity_sent: number
  quantity_received: number
  issue_reason: string | null
  created_at: string
}

export interface InventoryWaste {
  id: string
  hospital_id: string
  product_id: string
  transfer_id: string | null
  reception_id: string | null
  quantity: number
  reason: string
  recorded_by: string
  created_at: string
  product?: Product
  hospital?: Hospital
  recorded_by_user?: User
}
