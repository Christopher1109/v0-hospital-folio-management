"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileSpreadsheet, Download } from "lucide-react"

interface RestockBatchesListProps {
  batches: any[]
  suppliers: any[]
  supplierOffers: any[]
}

export function RestockBatchesList({ batches, suppliers, supplierOffers }: RestockBatchesListProps) {
  const handleGenerateTemplate = async (batchId: string) => {
    // API call to generate Excel template
    console.log("[v0] Generating template for batch:", batchId)
  }

  const handleDownloadFile = (url: string) => {
    window.open(url, "_blank")
  }

  return (
    <div className="space-y-4">
      {batches.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <p className="text-muted-foreground">No hay corridas de reabasto pendientes</p>
          </CardContent>
        </Card>
      ) : (
        batches.map((batch) => (
          <Card key={batch.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Corrida {new Date(batch.created_at).toLocaleDateString()}</CardTitle>
                  <CardDescription>Creado por {batch.created_by_user?.full_name || "Usuario"}</CardDescription>
                </div>
                <Badge variant={batch.status === "pending" ? "default" : "secondary"}>{batch.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Productos ({batch.restock_batch_items?.length || 0})</p>
                <div className="space-y-1">
                  {batch.restock_batch_items?.slice(0, 3).map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.product?.name}</span>
                      <span className="font-medium">{item.total_quantity}</span>
                    </div>
                  ))}
                  {(batch.restock_batch_items?.length || 0) > 3 && (
                    <p className="text-xs text-muted-foreground">+{batch.restock_batch_items.length - 3} más...</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {batch.consolidated_file_url && (
                  <Button variant="outline" size="sm" onClick={() => handleDownloadFile(batch.consolidated_file_url)}>
                    <Download className="mr-2 h-4 w-4" />
                    Archivo Consolidado
                  </Button>
                )}
                {batch.segmented_file_url && (
                  <Button variant="outline" size="sm" onClick={() => handleDownloadFile(batch.segmented_file_url)}>
                    <Download className="mr-2 h-4 w-4" />
                    Archivo Segmentado
                  </Button>
                )}
                <Button variant="default" size="sm" onClick={() => handleGenerateTemplate(batch.id)}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Generar Plantilla Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
