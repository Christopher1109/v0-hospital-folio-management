"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

interface FolioItem {
  id: string
  insumoId: string
  nombreInsumo: string
  cantidadSolicitada: number
  stockActual?: number | null
}

interface FolioEntregaCardProps {
  folioId: string
  folioCode: string
  solicitadoPor: string
  fecha: string
  prioridad: "Normal" | "Urgente"
  hospitalId: string
  items: FolioItem[]
  onProcessed?: () => void // para refrescar la lista después de procesar
}

export function FolioEntregaCard({
  folioId,
  folioCode,
  solicitadoPor,
  fecha,
  prioridad,
  hospitalId,
  items,
  onProcessed,
}: FolioEntregaCardProps) {
  const [cantidadesRecibidas, setCantidadesRecibidas] = useState<
    Record<string, number>
  >(() =>
    items.reduce((acc, item) => {
      acc[item.id] = item.cantidadSolicitada
      return acc
    }, {} as Record<string, number>),
  )

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleCantidadChange = (itemId: string, value: string) => {
    const num = Number(value)
    if (Number.isNaN(num) || num < 0) return
    setCantidadesRecibidas((prev) => ({ ...prev, [itemId]: num }))
  }

  const procesarFolio = async (accion: "aceptar" | "rechazar") => {
    try {
      setIsSubmitting(true)
      setErrorMessage(null)
      setSuccessMessage(null)

      const payload = {
        folioId,
        hospitalId,
        accion,
        items: items.map((item) => ({
          itemId: item.id,
          insumoId: item.insumoId,
          cantidadSolicitada: item.cantidadSolicitada,
          cantidadRecibida:
            accion === "rechazar" ? 0 : cantidadesRecibidas[item.id] ?? 0,
        })),
      }

      const res = await fetch("/api/almacen/procesar-folio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error al procesar el folio")
      }

      setSuccessMessage(
        accion === "aceptar"
          ? data.status === "entregado"
            ? "Folio entregado y stock actualizado."
            : "Folio entregado parcialmente y stock actualizado."
          : "Folio marcado como rechazado.",
      )

      if (onProcessed) {
        onProcessed()
      }
    } catch (error: any) {
      console.error(error)
      setErrorMessage(error.message || "Error al procesar el folio.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const esEntregaCompleta = items.every(
    (item) =>
      cantidadesRecibidas[item.id] === item.cantidadSolicitada &&
      cantidadesRecibidas[item.id] > 0,
  )

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg font-semibold">
            {folioCode}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Solicitado por: <span className="font-medium">{solicitadoPor}</span>
          </p>
          <p className="text-sm text-muted-foreground">Fecha: {fecha}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant={prioridad === "Urgente" ? "destructive" : "outline"}>
            {prioridad}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Hospital ID: {hospitalId}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm font-medium">Productos a entregar:</p>

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="grid gap-2 rounded-lg border p-3 md:grid-cols-4 md:items-center"
            >
              <div className="md:col-span-2">
                <p className="text-sm font-semibold">{item.nombreInsumo}</p>
                <p className="text-xs text-muted-foreground">
                  Solicitado: {item.cantidadSolicitada}
                </p>
                {typeof item.stockActual === "number" && (
                  <p className="text-xs text-muted-foreground">
                    Stock actual: {item.stockActual}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Cantidad recibida
                </p>
                <Input
                  type="number"
                  min={0}
                  value={cantidadesRecibidas[item.id] ?? 0}
                  onChange={(e) =>
                    handleCantidadChange(item.id, e.target.value)
                  }
                />
              </div>

              <div className="text-xs text-muted-foreground md:text-right">
                {cantidadesRecibidas[item.id] === item.cantidadSolicitada ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    Coincide con solicitud
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                    Diferencia:{" "}
                    {cantidadesRecibidas[item.id] - item.cantidadSolicitada}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {errorMessage && (
          <p className="text-sm font-medium text-red-600">{errorMessage}</p>
        )}
        {successMessage && (
          <p className="text-sm font-medium text-emerald-600">
            {successMessage}
          </p>
        )}

        <div className="flex flex-col gap-2 border-t pt-4 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-muted-foreground">
            {esEntregaCompleta ? (
              <span>
                Se registrará el folio como{" "}
                <span className="font-semibold">entregado completo</span>.
              </span>
            ) : (
              <span>
                Se registrará el folio como{" "}
                <span className="font-semibold">entrega parcial</span> según las
                cantidades recibidas.
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2 md:flex-row">
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={() => procesarFolio("rechazar")}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Marcar como incompleto / rechazado
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={() => procesarFolio("aceptar")}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Confirmar y actualizar stock
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
