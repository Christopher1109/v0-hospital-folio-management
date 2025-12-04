// ===============================================
// components/almacen/inventory-management.tsx
// ===============================================

"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { Inventory } from "@/lib/types"
import { PackagePlus, PackageMinus } from "lucide-react"

type Product = {
  id: string
  name: string | null
  clave: string | null
  unit?: string | null
}

interface InventoryManagementProps {
  inventory: (Inventory & {
    product?: { name?: string | null; clave?: string | null; unit?: string | null } | null
  })[]
  hospitalId: string | null
  readOnly?: boolean
  onUpdate?: () => void
}

export function InventoryManagement({
  inventory,
  hospitalId,
  readOnly = false,
  onUpdate,
}: InventoryManagementProps) {
  const supabase = createClient()

  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  // --- estados para "Agregar insumo" ---
  const [openAdd, setOpenAdd] = useState(false)
  const [addProductId, setAddProductId] = useState<string>("")
  const [addQuantity, setAddQuantity] = useState<string>("")
  const [addExpiresAt, setAddExpiresAt] = useState<string>("")
  const [addError, setAddError] = useState<string | null>(null)
  const [addLoading, setAddLoading] = useState(false)

  // --- estados para "Registrar salida" (restar stock) ---
  const [openRemove, setOpenRemove] = useState(false)
  const [removeProductId, setRemoveProductId] = useState<string>("")
  const [removeQuantity, setRemoveQuantity] = useState<string>("")
  const [removeError, setRemoveError] = useState<string | null>(null)
  const [removeLoading, setRemoveLoading] = useState(false)

  // --------------------------------------------------
  // CARGA DE LISTA DE PRODUCTOS
  // --------------------------------------------------
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true)

      const { data, error } = await supabase
        .from("products")
        .select("id, name, clave, unit")
        .order("name", { ascending: true })

      if (error) {
        console.error("Error cargando productos:", error)
        setProducts([])
        return
      }

      setProducts((data as any) || [])
    } catch (err) {
      console.error("Error inesperado cargando productos:", err)
      setProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }

  useEffect(() => {
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------
  const getInventoryByProduct = (productId: string) =>
    inventory.find((item) => item.product_id === productId)

  // --------------------------------------------------
  // MANEJO DE AGREGAR STOCK
  // --------------------------------------------------
  const handleAddInventory = async () => {
    setAddError(null)

    if (!hospitalId) {
      setAddError("Error: No se pudo identificar el hospital del usuario.")
      return
    }
    if (!addProductId) {
      setAddError("Selecciona un producto.")
      return
    }
    const qty = Number(addQuantity)
    if (!qty || qty <= 0) {
      setAddError("Ingresa una cantidad mayor a 0.")
      return
    }

    try {
      setAddLoading(true)

      // ¿Ya hay un registro para ese producto en este hospital?
      const { data: existing, error: existingError } = await supabase
        .from("inventory")
        .select("id, quantity")
        .eq("hospital_id", hospitalId)
        .eq("product_id", addProductId)
        .maybeSingle()

      if (existingError && existingError.code !== "PGRST116") {
        // PGRST116 = no rows returned
        throw existingError
      }

      if (existing) {
        const { error: updateError } = await supabase
          .from("inventory")
          .update({
            quantity: existing.quantity + qty,
            expires_at: addExpiresAt || null,
          })
          .eq("id", existing.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from("inventory").insert({
          hospital_id: hospitalId,
          product_id: addProductId,
          quantity: qty,
          expires_at: addExpiresAt || null,
        })

        if (insertError) throw insertError
      }

      setOpenAdd(false)
      setAddProductId("")
      setAddQuantity("")
      setAddExpiresAt("")
      onUpdate?.()
    } catch (err: any) {
      console.error("Error al agregar insumo al inventario:", err)
      setAddError(
        err?.message ?? "Ocurrió un error al agregar el insumo al inventario.",
      )
    } finally {
      setAddLoading(false)
    }
  }

  // --------------------------------------------------
  // MANEJO DE RESTAR STOCK
  // --------------------------------------------------
  const handleRemoveInventory = async () => {
    setRemoveError(null)

    if (!hospitalId) {
      setRemoveError("Error: No se pudo identificar el hospital del usuario.")
      return
    }
    if (!removeProductId) {
      setRemoveError("Selecciona un producto.")
      return
    }
    const qty = Number(removeQuantity)
    if (!qty || qty <= 0) {
      setRemoveError("Ingresa una cantidad mayor a 0.")
      return
    }

    try {
      setRemoveLoading(true)

      const { data: existing, error: existingError } = await supabase
        .from("inventory")
        .select("id, quantity")
        .eq("hospital_id", hospitalId)
        .eq("product_id", removeProductId)
        .maybeSingle()

      if (existingError) throw existingError
      if (!existing) {
        setRemoveError("No hay inventario registrado para ese producto.")
        return
      }

      if (qty > existing.quantity) {
        setRemoveError(
          `No puedes retirar más de lo disponible. Stock actual: ${existing.quantity}.`,
        )
        return
      }

      const nuevoStock = existing.quantity - qty

      if (nuevoStock === 0) {
        const { error: deleteError } = await supabase
          .from("inventory")
          .delete()
          .eq("id", existing.id)
        if (deleteError) throw deleteError
      } else {
        const { error: updateError } = await supabase
          .from("inventory")
          .update({ quantity: nuevoStock })
          .eq("id", existing.id)
        if (updateError) throw updateError
      }

      setOpenRemove(false)
      setRemoveProductId("")
      setRemoveQuantity("")
      onUpdate?.()
    } catch (err: any) {
      console.error("Error al registrar salida de inventario:", err)
      setRemoveError(
        err?.message ?? "Ocurrió un error al registrar la salida de inventario.",
      )
    } finally {
      setRemoveLoading(false)
    }
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Gestión de Inventario
          </h2>
          <p className="text-xs text-slate-500">
            Administra el stock de productos del hospital.
          </p>
        </div>

        {!readOnly && (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-emerald-600 text-xs text-white hover:bg-emerald-700"
              onClick={() => {
                setAddError(null)
                setOpenAdd(true)
              }}
            >
              <PackagePlus className="mr-2 h-4 w-4" />
              Agregar insumo
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => {
                setRemoveError(null)
                setOpenRemove(true)
              }}
            >
              <PackageMinus className="mr-2 h-4 w-4" />
              Registrar salida
            </Button>
          </div>
        )}
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Inventario del hospital
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inventory.length === 0 ? (
            <p className="text-xs text-slate-500">
              No hay insumos registrados en el inventario de este hospital.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {inventory.map((item) => {
                const anyItem = item as any
                const minQty =
                  typeof anyItem.min_quantity === "number"
                    ? anyItem.min_quantity
                    : null
                const maxQty =
                  typeof anyItem.max_quantity === "number"
                    ? anyItem.max_quantity
                    : null
                const isBelowMin =
                  typeof minQty === "number" && item.quantity < minQty

                return (
                  <Card
                    key={item.id}
                    className="border border-slate-200 bg-slate-50/60 shadow-none"
                  >
                    <CardContent className="space-y-1 p-3">
                      <p className="text-sm font-semibold text-slate-800">
                        {item.product?.name ?? "Producto sin nombre"}
                      </p>

                      {item.product?.clave && (
                        <p className="text-[11px] text-slate-500">
                          Clave: {item.product.clave}
                        </p>
                      )}

                      {/* Stock actual */}
                      <p className="text-xs text-slate-500">
                        Stock actual:{" "}
                        <span className="font-semibold text-slate-900">
                          {item.quantity}
                        </span>
                      </p>

                      {/* Mínimo / Máximo */}
                      {(minQty !== null || maxQty !== null) && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                          {minQty !== null && (
                            <span>
                              Mínimo:{" "}
                              <span className="font-semibold text-slate-900">
                                {minQty}
                              </span>
                            </span>
                          )}
                          {maxQty !== null && (
                            <span>
                              Máximo:{" "}
                              <span className="font-semibold text-slate-900">
                                {maxQty}
                              </span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Alerta si está debajo del mínimo */}
                      {isBelowMin && (
                        <p className="mt-1 inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                          Abajo del mínimo
                        </p>
                      )}

                      {item.expires_at && (
                        <p className="text-[11px] text-slate-400">
                          Caducidad:{" "}
                          {new Date(
                            item.expires_at,
                          ).toLocaleDateString("es-MX")}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ----------------- DIALOG: AGREGAR ----------------- */}
      <Dialog
        open={openAdd}
        onOpenChange={(open) => !addLoading && setOpenAdd(open)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              Agregar insumo al inventario
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!hospitalId && (
              <p className="rounded-md bg-red-50 px-2 py-1 text-xs text-red-600">
                Error: No se pudo identificar el hospital del usuario.
              </p>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Producto</Label>
              <Select
                value={addProductId}
                onValueChange={(value) => setAddProductId(value)}
                disabled={loadingProducts}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue
                    placeholder={
                      loadingProducts ? "Cargando..." : "Selecciona un producto"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name ?? "Sin nombre"}
                      {p.clave ? ` · ${p.clave}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Cantidad a agregar</Label>
              <Input
                type="number"
                min={1}
                value={addQuantity}
                onChange={(e) => setAddQuantity(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Fecha de caducidad (opcional)</Label>
              <Input
                type="date"
                value={addExpiresAt}
                onChange={(e) => setAddExpiresAt(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            {addError && (
              <p className="rounded-md bg-red-50 px-2 py-1 text-xs text-red-600">
                {addError}
              </p>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setOpenAdd(false)}
              disabled={addLoading}
            >
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={handleAddInventory}
              disabled={addLoading}
            >
              {addLoading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ----------------- DIALOG: REGISTRAR SALIDA ----------------- */}
      <Dialog
        open={openRemove}
        onOpenChange={(open) => !removeLoading && setOpenRemove(open)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              Registrar salida de inventario
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!hospitalId && (
              <p className="rounded-md bg-red-50 px-2 py-1 text-xs text-red-600">
                Error: No se pudo identificar el hospital del usuario.
              </p>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Producto</Label>
              <Select
                value={removeProductId}
                onValueChange={(value) => setRemoveProductId(value)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Selecciona un producto" />
                </SelectTrigger>
                <SelectContent>
                  {inventory.map((item) => (
                    <SelectItem key={item.product_id} value={item.product_id}>
                      {item.product?.name ?? "Sin nombre"}
                      {item.product?.clave ? ` · ${item.product.clave}` : ""}{" "}
                      (Stock: {item.quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Cantidad a retirar</Label>
              <Input
                type="number"
                min={1}
                value={removeQuantity}
                onChange={(e) => setRemoveQuantity(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            {removeError && (
              <p className="rounded-md bg-red-50 px-2 py-1 text-xs text-red-600">
                {removeError}
              </p>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setOpenRemove(false)}
              disabled={removeLoading}
            >
              Cancelar
            </Button>
            <Button
              className="bg-slate-900 text-white hover:bg-slate-800"
              onClick={handleRemoveInventory}
              disabled={removeLoading}
            >
              {removeLoading ? "Procesando..." : "Registrar salida"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
