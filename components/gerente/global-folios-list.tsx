"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Clock, CheckCircle2, XCircle, Package } from "lucide-react"
import type { FolioRequest } from "@/lib/types"

interface GlobalFoliosListProps {
  folios: (FolioRequest & { auxiliar: any; hospital: any; folio_items: any[] })[]
}

const statusConfig = {
  pendiente: {
    label: "Pendiente",
    icon: Clock,
    className: "bg-yellow-100 text-yellow-800",
  },
  aprobado_lider: {
    label: "Aprobado por Líder",
    icon: CheckCircle2,
    className: "bg-blue-100 text-blue-800",
  },
  aprobado_supervisor: {
    label: "Aprobado por Supervisor",
    icon: CheckCircle2,
    className: "bg-green-100 text-green-800",
  },
  entregado: {
    label: "Entregado",
    icon: Package,
    className: "bg-purple-100 text-purple-800",
  },
  rechazado: {
    label: "Rechazado",
    icon: XCircle,
    className: "bg-red-100 text-red-800",
  },
}

const priorityConfig = {
  normal: { label: "Normal", className: "bg-gray-100 text-gray-800" },
  urgente: { label: "Urgente", className: "bg-red-100 text-red-800" },
}

export function GlobalFoliosList({ folios }: GlobalFoliosListProps) {
  if (folios.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="mb-4 h-12 w-12 text-gray-400" />
          <p className="text-lg font-medium text-gray-600">No hay folios para mostrar</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {folios.map((folio) => {
        const status = statusConfig[folio.status]
        const priority = priorityConfig[folio.priority]
        const StatusIcon = status.icon

        return (
          <Card key={folio.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{folio.folio_number}</CardTitle>
                  <p className="text-sm text-muted-foreground">Hospital: {folio.hospital?.name}</p>
                  <p className="text-sm text-muted-foreground">Solicitado por: {folio.auxiliar?.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Fecha: {new Date(folio.created_at).toLocaleDateString("es-MX")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge className={priority.className}>{priority.label}</Badge>
                  <Badge className={status.className}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {status.label}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Productos solicitados:</p>
                  <ul className="mt-1 space-y-1">
                    {folio.folio_items?.map((item: any) => (
                      <li key={item.id} className="text-sm text-muted-foreground">
                        • {item.product?.name} - Solicitado: {item.quantity_requested}
                        {item.quantity_approved !== null && (
                          <span className="ml-2 text-green-600">| Aprobado: {item.quantity_approved}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                {folio.notes && (
                  <div>
                    <p className="text-sm font-medium">Notas:</p>
                    <p className="text-sm text-muted-foreground">{folio.notes}</p>
                  </div>
                )}
                {folio.status === "rechazado" && folio.rejection_reason && (
                  <div className="rounded-md bg-red-50 p-3">
                    <p className="text-sm font-medium text-red-800">Motivo de rechazo:</p>
                    <p className="text-sm text-red-600">{folio.rejection_reason}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
