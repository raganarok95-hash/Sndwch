// SND//WCH — api / actions / errores
//
// LOS ERRORES DEL TELÉFONO DEL CLIENTE LLEGAN AL DUEÑO (2026-09-24).
//
// Hasta hoy, lo que se rompía en el celular de un cliente —una pantalla que revienta, la carta
// que no se aplica— quedaba en una consola que nadie mira. La carga del catálogo tenía 99
// líneas dentro de un `catch(e){}` vacío: un error de código dejaba al cliente con precios que
// el servidor rechaza al pagar, y nadie se enteraba nunca.
//
// Esto lo anota en `debug_logs` con `stage: "exception"` y `source: "cliente"`, que es lo que el
// resumen diario ya cuenta como «error técnico». Es una puerta abierta (el error puede pasar
// antes de iniciar sesión), así que todo se acota: largo de cada campo y cantidad por IP.
import { sbInsert, rpc } from "../db.ts";
import { ApiError } from "../types.ts";

const MAX_POR_IP = 20;
const VENTANA_MIN = 10;

export type ErrorDelCliente = { stage: "exception"; donde: string; mensaje: string; pila: string; pantalla: string; version: string };

/** Lo que se guarda, recortado. null si no trae ni dónde ni qué pasó: eso no ayuda a nadie. */
export function errorDelCliente(b: Record<string, unknown>): ErrorDelCliente | null {
  const txt = (v: unknown, n: number) => String(v ?? "").replace(/[\u0000-\u001f]+/g, " ").trim().slice(0, n);
  const donde = txt(b.donde, 60);
  const mensaje = txt(b.mensaje, 300);
  if (!donde || !mensaje) return null;
  return { stage: "exception", donde, mensaje, pila: txt(b.pila, 800), pantalla: txt(b.pantalla, 40), version: txt(b.version, 40) };
}

export async function actReportClientError(b: any) {
  const e = errorDelCliente(b || {});
  if (!e) throw new ApiError("Falta el error.");
  // Un teléfono con un bucle de errores, o alguien llenando la tabla a propósito, no puede
  // esconder los demás: se aceptan unos pocos por IP y el resto se descarta sin error.
  const permitido = await rpc("check_rate_limit", { p_key: "client-error:" + String(b._ip || "unknown"), p_limit: MAX_POR_IP, p_window_minutes: VENTANA_MIN });
  if (!permitido) return { success: true, descartado: true };
  await sbInsert("debug_logs", { source: "cliente", detail: e });
  return { success: true };
}
