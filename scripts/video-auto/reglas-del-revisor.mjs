// SND//WCH — video-auto/reglas-del-revisor: qué pieza del Productor sale y cuál no.
// Función pura (sin red): la llama revisar.mjs con lo que leyó de producción y la prueba
// tests-api/revisor-de-marketing.test.ts. Detalle y porqués: docs/marketing/roles/revisor.md.
import { precio } from './produccion.mjs';

// La primera publicación pública. Antes de esta fecha nada sale: el video dice «Pídelo hoy».
// (`business_launched` ya está prendido desde antes de abrir, así que no sirve para esto.)
export const APERTURA = '2026-10-13';

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
