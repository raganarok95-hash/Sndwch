// TUS PEDIDOS · LOS SELLOS (maqueta docs/maquetas/aprobadas/tus-pedidos-los-sellos.png,
// fuente v2.html #2), 2026-09-24. «Tus pedidos me suena bien» — y trae «Pedir lo mismo» arriba.
//
// Arriba, el último pedido con su foto y, pegado debajo, la franja para repetirlo. Debajo, un
// sello por cada vez que el cliente comió acá: se toca uno y se abre ese pedido.
//
// Lo que NO se copia de la maqueta, a propósito:
//   · el precio de «Pedir lo mismo» no es el total viejo del pedido. Es lo que ESE pedido cuesta
//     HOY (módulo de dinero, el mismo con el que cobra el servidor) más el envío a la dirección
//     guardada: los precios cambian y lo que salió de la carta no entra al carrito. Mostrar el
//     total de hace un mes sería prometer un número que el checkout no va a cobrar;
//   · «los jueves son 9 de los 14» solo aparece cuando es verdad y dice algo: un día que junta
//     al menos 3 sellos y la mitad de ellos.
import { html, nothing, render, type TemplateResult } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import type { ItemCarrito, PedidoDelCliente } from '../../../supabase/functions/_shared/dominio.ts';
import { dinero } from '../dinero';
import { legado } from '../legado';
import { diasPlural, direccionConMapa, imagenDe } from './comun';

// ── Fechas en hora de Lima (UTC−5 todo el año, sin horario de verano) ────────────────────
const LIMA_MS = 5 * 3600 * 1000;
const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

function enLima(iso: string | null): Date | null {
  const ms = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(ms) ? new Date(ms - LIMA_MS) : null;
}
/** «hoy», «ayer», «hace 4 días» o «el 17 de sep». */
export function cuandoFue(iso: string | null, ahoraMs: number = Date.now()): string {
  const d = enLima(iso);
  if (!d) return '';
  const hoy = new Date(ahoraMs - LIMA_MS);
  const dias = Math.round(
    (Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()) -
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())) /
      86_400_000,
  );
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias < 7) return `hace ${dias} días`;
  return `el ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]!.toLowerCase()}`;
}

// ── Datos derivados ───────────────────────────────────────────────────────────────────
/** Un sello por pedido pagado que no se canceló: las veces que de verdad comió acá. */
export function sellosDe(pedidos: PedidoDelCliente[]): PedidoDelCliente[] {
  return pedidos.filter((o) => o.payment_status === 'paid' && o.status !== 'CANCELADO');
}

/** «los jueves son 9 de los 14»: solo si un día junta al menos 3 sellos y la mitad de ellos. */
export function diaQueSeRepite(sellos: PedidoDelCliente[]): { dia: number; veces: number } | null {
  const cuenta = [0, 0, 0, 0, 0, 0, 0];
  for (const o of sellos) {
    const d = enLima(o.created_at);
    if (d) cuenta[d.getUTCDay()]!++;
  }
  let dia = 0;
  for (let i = 1; i < 7; i++) if (cuenta[i]! > cuenta[dia]!) dia = i;
  const veces = cuenta[dia]!;
  return veces >= 3 && veces * 2 >= sellos.length ? { dia, veces } : null;
}

/** «The Chicago 30CM + The Midnight», con los nombres de la carta; si algo ya no está en ella,
 *  el resumen que se guardó con el pedido. */
function nombreDe(o: PedidoDelCliente): string {
  const items = o.items || [];
  const partes = items.map((it) => {
    const n = legado.nombreDeLinea(it);
    return n && it.qty > 1 ? `${n} ×${it.qty}` : n;
  });
  return items.length && partes.every(Boolean) ? partes.join(' + ') : o.summary || 'Tu pedido';
}

/** Lo que se puede volver a pedir de ese pedido, y cuánto sale HOY con el envío a su dirección. */
function repetir(o: PedidoDelCliente): { items: ItemCarrito[]; precio: number } | null {
  if (o.payment_status !== 'paid') return null;
  const items = (o.items || []).filter((it) => legado.pedidos.repetible(it));
  if (!items.length) return null;
  const comida = dinero.desglose(items, { cuandoMs: Date.now() }).total;
  const envio = legado.envioA(direccionConMapa());
  return { items: o.items || [], precio: comida + (envio ?? 0) };
}

function lineaDelUltimo(o: PedidoDelCliente): string {
  const e = legado.pedidos.estado(o.status);
  const cuando = o.status === 'ENTREGADO' && o.delivered_at ? 'Llegó ' + legado.horaLima(Date.parse(o.delivered_at)) : e.texto;
  return `${cuando} · ${legado.soles(o.total)}`;
}

// ── Vista ─────────────────────────────────────────────────────────────────────────────
function vista(): TemplateResult {
  const volver = () => legado.irA('p_home');
  const pedidos = legado.pedidos.lista;
  if (legado.pedidos.cargando && !pedidos.length) {
    return html`<div class="mtp"><button class="sal" @click=${volver} aria-label="Volver">←</button></div>`;
  }
  if (!pedidos.length) {
    return html`${unsafeHTML(legado.htmlCabecera('TUS PEDIDOS', "sndScreen='p_home';render()"))}
      <div style="flex:1;padding:20px 20px 140px;overflow-y:auto" class="fi">
        ${unsafeHTML(legado.htmlVacio('Sin pedidos', 'Cuando hagas el primero, va a aparecer acá con su estado en vivo.', 'mira'))}
      </div>
      ${unsafeHTML(legado.htmlNav())}`;
  }
  const ultimo = pedidos[0]!;
  const e = legado.pedidos.estado(ultimo.status);
  const foto = imagenDe(ultimo.items || []);
  const rep = repetir(ultimo);
  const sellos = sellosDe(pedidos);
  const veces = Math.max(legado.pedidosDelCliente ?? 0, sellos.length);
  const seRepite = diaQueSeRepite(sellos);
  return html`<div class="mtp fi">
    <button class="ult" @click=${() => legado.pedidos.abrir(ultimo.id)}>
      ${foto ? html`<img src=${foto} alt="" />` : nothing}
      <div class="v"></div>
      <div class="tx">
        <em>${e.terminado ? 'El último · ' + cuandoFue(ultimo.created_at) : 'En curso · ' + e.texto}</em>
        <b>${nombreDe(ultimo)}</b>
        <s>${lineaDelUltimo(ultimo)}</s>
      </div>
    </button>
    <button class="sal" @click=${volver} aria-label="Volver">←</button>
    ${rep
      ? html`<button class="rep" @click=${() => legado.carrito.cargar(rep.items)}>
          <span>Pedir lo mismo</span><b>${legado.soles(rep.precio)}</b>
        </button>`
      : nothing}
    <div class="cuerpo">
      ${sellos.length
        ? html`<div class="cont"><em>Has comido acá</em><b>${veces} ${veces === 1 ? 'vez' : 'veces'}</b></div>
            <div class="sellos">
              ${sellos.map((o, i) => {
                const d = enLima(o.created_at);
                return html`<button class=${i === 0 ? 'se hoy' : 'se'} @click=${() => legado.pedidos.abrir(o.id)}
                  aria-label=${'Abrir el pedido ' + o.ref}>
                  <s>${d ? MESES[d.getUTCMonth()] : ''}</s><n>${d ? String(d.getUTCDate()).padStart(2, '0') : ''}</n>
                </button>`;
              })}
            </div>
            <p class="pie">
              Toca un sello y se abre ese pedido.${seRepite
                ? html`<br />Los ${diasPlural(seRepite.dia)} son ${seRepite.veces} de los ${sellos.length} — por algo será.`
                : nothing}
            </p>`
        : html`<p class="pie">Cuando llegue tu primer pedido, acá va a quedar su sello.</p>`}
    </div>
  </div>`;
}

export const pantallaPedidos = {
  pintar(el: HTMLElement): void {
    render(vista(), el);
  },
};

