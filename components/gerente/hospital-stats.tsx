"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Building2, FileText, Package } from "lucide-react"
import type { Hospital, FolioRequest, Inventory } from "@/lib/types"

interface HospitalStatsProps {
  hospitals: Hospital[]
  folios: (FolioRequest & { hospital: any })[]
  inventory: Inventory[]
}

export function HospitalStats({ hospitals, folios, inventory }: HospitalStatsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Resumen por Hospital</h2>
        <p className="text-sm text-muted-foreground">Métricas clave de cada hospital en la red</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {hospitals.map((hospital) => {
          const hospitalFolios = folios.filter((f) => f.hospital_id === hospital.id)
          const hospitalInventory = inventory.filter((i) => i.hospital_id === hospital.id)

          const totalFolios = hospitalFolios.length
          const pendingFolios = hospitalFolios.filter(
            (f) => f.status === "pendiente" || f.status === "aprobado_lider" || f.status === "aprobado_supervisor",
          ).length
          const deliveredFolios = hospitalFolios.filter((f) => f.status === "entregado").length
          const rejectedFolios = hospitalFolios.filter((f) => f.status === "rechazado").length
          const lowStockItems = hospitalInventory.filter((i) => i.quantity <= (i.product?.min_stock || 0)).length

          const deliveryRate = totalFolios > 0 ? (deliveredFolios / totalFolios) * 100 : 0

          return (
            <Card key={hospital.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {hospital.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{hospital.location}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Folios Totales
                    </span>
                    <span className="font-bold">{totalFolios}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-yellow-600">En Proceso</span>
                    <span className="font-semibold">{pendingFolios}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-600">Entregados</span>
                    <span className="font-semibold">{deliveredFolios}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-red-600">Rechazados</span>
                    <span className="font-semibold">{rejectedFolios}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Tasa de Entrega</span>
                    <span className="font-bold">{deliveryRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={deliveryRate} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Inventario
                    </span>
                    <span className="font-bold">{hospitalInventory.length}</span>
                  </div>
                  {lowStockItems > 0 && (
                    <div className="rounded-md bg-red-50 p-2">
                      <p className="text-xs text-red-600 font-medium">
                        {lowStockItems} producto{lowStockItems !== 1 ? "s" : ""} con stock bajo
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
