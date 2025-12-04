"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import type { FolioRequest } from "@/lib/types"
import { Info, CheckCircle2, XCircle } from "lucide-react"

type FolioWithRelations = FolioRequest & {
  auxiliar?: { full_name?: string | null; email?: string | null } | null
  hospital?: { id: string; name: string } | null
  folio_items?: {
    id: string
    product_id: string
    quantity_requested: number
    product?: {
      name?: string | null
      clave?: string | null
    } | null
  }[]
}

interface FolioApprovalListProps {
  folios: FolioWithRelations[]
  userId: string
  onUpdate: () => void
  readOnly?: boolean
}

export function FolioApprovalList({
  folios,
  userId,
  onUpdate,
  readOnly = false,
}: FolioApprovalListProps) {
  const supabase = createClient()

  const [selectedFolio, setSelectedFolio] = useState<FolioWithRelations | null>(
    null,
  )
  const [open, setOpen] = useState(false)
  const [loadingAction, setLoadingAction] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openDetails = (folio: FolioWithRelations) => {
    setSelectedFolio(folio)
    setError(null)
    setOpen(true)
  }

  const closeDetails = () => {
    if (loadingAction) return
    setOpen(false)
    setSelectedFolio(null)
    setError(null)
  }

  const handleApprove = async () => {
    if (!selectedFolio) return
    setLoadingAction(true)
    setError(null)

    try {
      // 🔹 IMPORTANTE: aquí ya NO mandamos 'lider_id' porque esa columna no existe
      const { error: updateError } = await supabase
        .from("folio_requests")
        .update({
          status: "aprobado_lider",
        })
        .eq("id", selectedFolio.id)

      if (updateError) throw updateError

      setOpen(false)
      setSelectedFolio(null)
      onUpdate()
    } catch (err: any) {
      console.error("Error al aprobar folio como líder:", err)
      setError(
        err?.message ??
          "Ocurrió un error al aprobar el folio. Intenta de nuevo.",
      )
    } finally {
      setLoadingAction(false)
    }
  }

  const handleReject = async () => {
    if (!selectedFolio) return
    setLoadingAction(true)
    setError(null)

    try {
      // 🔹 Usamos el mismo RPC que el supervisor para regresar inventario
      const { error: rpcError } = await supabase.rpc(
        "cancel_folio_and_restore_inventory",
        { p_folio_id: selectedFolio.id },
      )

      if (rpcError) throw rpcError

      setOpen(false)
      setSelectedFolio(null)
      onUpdate()
    } catch (err: any) {
      console.error("Error al rechazar folio como líder:", err)
      setError(
        err?.message ??
          "Ocurrió un error al rechazar el folio. Intenta de nuevo.",
      )
    } finally {
      setLoadingAction(false)
    }
  }

  if (!folios || folios.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No hay folios para mostrar en esta categoría.
      </p>
    )
  }

  const getStatusBadge = (status: string) => {
    if (status === "pendiente")
      return <Badge variant="outline">Pendiente</Badge>

    if (status === "aprobado_lider")
      return (
        <Badge variant="outline" className="border-sky-500 text-sky-600">
          Aprobado por líder
        </Badge>
      )

    if (["aprobado_supervisor", "entregado"].includes(status))
      return (
        <Badge variant="outline" className="border-emerald-500 text-emerald-600">
          Aprobado
        </Badge>
      )

    if (status === "rechazado")
      return (
        <Badge variant="outline" className="border-red-500 text-red-600">
          Rechazado
        </Badge>
      )

    return <Badge variant="outline">{status}</Badge>
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {folios.map((folio) => (
          <Card
            key={folio.id}
            className="border-slate-200 shadow-sm transition-colors hover:border-indigo-300"
          >
            <CardContent className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    Folio #{folio.folio_number ?? folio.id?.slice(0, 8)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Paciente:{" "}
                    <span className="font-medium">
                      {folio.patient_name ?? "Sin nombre"}
                    </span>
                  </p>
                </div>
                {getStatusBadge(folio.status)}
              </div>

              <p className="text-xs text-slate-500">
                Cirugía:{" "}
                <span className="font-medium">
                  {folio.surgery_type ?? "Sin especificar"}
                </span>
              </p>

              <p className="text-[11px] text-slate-400">
                Unidad:{" "}
                <span className="font-medium">
                  {folio.hospital?.name ?? "Sin hospital"}
                </span>
              </p>

              <div className="flex items-center justify-between pt-2">
                <p className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Info className="h-3 w-3" />
                  Insumos:{" "}
                  <span className="font-semibold">
                    {folio.folio_items?.length ?? 0}
                  </span>
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => openDetails(folio)}
                >
                  Ver detalles
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog Detalles */}
      <Dialog
        open={open}
        onOpenChange={(openValue) => !loadingAction && setOpen(openValue)}
      >
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Detalles del Folio</DialogTitle>
          </DialogHeader>

          {selectedFolio && (
            <div className="space-y-4 text-sm">
              <section className="space-y-1">
                <p className="text-xs text-slate-500">
                  Folio #
                  {selectedFolio.folio_number ??
                    selectedFolio.id?.slice(0, 8)}
                </p>
                <p className="text-xs text-slate-500">
                  Estado: {getStatusBadge(selectedFolio.status)}
                </p>
              </section>

              <section className="space-y-1">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Paciente
                </h3>
                <p>
                  <span className="font-medium">Nombre:</span>{" "}
                  {selectedFolio.patient_name}
                </p>
                <p className="text-xs text-slate-500">
                  NSS: {selectedFolio.patient_nss ?? "N/A"} · Edad:{" "}
                  {selectedFolio.patient_age ?? "N/A"} · Sexo:{" "}
                  {selectedFolio.patient_gender ?? "N/A"}
                </p>
              </section>

              <section className="space-y-1">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Procedimiento
                </h3>
                <p>
                  <span className="font-medium">Cirugía:</span>{" "}
                  {selectedFolio.surgery_type ?? "Sin especificar"}
                </p>
                <p className="text-xs text-slate-500">
                  Tipo de anestesia:{" "}
                  {selectedFolio.anesthesia_type ?? "N/A"}
                </p>
                <p className="text-xs text-slate-500">
                  Urgente: {selectedFolio.is_urgent ? "Sí" : "No"}
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Insumos solicitados
                </h3>
                {selectedFolio.folio_items &&
                selectedFolio.folio_items.length > 0 ? (
                  <ul className="space-y-1 rounded-md border border-slate-200 bg-slate-50 p-2">
                    {selectedFolio.folio_items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between text-xs text-slate-700"
                      >
                        <span>
                          {item.product?.name ?? "Producto sin nombre"}
                          {item.product?.clave
                            ? ` · Clave: ${item.product.clave}`
                            : ""}
                        </span>
                        <span className="font-semibold">
                          x{item.quantity_requested}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500">
                    No hay insumos registrados en este folio.
                  </p>
                )}
              </section>

              {error && (
                <p className="rounded-md bg-red-50 px-2 py-1 text-xs text-red-600">
                  {error}
                </p>
              )}
            </div>
          )}

          <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={closeDetails}
              disabled={loadingAction}
            >
              Cerrar
            </Button>

            {!readOnly && selectedFolio && (
              <div className="flex flex-1 justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-red-500 text-red-600 hover:bg-red-50"
                  onClick={handleReject}
                  disabled={loadingAction}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {loadingAction ? "Procesando..." : "Rechazar folio"}
                </Button>
                <Button
                  type="button"
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={handleApprove}
                  disabled={loadingAction}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {loadingAction ? "Procesando..." : "Aprobar folio"}
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
