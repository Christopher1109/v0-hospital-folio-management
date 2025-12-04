"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SuppliersListProps {
  suppliers: any[]
}

export function SuppliersList({ suppliers }: SuppliersListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {suppliers.length === 0 ? (
        <Card className="col-span-2">
          <CardContent className="flex items-center justify-center py-10">
            <p className="text-muted-foreground">No hay proveedores registrados</p>
          </CardContent>
        </Card>
      ) : (
        suppliers.map((supplier) => (
          <Card key={supplier.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{supplier.name}</CardTitle>
                <Badge variant={supplier.active ? "default" : "secondary"}>
                  {supplier.active ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">RFC:</span> {supplier.rfc}
              </div>
              {supplier.contact_name && (
                <div className="text-sm">
                  <span className="font-medium">Contacto:</span> {supplier.contact_name}
                </div>
              )}
              {supplier.contact_email && (
                <div className="text-sm">
                  <span className="font-medium">Email:</span> {supplier.contact_email}
                </div>
              )}
              {supplier.contact_phone && (
                <div className="text-sm">
                  <span className="font-medium">Teléfono:</span> {supplier.contact_phone}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
