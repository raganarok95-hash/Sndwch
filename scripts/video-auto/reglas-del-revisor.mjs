// SND//WCH — video-auto/reglas-del-revisor: qué pieza del Productor sale y cuál no.
// Función pura (sin red): la llama revisar.mjs con lo que leyó de producción y la prueba
// tests-api/revisor-de-marketing.test.ts. Detalle y porqués: docs/marketing/roles/revisor.md.
import { precio } from './produccion.mjs';

// La primera publicación pública. Antes de esta fecha nada sale: el video dice «Pídelo hoy».
// (`business_launched` ya está prendido desde antes de abrir, así que no sirve para esto.)
// El dueño la movió del 13 al 20 de octubre el 2026-10-08 («retrasamos la apertura una semana»).
// Todo texto que nombra el día de apertura la lee de aquí (lanzamiento.mjs, historias.mjs).
export const APERTURA = '2026-10-20';

/**
 * @param {object} c
 * @param {any[]} c.piezas       borradores pendientes del Productor (id, src, caption_text, datos, created_at)
 * @param {string} c.hoy         fecha de Lima, AAAA-MM-DD
 * @param {boolean} c.abreHoy    el horario de la base dice que hoy se atiende
 * @param {any} c.cat            la respuesta de get-catalog (sigItems, inventory)
 * @param {Set<string>} c.conVideo  src cuyo video existe en el bucket
 * @param {Set<string>} c.recientes Signatures publicados o programados en los últimos 2 días
 * @returns {{id:string, src:string, veredicto:'aprobada'|'bloqueada'|'espera', motivo?:string}[]}
 */
export function decidir({ piezas, hoy, abreHoy, cat, conVideo, recientes }) {
  if (hoy < APERTURA || !abreHoy) {
    const motivo = hoy < APERTURA ? `antes de abrir (${APERTURA})` : 'hoy no se atiende';
    return piezas.map((p) => ({ id: p.id, src: p.src, veredicto: 'espera', motivo }));
  }
  const items = cat?.sigItems || {};
  const inv = cat?.inventory || {};
  const agotado = (code) => !!code && inv[code]?.inStock === false;
  const problema = (p) => {
    const sig = p.datos?.sig;
    const it = items[sig];
    if (!it) return `carta: ${sig} ya no está en la carta`;
    if (it.active === false) return `carta: ${sig} está inactivo`;
    if (agotado(sig) || agotado(it.prot)) return `stock: ${sig} está agotado hoy`;
    if (Number(it.p15) !== Number(p.datos.p15) || Number(it.p30) !== Number(p.datos.p30)) {
      return `precio: el video dice ${precio(p.datos.p15)}/${precio(p.datos.p30)} y la app cobra ${precio(it.p15)}/${precio(it.p30)}`;
    }
    const txt = String(p.caption_text || '');
    if (!txt.includes(precio(it.p15)) || !txt.includes(precio(it.p30))) return 'texto: no trae el precio vigente';
    if (!txt.includes(`?src=${p.src}`)) return 'texto: el enlace no lleva su src';
    if (!conVideo.has(p.src)) return 'video: no está en el bucket';
    if (recientes.has(sig)) return `repetida: ${sig} ya salió en los últimos 2 días`;
    return null;
  };
  // La más reciente primero: si se acumularon (antes de abrir, el lunes), sale solo una.
  const orden = [...piezas].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  let yaSalio = false;
  return orden.map((p) => {
    const m = problema(p);
    if (m) return { id: p.id, src: p.src, veredicto: 'bloqueada', motivo: m };
    if (yaSalio) return { id: p.id, src: p.src, veredicto: 'bloqueada', motivo: 'acumulada: hoy ya sale otra' };
    yaSalio = true;
    return { id: p.id, src: p.src, veredicto: 'aprobada' };
  });
}

// La hora en que sale el video del día: el arranque del almuerzo. La decide el cron de Supabase
// con `publicar_desde`, no la hora en que corrió el Revisor (GitHub la atrasa de 5 a 9 horas).
// La hora del video del día (dueño, 2026-10-08: «sí me parece bien lo del video»). Sale a las 18:00,
// porque en Perú el pico de pedidos de delivery es la cena. Las dos primeras semanas abiertas
// alterna con las 12:00: día por medio desde APERTURA, así que cada día de la semana prueba las dos
// horas. Cada video lleva su `?src=` y su franja queda en `datos.franja` (revisar.mjs). Desde la
// tercera semana se queda la hora que haya traído más pedidos.
export const HORA_DEL_VIDEO = '18:00';
export const HORA_ALTERNA = '12:00';
export const DIAS_DE_PRUEBA = 14;
export const ULTIMA_HORA = '20:00'; // pasado esto, un video de HOY ya no sale: se pierde ese día

/** La franja del video de `dia` (AAAA-MM-DD, Lima): 12:00 o 18:00. */
export function horaDelVideo(dia) {
  const n = Math.round((Date.parse(`${dia}T12:00:00Z`) - Date.parse(`${APERTURA}T12:00:00Z`)) / 864e5);
  return n >= 0 && n < DIAS_DE_PRUEBA && n % 2 === 0 ? HORA_ALTERNA : HORA_DEL_VIDEO;
}

/**
 * Desde cuándo puede publicarse una pieza aprobada para `dia` (ISO), o null si para hoy ya es tarde.
 * @param {string} dia       AAAA-MM-DD (Lima)
 * @param {string} hoy       AAAA-MM-DD (Lima)
 * @param {Date}   ahora     instante actual
 */
export function horaDePublicar(dia, hoy, ahora) {
  const a = (hhmm) => new Date(`${dia}T${hhmm}:00-05:00`);
  const hora = horaDelVideo(dia);
  if (dia > hoy) return a(hora).toISOString();
  if (ahora >= a(ULTIMA_HORA)) return null;
  return new Date(Math.max(a(hora).getTime(), ahora.getTime())).toISOString();
}
