"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Plus, Trash2 } from "lucide-react"
import type { User, Inventory } from "@/lib/types"
import { Switch } from "@/components/ui/switch"

interface CreateFolioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  inventory: Inventory[]
  onSuccess: () => void
}

interface FolioItem {
  product_id: string
  quantity: number
}

interface Doctor {
  id: string
  name: string
  role: "cirujano" | "anestesiologo"
}

export function CreateFolioDialog({ open, onOpenChange, user, inventory, onSuccess }: CreateFolioDialogProps) {
  const [patientName, setPatientName] = useState("")
  const [patientAge, setPatientAge] = useState("")
  const [patientGender, setPatientGender] = useState("")
  const [patientNSS, setPatientNSS] = useState("")
  const [surgeryType, setSurgeryType] = useState("")
  const [isEmergency, setIsEmergency] = useState(false)
  const [anesthesiaType, setAnesthesiaType] = useState("")
  const [surgeonName, setSurgeonName] = useState("")
  const [anesthesiologistName, setAnesthesiologistName] = useState("")
  const [procedureTime, setProcedureTime] = useState("")
  const [priority, setPriority] = useState<"normal" | "urgente">("normal")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<FolioItem[]>([{ product_id: "", quantity: 1 }])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Médicos por hospital
  const [surgeons, setSurgeons] = useState<Doctor[]>([])
  const [anesthesiologists, setAnesthesiologists] = useState<Doctor[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [doctorsError, setDoctorsError] = useState<string | null>(null)

  const anesthesiaTypes = [
    { id: "general", name: "Anestesia General" },
    { id: "locorregional", name: "Anestesia Locorregional" },
    { id: "sedacion", name: "Sedación" },
  ]

  // Cargar cirujanos y anestesiólogos del hospital del usuario cuando se abre el diálogo
  useEffect(() => {
    if (!open || !user?.hospital_id) return

    const supabase = createClient()

    const loadDoctors = async () => {
      try {
        setLoadingDoctors(true)
        setDoctorsError(null)

        const { data, error } = await supabase
          .from("hospital_doctors")
          .select("id, name, role")
          .eq("hospital_id", user.hospital_id)

        if (error) {
          console.error("Error cargando médicos:", error)
          setDoctorsError("No se pudieron cargar los médicos del hospital.")
          setSurgeons([])
          setAnesthesiologists([])
          return
        }

        const docs = (data || []) as Doctor[]
        setSurgeons(docs.filter((d) => d.role === "cirujano"))
        setAnesthesiologists(docs.filter((d) => d.role === "anestesiologo"))
      } finally {
        setLoadingDoctors(false)
      }
    }

    loadDoctors()
  }, [open, user?.hospital_id])

  const handleItemChange = (index: number, key: keyof FolioItem, value: string | number) => {
    const newItems = [...items]
    newItems[index][key] = value as any
    setItems(newItems)
  }

  const handleRemoveItem = (index: number) => {
    const newItems = [...items]
    newItems.splice(index, 1)
    setItems(newItems)
  }

  const handleAddItem = () => {
    setItems([...items, { product_id: "", quantity: 1 }])
  }

  const buildErrorMessage = (err: unknown): string => {
    if (!err) return "Error desconocido"
    if (typeof err === "string") return err
    if (err instanceof Error) return err.message
    try {
      return JSON.stringify(err)
    } catch {
      return String(err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    // Validación de usuario / hospital
    if (!user?.id) {
      setError("Tu usuario no está correctamente identificado. Vuelve a iniciar sesión.")
      setIsSubmitting(false)
      return
    }

    if (!user?.hospital_id) {
      setError("Tu usuario no tiene un hospital asignado. Contacta al administrador.")
      setIsSubmitting(false)
      return
    }

    if (!patientName.trim()) {
      setError("El nombre del paciente es obligatorio")
      setIsSubmitting(false)
      return
    }

    const age = Number.parseInt(patientAge)
    if (!patientAge || isNaN(age) || age < 0 || age > 120) {
      setError("La edad del paciente debe ser un número entre 0 y 120")
      setIsSubmitting(false)
      return
    }

    if (!patientGender) {
      setError("El sexo del paciente es obligatorio")
      setIsSubmitting(false)
      return
    }

    if (!patientNSS.trim()) {
      setError("El número de seguro social es obligatorio")
      setIsSubmitting(false)
      return
    }

    if (!surgeryType.trim()) {
      setError("El tipo de cirugía es obligatorio")
      setIsSubmitting(false)
      return
    }

    if (!anesthesiaType) {
      setError("El tipo de anestesia es obligatorio")
      setIsSubmitting(false)
      return
    }

    if (!surgeonName) {
      setError("Debes seleccionar el cirujano")
      setIsSubmitting(false)
      return
    }

    if (!anesthesiologistName) {
      setError("Debes seleccionar el anestesiólogo")
      setIsSubmitting(false)
      return
    }

    if (!procedureTime) {
      setError("La hora del procedimiento es obligatoria")
      setIsSubmitting(false)
      return
    }

    // Validar insumos
    const validItems = items.filter((item) => item.product_id && item.quantity > 0)
    if (validItems.length === 0) {
      setError("Debes agregar al menos un producto")
      setIsSubmitting(false)
      return
    }

    const supabase = createClient()

    // Generar número de folio único
    const folioNumber = `F-${(user.hospital_id || "GEN").slice(0, 8)}-${Date.now()}`

    try {
      const { data: folio, error: folioError } = await supabase
        .from("folio_requests")
        .insert({
          auxiliar_id: user.id,
          hospital_id: user.hospital_id,
          folio_number: folioNumber,
          priority,
          notes,
          status: "pendiente",
          patient_name: patientName.trim(),
          patient_age: age,
          patient_gender: patientGender,
          patient_nss: patientNSS.trim(),
          surgery_type: surgeryType.trim(),
          is_urgent: isEmergency,
          anesthesia_type: anesthesiaType,
          surgeon_name: surgeonName.trim(),
          anesthesiologist_name: anesthesiologistName.trim(),
          procedure_time: procedureTime,
        })
        .select()
        .single()

      if (folioError) throw folioError

      const { error: itemsError } = await supabase.from("folio_items").insert(
        validItems.map((item) => ({
          folio_id: folio.id,
          product_id: item.product_id,
          quantity_requested: item.quantity,
        })),
      )

      if (itemsError) throw itemsError

      await supabase.from("folio_history").insert({
        folio_id: folio.id,
        user_id: user.id,
        action: "Folio creado",
        new_status: "pendiente",
      })

      // Reset form
      setPriority("normal")
      setNotes("")
      setPatientName("")
      setPatientAge("")
      setPatientGender("")
      setPatientNSS("")
      setSurgeryType("")
      setIsEmergency(false)
      setAnesthesiaType("")
      setSurgeonName("")
      setAnesthesiologistName("")
      setProcedureTime("")
      setItems([{ product_id: "", quantity: 1 }])

      onSuccess()
    } catch (err) {
      console.error("Error al crear el folio:", err)
      const msg = buildErrorMessage(err)
      setError(`Error al crear el folio: ${msg}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Folio</DialogTitle>
          <DialogDescription>
            Registra los datos del paciente y solicita material médico
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos del paciente */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Datos del Paciente</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientName">
                  Nombre del paciente <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="patientName"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Nombre completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="patientAge">
                  Edad <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="patientAge"
                  type="number"
                  min="0"
                  max="120"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  placeholder="Edad en años"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientGender">
                  Sexo <span className="text-red-500">*</span>
                </Label>
                <Select value={patientGender} onValueChange={setPatientGender} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el sexo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="patientNSS">
                  Número de Seguro Social <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="patientNSS"
                  value={patientNSS}
                  onChange={(e) => setPatientNSS(e.target.value)}
                  placeholder="NSS del paciente"
                  required
                />
              </div>
            </div>
          </div>

          {/* Datos del procedimiento */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Datos del Procedimiento</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="surgeryType">
                  Tipo de Cirugía <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="surgeryType"
                  value={surgeryType}
                  onChange={(e) => setSurgeryType(e.target.value)}
                  placeholder="Ej: Cirugía abdominal"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="procedureTime">
                  Hora del Procedimiento <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="procedureTime"
                  type="time"
                  value={procedureTime}
                  onChange={(e) => setProcedureTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="isEmergency" checked={isEmergency} onCheckedChange={setIsEmergency} />
              <Label htmlFor="isEmergency" className="cursor-pointer">
                ¿Es una cirugía de urgencia?
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="anesthesiaType">
                  Tipo de Anestesia <span className="text-red-500">*</span>
                </Label>
                <Select value={anesthesiaType} onValueChange={setAnesthesiaType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo de anestesia" />
                  </SelectTrigger>
                  <SelectContent>
                    {anesthesiaTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Select value={priority} onValueChange={(value: "normal" | "urgente") => setPriority(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cirujano / Anestesiólogo desde catálogo del hospital */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Nombre del Cirujano <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={surgeonName}
                  onValueChange={setSurgeonName}
                  disabled={loadingDoctors || surgeons.length === 0}
                >
                  <SelectTrigger className="whitespace-normal break-words text-left items-start min-h-[46px]">
                    <SelectValue
                      placeholder={
                        loadingDoctors
                          ? "Cargando médicos..."
                          : surgeons.length === 0
                          ? "No hay cirujanos configurados"
                          : "Selecciona el cirujano"
                      }
                      className="whitespace-normal break-words text-left"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {surgeons.map((doc) => (
                      <SelectItem key={doc.id} value={doc.name}>
                        {doc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  Nombre del Anestesiólogo <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={anesthesiologistName}
                  onValueChange={setAnesthesiologistName}
                  disabled={loadingDoctors || anesthesiologists.length === 0}
                >
                  <SelectTrigger className="whitespace-normal break-words text-left items-start min-h-[46px]">
                    <SelectValue
                      placeholder={
                        loadingDoctors
                          ? "Cargando médicos..."
                          : anesthesiologists.length === 0
                          ? "No hay anestesiólogos configurados"
                          : "Selecciona el anestesiólogo"
                      }
                      className="whitespace-normal break-words text-left"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {anesthesiologists.map((doc) => (
                      <SelectItem key={doc.id} value={doc.name}>
                        {doc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {doctorsError && (
              <p className="text-xs text-red-600 bg-red-50 rounded-md px-2 py-1">
                {doctorsError}
              </p>
            )}
          </div>

          {/* Insumos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Insumos Utilizados</h3>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Select
                    value={item.product_id}
                    onValueChange={(value) => handleItemChange(index, "product_id", value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecciona un producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventory.map((inv) => (
                        <SelectItem key={inv.product_id} value={inv.product_id}>
                          {inv.product?.name} - Stock: {inv.quantity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", Number.parseInt(e.target.value))}
                    className="w-24"
                    placeholder="Cant."
                  />
                  {items.length > 1 && (
                    <Button type="button" variant="outline" size="icon" onClick={() => handleRemoveItem(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Producto
            </Button>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agrega cualquier información adicional..."
              rows={3}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-600 whitespace-pre-wrap">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando..." : "Crear Folio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
