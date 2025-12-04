"use client"

import { useState } from "react"
import { FileText, Info } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { FolioRequest } from "@/lib/types"

interface AuxiliarFoliosListProps {
  folios: (FolioRequest & {
    auxiliar?: { full_name?: string | null; email?: string | null }
    hospital?: { name?: string | null }
    folio_items?: {
      id: string
      product_id: string
      quantity_requested: number
      product?: { name?: string | null; description?: string | null }
    }[]
  })[]
}

export function AuxiliarFoliosList({ folios }: AuxiliarFoliosListProps) {
  const [selectedFolioId, setSelectedFolioId] = useState<string | null>(null)
  const selectedFolio = folios.find((f) => f.id === selectedFolioId) || null

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendiente":
        return <Badge variant="outline">Pendiente</Badge>
      case "aprobado_lider":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Aprobado por líder</Badge>
      case "aprobado_supervisor":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Aprobado por supervisor</Badge>
      case "entregado":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Entregado</Badge>
      case "rechazado":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rechazado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {folios.map((folio) => (
          <Card
            key={folio.id}
            className="flex flex-col justify-between border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow"
          >
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Folio #{folio.id.slice(0, 8)}</CardTitle>
                {getStatusBadge(folio.status)}
              </div>
              <p className="text-xs text-muted-foreground">
                Paciente: <span className="font-medium">{folio.patient_name || "Sin nombre"}</span>
              </p>
              <p className="text-xs text-muted-foreground">Cirugía: {folio.surgery_type || "Sin especificar"}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  Creado:{" "}
                  {folio.created_at
                    ? new Intl.DateTimeFormat("es-MX", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(folio.created_at))
                    : "Sin fecha"}
                </span>
                <span>{folio.hospital?.name}</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-xs">
                  <p>
                    Insumos: <span className="font-semibold">{folio.folio_items?.length ?? 0}</span>
                  </p>
                  <p>
                    Urgente: <span className="font-semibold">{folio.is_urgent ? "Sí" : "No"}</span>
                  </p>
                </div>

                <Button size="sm" variant="outline" onClick={() => setSelectedFolioId(folio.id)}>
                  <Info className="mr-2 h-4 w-4" />
                  Ver detalles
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {folios.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full">No hay folios registrados todavía.</p>
        )}
      </div>

      {/* Dialog de detalles (solo lectura) */}
      <Dialog open={!!selectedFolio} onOpenChange={(open) => !open && setSelectedFolioId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedFolio && (
            <>
              <DialogHeader>
                <DialogTitle>Detalles del Folio #{selectedFolio.id.slice(0, 8)}</DialogTitle>
                <DialogDescription>Información completa del folio creado por ti.</DialogDescription>
              </DialogHeader>

              <div className="space-y-6 text-sm">
                {/* Paciente */}
                <section className="space-y-2">
                  <h3 className="font-semibold text-base">Datos del Paciente</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-muted-foreground">Nombre</p>
                      <p className="font-medium">{selectedFolio.patient_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">NSS</p>
                      <p className="font-medium">{selectedFolio.patient_nss}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Edad</p>
                      <p className="font-medium">{selectedFolio.patient_age} años</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sexo</p>
                      <p className="font-medium">{selectedFolio.patient_gender}</p>
                    </div>
                  </div>
                </section>

                {/* Procedimiento */}
                <section className="space-y-2">
                  <h3 className="font-semibold text-base">Datos del Procedimiento</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-muted-foreground">Tipo de cirugía</p>
                      <p className="font-medium">{selectedFolio.surgery_type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Hora del procedimiento</p>
                      <p className="font-medium">{selectedFolio.procedure_time}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tipo de anestesia</p>
                      <p className="font-medium">{selectedFolio.anesthesia_type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Urgente</p>
                      <p className="font-medium">{selectedFolio.is_urgent ? "Sí" : "No"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cirujano</p>
                      <p className="font-medium">{selectedFolio.surgeon_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Anestesiólogo</p>
                      <p className="font-medium">{selectedFolio.anesthesiologist_name}</p>
                    </div>
                  </div>
                </section>

                {/* Notas */}
                {selectedFolio.notes && (
                  <section className="space-y-2">
                    <h3 className="font-semibold text-base">Notas</h3>
                    <p className="rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">{selectedFolio.notes}</p>
                  </section>
                )}

                {/* Insumos */}
                <section className="space-y-2">
                  <h3 className="font-semibold text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Insumos solicitados
                  </h3>
                  {selectedFolio.folio_items && selectedFolio.folio_items.length > 0 ? (
                    <div className="rounded-md border">
                      <div className="grid grid-cols-3 gap-2 border-b bg-muted/40 px-3 py-2 text-xs font-semibold">
                        <span>Insumo</span>
                        <span>Cantidad</span>
                        <span>Descripción</span>
                      </div>
                      {selectedFolio.folio_items.map((item) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-3 gap-2 border-b px-3 py-2 text-xs last:border-b-0"
                        >
                          <span className="font-medium">{item.product?.name ?? "Sin nombre"}</span>
                          <span>{item.quantity_requested}</span>
                          <span className="text-muted-foreground">{item.product?.description ?? "-"}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No hay insumos registrados en este folio.</p>
                  )}
                </section>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export { AuxiliarFoliosList as FoliosList }
