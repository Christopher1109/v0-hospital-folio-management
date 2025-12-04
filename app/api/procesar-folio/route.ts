import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type Accion = "aceptar" | "rechazar"

interface ItemPayload {
  itemId: string
  insumoId: string
  cantidadSolicitada: number
  cantidadRecibida: number
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const folioId: string = body.folioId
    const hospitalId: string = body.hospitalId
    const accion: Accion = body.accion
    const items: ItemPayload[] = body.items || []

    if (!folioId || !hospitalId || !accion || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Parámetros inválidos." },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    // Si es rechazo, solo marcamos el folio y dejamos inventario igual
    if (accion === "rechazar") {
      const { error: folioError } = await supabase
        .from("folios")
        .update({
          status: "rechazado",
          updated_at: new Date().toISOString(),
        })
        .eq("id", folioId)

      if (folioError) {
        console.error("[procesar-folio] Error actualizando folio:", folioError)
        return NextResponse.json(
          { error: "No se pudo marcar el folio como rechazado." },
          { status: 500 },
        )
      }

      // Opcional: actualizar cantidad_entregada = 0 en items
      const { error: itemsError } = await supabase
        .from("folio_items")
        .update({ cantidad_entregada: 0 })
        .eq("folio_id", folioId)

      if (itemsError) {
        console.error(
          "[procesar-folio] Error actualizando items a 0:",
          itemsError,
        )
      }

      return NextResponse.json({ ok: true, status: "rechazado" })
    }

    // Si llega aquí, es "aceptar": actualizar inventario + marcar folio
    let esCompleto = true

    for (const item of items) {
      const recibida = Math.max(0, Math.floor(item.cantidadRecibida || 0))

      if (recibida !== item.cantidadSolicitada) {
        esCompleto = false
      }

      // 1) Guardar cantidad_entregada en folio_items
      const { error: itemUpdateError } = await supabase
        .from("folio_items")
        .update({ cantidad_entregada: recibida })
        .eq("id", item.itemId)

      if (itemUpdateError) {
        console.error(
          "[procesar-folio] Error actualizando folio_items:",
          itemUpdateError,
        )
        return NextResponse.json(
          { error: "No se pudo actualizar la información del folio." },
          { status: 500 },
        )
      }

      // 2) Actualizar o crear registro en inventario_hospital
      //    (stock_actual = stock_actual + recibida)
      const { data: invRow, error: invSelectError } = await supabase
        .from("inventario_hospital")
        .select("id, stock_actual")
        .eq("hospital_id", hospitalId)
        .eq("insumo_id", item.insumoId)
        .maybeSingle()

      if (invSelectError) {
        console.error(
          "[procesar-folio] Error obteniendo inventario:",
          invSelectError,
        )
        return NextResponse.json(
          { error: "No se pudo leer el inventario." },
          { status: 500 },
        )
      }

      if (invRow) {
        const nuevoStock = (invRow.stock_actual || 0) + recibida

        const { error: invUpdateError } = await supabase
          .from("inventario_hospital")
          .update({ stock_actual: nuevoStock })
          .eq("id", invRow.id)

        if (invUpdateError) {
          console.error(
            "[procesar-folio] Error actualizando stock:",
            invUpdateError,
          )
          return NextResponse.json(
            { error: "No se pudo actualizar el inventario." },
            { status: 500 },
          )
        }
      } else if (recibida > 0) {
        const { error: invInsertError } = await supabase
          .from("inventario_hospital")
          .insert({
            hospital_id: hospitalId,
            insumo_id: item.insumoId,
            stock_actual: recibida,
          })

        if (invInsertError) {
          console.error(
            "[procesar-folio] Error creando inventario:",
            invInsertError,
          )
          return NextResponse.json(
            { error: "No se pudo crear el registro de inventario." },
            { status: 500 },
          )
        }
      }
    }

    // 3) Actualizar estado del folio
    const nuevoStatus = esCompleto ? "entregado" : "entregado_parcial"

    const { error: folioStatusError } = await supabase
      .from("folios")
      .update({
        status: nuevoStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", folioId)

    if (folioStatusError) {
      console.error(
        "[procesar-folio] Error actualizando estado de folio:",
        folioStatusError,
      )
      return NextResponse.json(
        { error: "No se pudo actualizar el estado del folio." },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true, status: nuevoStatus })
  } catch (error: any) {
    console.error("[procesar-folio] Error inesperado:", error)
    return NextResponse.json(
      { error: "Error interno al procesar el folio." },
      { status: 500 },
    )
  }
}
