// TU PEDIDO FIJO (maqueta docs/maquetas/aprobadas/tu-pedido-fijo.png), la primera pantalla de
// la base nueva (2026-09-24).
//
// Hace exactamente lo mismo que la versión vieja de 07-*, y la cubren las mismas pruebas. Lo
// que cambia es CÓMO está construida:
//   · cada botón llama a su función de verdad (`@click=${() => pedirAhora(f)}`): si la función
//     cambia de nombre, no compila; el id viaja con su tipo, sin pasar por el HTML como texto;
//   · lit-html escapa todo lo que se interpola: no hay un `esc()` que olvidar;
//   · repintar actualiza solo lo que cambió;
//   · el estado de la pantalla es UN objeto de este módulo, no seis variables globales.
//
// ⚠ NO SE MANDA NI SE COBRA SOLO, Y LA PANTALLA LO DICE (decisión del dueño, 2026-09-23). La
// maqueta decía «LO MANDAMOS SOLO»: es lo único de ella que no se copia, porque es falso. Lo que
// sí promete es el LUGAR GUARDADO (servidor: franja.ts).
import { html, nothing, render, type TemplateResult } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { legado, type DireccionGuardada, type ItemCarrito } from '../legado';

// Lo que devuelve `recurring-list`. Pasa al contrato compartido en el paso 2.
type EstadoDeFranja =
  | 'apartada' | 'faltan-confirmaciones' | 'aun-no-toca' | 'soltada' | 'saltada' | 'usada' | 'cerrado' | 'inactivo';
type Fijo = {
  id: string;
  items: ItemCarrito[];
  weekday: number;
  slot: string;
  addressId: number | null;
  label: string;
  precio: number | null;
  veces: number;
  horaHabitual: string | null;
  vez: string | null;
  estado: EstadoDeFranja;
  apartada: boolean;
  sueltaA: string | null;
  confirmados: number;
};
type Sugerido = {
  items: ItemCarrito[];
  label: string;
  precio: number | null;
  veces: number;
  horaHabitual: string | null;
  weekday: number | null;
  slot: string | null;
};
type RespuestaLista = { recurring?: Fijo[]; sugerido?: Sugerido | null; desdeConfirmados?: number };

type Estado = {
  cargando: boolean;
  fijos: Fijo[];
  sugerido: Sugerido | null;
  desdeConfirmados: number | null;
  seleccionado: string | null;
};
let estado: Estado = { cargando: false, fijos: [], sugerido: null, desdeConfirmados: null, seleccionado: null };
let contenedor: HTMLElement | null = null;

function cambiar(parcial: Partial<Estado>): void {
  estado = { ...estado, ...parcial };
  if (contenedor && contenedor.isConnected) render(vista(), contenedor);
}

// ── Texto ─────────────────────────────────────────────────────────────────────────────
function diaMinuscula(w: number): string {
  return (legado.diasSemana[w] || '').toLowerCase();
}
function diasPlural(w: number): string {
  const d = diaMinuscula(w);
  return /s$/.test(d) ? d : d + 's';
}
/** "19:30" → "7:30 p.m." y "19:00" → "7 p.m.", como horaLima. */
export function hhmmATexto(hhmm: string | null): string {
  const [h, m] = String(hhmm || '').split(':').map(Number);
  if (h === undefined || m === undefined || !Number.isFinite(h) || !Number.isFinite(m)) return '';
  return (h % 12 || 12) + (m ? ':' + String(m).padStart(2, '0') : '') + (h < 12 ? ' a.m.' : ' p.m.');
}

// ── Datos derivados ───────────────────────────────────────────────────────────────────
function actual(): Fijo | null {
  return estado.fijos.find((f) => f.id === estado.seleccionado) || estado.fijos[0] || null;
}
/** La dirección guardada con el fijo, o la primera marcada en el mapa. */
function direccionDe(f: Fijo | null): DireccionGuardada | null {
  const dirs = legado.direcciones;
  const suya = f && f.addressId != null ? dirs.find((d) => Number(d.id) === Number(f.addressId)) : undefined;
  return suya || dirs.find((d) => typeof d.lat === 'number' && typeof d.lon === 'number') || null;
}
/** «Te sale»: la comida a precio de hoy más el envío a SU dirección, con la tarifa del checkout. */
function totalDe(precio: number | null, f: Fijo | null): number | null {
  if (precio == null) return null;
  const envio = legado.envioA(direccionDe(f));
  return envio == null ? null : precio + envio;
}
function imagenDe(items: ItemCarrito[]): string {
  for (const it of items) {
    if (it.sigId) {
      const img = legado.imagenSignature(it.sigId);
      if (img) return img;
    }
    if (it.type !== 'side' && it.prot) {
      const img = legado.imagenProteina(it.prot);
      if (img) return img;
    }
  }
  return '';
}
function inicioDeHoraIso(ms: number): string {
  const d = new Date(ms);
  d.setMinutes(0, 0, 0);
  return d.toISOString();
}

// ── Acciones ──────────────────────────────────────────────────────────────────────────
export async function abrir(id?: string): Promise<void> {
  cambiar({ cargando: true });
  legado.irA('p_recurring');
  try {
    // Las direcciones hacen falta para «Te sale» y para dejar el pedido con la suya: quien
    // llega por el aviso no pasó por el perfil.
    const [lista, dirs] = await Promise.all([
      legado.api<RespuestaLista>('recurring-list', { token: legado.token }),
      legado.direcciones.length
        ? Promise.resolve(null)
        : legado.api<{ addresses?: DireccionGuardada[] }>('addresses-list', { token: legado.token }).catch(() => null),
    ]);
    if (dirs && Array.isArray(dirs.addresses)) legado.direcciones = dirs.addresses;
    const fijos = Array.isArray(lista.recurring) ? lista.recurring : [];
    cambiar({
      cargando: false,
      fijos,
      sugerido: lista.sugerido || null,
      desdeConfirmados: typeof lista.desdeConfirmados === 'number' ? lista.desdeConfirmados : null,
      seleccionado: id && fijos.some((f) => f.id === id) ? id : fijos[0]?.id ?? null,
    });
  } catch {
    cambiar({ cargando: false, fijos: [], sugerido: null });
  }
}

/** Deja el carrito listo para pagar: los ítems, SU dirección, y la hora del fijo si toca hoy o
 *  mañana y hay lugar. El id del fijo viaja al pagar (metaAttribution) para gastar su lugar. */
function pedirAhora(f: Fijo): void {
  const franja = legado.enlace.fijo === f.id && legado.enlace.franja ? legado.enlace.franja : f.slot;
  if (!legado.carrito.cargar(f.items)) return;
  const vez = f.vez ? Date.parse(f.vez) : NaN;
  legado.carrito.marcarOrigenFijo(f.id, f.apartada && Number.isFinite(vez) ? inicioDeHoraIso(vez) : null);
  const dir = direccionDe(f);
  if (dir) legado.carrito.elegirDireccion(dir.id);
  if (Number.isFinite(vez)) {
    const d = new Date(vez).toDateString();
    const man = new Date();
    man.setDate(man.getDate() + 1);
    const dia = d === new Date().toDateString() ? 'today' : d === man.toDateString() ? 'tomorrow' : null;
    if (dia && legado.carrito.franjasLibres(dia).includes(franja)) legado.carrito.programar(dia, franja);
  }
  legado.carrito.repintar();
}

function pedirSugerido(s: Sugerido): void {
  legado.carrito.cargar(s.items);
}

async function dejarFijo(s: Sugerido): Promise<void> {
  if (s.weekday == null || !s.slot) return;
  const dir = direccionDe(null);
  try {
    await legado.api('recurring-add', { token: legado.token, items: s.items, weekday: s.weekday, slot: s.slot, addressId: dir ? dir.id : null });
    legado.aviso('Listo: fijo los ' + diasPlural(s.weekday) + ' a las ' + hhmmATexto(s.slot) + '. Te avisamos antes.');
    await abrir();
  } catch (e) {
    legado.aviso('No se pudo guardar: ' + (e as Error).message);
  }
}

/** «Esta semana no» suelta el lugar de la próxima vez sin quitar el fijo; «Mejor sí va» lo vuelve a poner. */
async function saltar(f: Fijo, deshacer: boolean): Promise<void> {
  try {
    await legado.api('recurring-skip', { token: legado.token, id: f.id, deshacer });
  } catch (e) {
    legado.aviso('No se pudo: ' + (e as Error).message);
    return;
  }
  legado.aviso(deshacer ? 'Listo, esta semana sí va.' : 'Listo: esta semana no va. La próxima te avisamos.');
  await abrir(f.id);
}

async function quitar(f: Fijo): Promise<void> {
  if (!(await legado.confirmar('¿Quitar este pedido fijo? Dejaremos de avisarte.'))) return;
  // Optimista: se quita al instante y vuelve si el servidor falla.
  const antes = estado.fijos;
  const quedan = antes.filter((x) => x.id !== f.id);
  cambiar({ fijos: quedan, seleccionado: estado.seleccionado === f.id ? quedan[0]?.id ?? null : estado.seleccionado });
  try {
    await legado.api('recurring-delete', { token: legado.token, id: f.id });
  } catch (e) {
    cambiar({ fijos: antes });
    legado.aviso('No se pudo quitar: ' + (e as Error).message);
  }
}

// ── Vista ─────────────────────────────────────────────────────────────────────────────
const NUNCA = ' No te cobramos sin que confirmes.';

function caja(f: Fijo | null, s: Sugerido | null): TemplateResult {
  if (!f && s) {
    if (s.weekday == null || !s.slot) {
      return html`<div class="prog"><b>¿Lo dejamos fijo?</b><s>Guárdalo desde el carrito eligiendo el día y la hora. Nada se manda solo.${NUNCA}</s></div>`;
    }
    const wd = s.weekday;
    return html`<button class="prog" @click=${() => dejarFijo(s)}>
      <b>¿Lo dejamos fijo los ${diasPlural(wd)}?</b>
      <s>Te avisamos antes de la hora de siempre y confirmas en un toque. Nada se manda solo.${NUNCA} Se quita desde acá, sin llamar a nadie.</s>
    </button>`;
  }
  if (!f) return html``;
  const dia = diaMinuscula(f.weekday);
  const hora = hhmmATexto(f.slot);
  let titulo: string;
  let texto: string;
  switch (f.estado) {
    case 'apartada':
      titulo = `Tu ${dia} de las ${hora} está guardado`;
      // horaLima ya termina en «p.m.»: un punto más quedaría «6 p.m..».
      texto = `Hasta las ${f.sueltaA ? legado.horaLima(Date.parse(f.sueltaA)) : ''}; si no lo confirmas, se suelta solo para otro.`;
      break;
    case 'soltada':
      titulo = 'Tu lugar de hoy ya se soltó';
      texto = 'Si todavía hay lugar a esa hora, puedes pedirlo igual.';
      break;
    case 'saltada':
      titulo = 'Esta semana no va';
      texto = `El ${dia} que viene te avisamos otra vez.`;
      break;
    case 'usada':
      titulo = 'Ya está pedido';
      texto = `El ${dia} que viene te avisamos otra vez.`;
      break;
    case 'cerrado':
      titulo = `Ese ${dia} no atendemos a las ${hora}`;
      texto = 'Quítalo y guárdalo de nuevo con otra hora.';
      break;
    case 'faltan-confirmaciones':
      titulo = `Fijo los ${diasPlural(f.weekday)} · ${hora}`;
      texto =
        'Te avisamos una hora antes y confirmas en un toque.' +
        (estado.desdeConfirmados
          ? ` Cuando lo hayas pedido ${estado.desdeConfirmados} veces desde acá, te guardamos el lugar${f.confirmados ? ` (vas ${f.confirmados})` : ''}.`
          : '');
      break;
    default:
      titulo = `Fijo los ${diasPlural(f.weekday)} · ${hora}`;
      texto = 'Desde el día antes te guardamos el lugar, y te avisamos antes de soltarlo.';
  }
  return html`<div class="prog">
    <b>${titulo}</b><s>${texto + NUNCA}</s>
    <div class="acc">
      ${f.estado === 'saltada'
        ? html`<button @click=${() => saltar(f, true)}>Mejor sí va</button>`
        : f.estado !== 'usada'
          ? html`<button @click=${() => saltar(f, false)}>Esta semana no</button>`
          : nothing}
      <button @click=${() => quitar(f)}>Quitar el fijo</button>
    </div>
  </div>`;
}

function otros(f: Fijo | null): TemplateResult | typeof nothing {
  if (!f) return nothing;
  const resto = estado.fijos.filter((x) => x.id !== f.id);
  if (!resto.length) return nothing;
  return html`<div class="otros"><em>Otros guardados</em>
    ${resto.map((x) => {
      const t = totalDe(x.precio, x);
      return html`<button class="o" @click=${() => cambiar({ seleccionado: x.id })}>
        <b>${x.label}</b><p>${t != null ? legado.soles(t) : diasPlural(x.weekday) + ' · ' + hhmmATexto(x.slot)}</p>
      </button>`;
    })}
  </div>`;
}

function vista(): TemplateResult {
  const volver = () => legado.irA('p_home');
  if (estado.cargando) return html`<div class="mfj"></div>`;
  const f = actual();
  const s = f ? null : estado.sugerido;
  if (!f && !s) {
    return html`${unsafeHTML(legado.htmlCabecera('TU PEDIDO FIJO', "sndScreen='p_home';render()"))}
      <div style="flex:1;padding:20px 20px 140px;overflow-y:auto" class="fi">
        ${unsafeHTML(legado.htmlVacio('Sin pedido fijo', 'Cuando repitas un pedido te ofrecemos dejarlo fijo, o guárdalo desde el carrito.', 'mira'))}
      </div>
      ${unsafeHTML(legado.htmlNav())}`;
  }
  const o = (f || s) as Fijo | Sugerido;
  const wd = f ? f.weekday : s!.weekday;
  const slot = f ? f.slot : s!.slot;
  const dir = direccionDe(f);
  const total = totalDe(o.precio, f);
  const precio = total != null ? legado.soles(total) : o.precio != null ? legado.soles(o.precio) : '—';
  const foto = imagenDe(o.items);
  const franja = f && legado.enlace.fijo === f.id ? legado.enlace.franja : null;
  const pedir = () => (f ? pedirAhora(f) : pedirSugerido(s!));
  return html`<div class="mfj fi">
    ${foto
      ? html`<div class="hero" aria-hidden="true"><img src=${foto} alt="" /><div class="v"></div></div>`
      : html`<div class="hero vacio" aria-hidden="true"></div>`}
    <button class="sal" @click=${volver} aria-label="Volver">←</button>
    <div class="cuerpo">
      <div class="tx">
        <em>${f ? 'Tu pedido fijo' : 'Lo que más pides'}</em>
        <b>${o.label.split(' + ').map((p, i) => (i ? html`<br />+ ${p}` : html`${p}`))}</b>
        <s>${wd != null && slot ? `${f ? 'Fijo los ' : 'Lo pides los '}${diasPlural(wd)} · ${hhmmATexto(slot)}` : ''}${dir
          ? html`<br />${dir.address}${dir.reference ? ', ' + dir.reference : ''}`
          : nothing}</s>
      </div>
      <div class="vec">
        <div><s>Lo pediste</s><b>${o.veces ? o.veces + (o.veces === 1 ? ' vez' : ' veces') : 'Aún no'}</b></div>
        <div><s>Siempre a las</s><b>${o.horaHabitual ? hhmmATexto(o.horaHabitual) : slot ? hhmmATexto(slot) : '—'}</b></div>
        <div><s>Te sale</s><b>${precio}</b></div>
      </div>
      ${caja(f, s)} ${otros(f)}
    </div>
    <div class="go sw-barra">
      <button class="oro" @click=${pedir}>${franja ? 'Pedirlo a las ' + hhmmATexto(franja) : 'Pedirlo ahora'}</button>
      <button class="cel" @click=${pedir}>${precio}</button>
    </div>
  </div>`;
}

export const pantallaFijo = {
  pintar(el: HTMLElement): void {
    contenedor = el;
    render(vista(), el);
  },
};
