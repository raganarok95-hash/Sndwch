// SND//WCH — EMBAJADORES PAGADOS POR RESULTADO (2026-10-16)
//
// Dueño: «Sí, amé los embajadores» (docs/META_Y_PRESENCIAL.md). Gente de Trujillo con su propio
// enlace (`?src=emb-<codigo>`) que lo comparte donde ya está: su salón, su oficina, su equipo. Lo
// presencial lo hacen ellos y se les paga solo por clientes nuevos que reciben su pedido.
//
// Lo que se le debe a cada uno NO se guarda: se calcula cada vez de los pedidos con
// `comisionesDeEmbajadores` (_shared/dinero.ts, con su prueba en tests-api/embajadores.test.ts).
// Aquí solo viven quiénes son (`embajadores`) y lo que ya se les pagó (`embajador_pagos`).
import type { Entrada } from "../../_shared/contrato.ts";
import { comisionesDeEmbajadores, origenDeEmbajador, REGLAS, type PedidoDeComision } from "../../_shared/dinero.ts";
import { leer, sbInsert } from "../db.ts";
import { ApiError } from "../types.ts";
import { requireAdmin } from "../session.ts";
import { logAdminAction } from "../logging.ts";
import { telefonoDeAdmin } from "./admin.ts";

const ENLACE_BASE = "https://sndwch.app/?src=";

/** El código del enlace, sacado del nombre: «Ana María» → «ana-maria». Si ya existe, «ana-maria-2». */
export function codigoDeEmbajador(nombre: string, usados: readonly string[]): string {
  const base = nombre.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24) || "emb";
  const ocupados = new Set(usados);
  if (!ocupados.has(base)) return base;
  for (let i = 2; ; i++) if (!ocupados.has(`${base}-${i}`)) return `${base}-${i}`;
}

/** Los pedidos que deciden las comisiones: los que llegaron con un enlace de embajador y TODOS
 *  los de esos mismos teléfonos (para saber si el cliente era nuevo y cuál fue su segundo). */
async function pedidosDeComision(): Promise<PedidoDeComision[]> {
  const cols = ["customer_phone", "contact_phone", "origen", "created_at", "payment_status", "status", "delivered_at"] as const;
  const conEnlace = await leer("orders", cols, "origen=ilike.emb-*&limit=5000");
  const telefonos = [...new Set(conEnlace.map((o) => o.customer_phone || o.contact_phone).filter((t): t is string => !!t))];
  if (!telefonos.length) return [];
  const lista = telefonos.map((t) => `"${t.replace(/"/g, "")}"`).join(",");
  const todos = await leer("orders", cols, `or=(customer_phone.in.(${lista}),contact_phone.in.(${lista}))&limit=20000`);
  return todos.map((o) => ({
    telefono: o.customer_phone || o.contact_phone,
    origen: o.origen,
    creado: o.created_at,
    pagado: o.payment_status === "paid",
    entregado: !!o.delivered_at,
    cancelado: o.status === "CANCELADO",
  }));
}

async function estadoDeEmbajadores() {
  const [embajadores, pagos, pedidos] = await Promise.all([
    leer("embajadores", ["id", "nombre", "codigo", "telefono", "activo", "created_at"] as const, "order=created_at.asc"),
    leer("embajador_pagos", ["embajador_id", "monto", "created_at"] as const, "order=created_at.desc"),
    pedidosDeComision(),
  ]);
  const comisiones = comisionesDeEmbajadores(
    pedidos,
    embajadores,
    pagos.map((p) => ({ embajadorId: p.embajador_id, monto: Number(p.monto) })),
  );
  return { embajadores, pagos, comisiones };
}

export async function actAdminEmbajadores(b: Entrada<"admin-embajadores"> & { _ip?: string }) {
  await requireAdmin(b.token);
  const { embajadores, pagos, comisiones } = await estadoDeEmbajadores();
  const lista = embajadores.map((e) => {
    const c = comisiones.find((x) => x.embajadorId === e.id)!;
    const ultimoPago = pagos.find((p) => p.embajador_id === e.id);
    return {
      id: e.id, nombre: e.nombre, telefono: e.telefono, activo: e.activo,
      enlace: ENLACE_BASE + origenDeEmbajador(e.codigo),
      invitados: c.invitados, primeros: c.primeros, segundos: c.segundos,
      ganado: c.ganado, pagado: c.pagado, debe: c.debe,
      ultimoPago: ultimoPago ? ultimoPago.created_at : null,
    };
  });
  return {
    porPrimero: REGLAS.embajadorPorPrimero,
    porSegundo: REGLAS.embajadorPorSegundo,
    embajadores: lista,
    totalDebe: Math.round(lista.reduce((a, e) => a + e.debe * 100, 0)) / 100,
  };
}

export async function actAdminEmbajadorCrear(b: Entrada<"admin-embajador-crear"> & { _ip?: string }) {
  const s = await requireAdmin(b.token);
  const nombre = b.nombre.trim().replace(/\s+/g, " ");
  if (nombre.length < 2) throw new ApiError("Escribe el nombre del embajador.", 400);
  const telefono = telefonoDeAdmin(b.telefono);
  const existentes = await leer("embajadores", ["codigo", "telefono"] as const);
  if (existentes.some((e) => e.telefono === telefono)) throw new ApiError("Ese celular ya es de un embajador.", 409);
  const codigo = codigoDeEmbajador(nombre, existentes.map((e) => e.codigo));
  const rows = await sbInsert("embajadores", { nombre, codigo, telefono });
  await logAdminAction(s.phone, "embajador-crear", codigo, { nombre });
  return { success: true, id: rows[0]?.id, enlace: ENLACE_BASE + origenDeEmbajador(codigo) };
}

// Se registra lo que se le DEBE en ese momento, calculado aquí y no enviado por el panel: un doble
// toque o un número escrito a mano no pueden pagar de más. Si no se le debe nada, no se registra.
export async function actAdminEmbajadorPagar(b: Entrada<"admin-embajador-pagar"> & { _ip?: string }) {
  const s = await requireAdmin(b.token);
  const id = b.id;
  const { embajadores, comisiones } = await estadoDeEmbajadores();
  const e = embajadores.find((x) => x.id === id);
  if (!e) throw new ApiError("Embajador no encontrado.", 404);
  const debe = comisiones.find((x) => x.embajadorId === id)!.debe;
  if (!(debe > 0)) throw new ApiError("No se le debe nada ahora.", 400);
  await sbInsert("embajador_pagos", { embajador_id: id, monto: debe, pagado_por: s.phone });
  await logAdminAction(s.phone, "embajador-pagar", e.codigo, { monto: debe });
  return { success: true, monto: debe };
}
