// EL PUENTE CON EL CÓDIGO VIEJO (2026-09-24).
//
// El código nuevo vive en módulos: nada global, nada que un script de terceros pueda pisar, y
// todo tipado en modo estricto. Pero mientras las pantallas migran de a una, todavía necesita
// cosas del código viejo (`src/app/*`), que son variables y funciones sueltas en `window`.
//
// Este archivo es el ÚNICO sitio donde lo nuevo toca lo viejo, y cada cosa que toca lleva su
// tipo escrito. Si una se renombra en el código viejo, se corrige acá, en un solo lugar, y el
// compilador señala todo lo que dependía de ella. A medida que las piezas viejas migren, sus
// entradas se borran de acá; el día que este archivo quede vacío, la migración terminó.

import type { LineaDelCarrito } from '../../supabase/functions/_shared/dinero.ts';
import type { Direccion, ItemCarrito, PedidoDelCliente } from '../../supabase/functions/_shared/dominio.ts';

type DiaDelCarrito = 'today' | 'tomorrow';

// Lo que el código viejo deja en `window`. Solo se declara lo que el nuevo usa.
type Viejo = {
  api: (accion: string, datos: Record<string, unknown>) => Promise<unknown>;
  token: string;
  sndScreen: string;
  render: () => void;
  showToast: (texto: string, tipo?: string) => void;
  showConfirm: (texto: string) => Promise<boolean>;
  VACIO: (titulo: string, texto: string, cta?: string, estado?: string) => string;
  H: (sub?: string, bk?: string, showCart?: boolean) => string;
  NAV: () => string;
  myAddresses: Direccion[];
  cart: ItemCarrito[];
  loadCart: (items: ItemCarrito[]) => void;
  pickAddr: (id: number) => void;
  schedSlots: (dia: DiaDelCarrito) => string[];
  scheduleMode: 'now' | 'later';
  schedDay: DiaDelCarrito;
  schedSlot: string | null;
  confirmRerender: () => void;
  pendingRecurringId: string | null;
  miHoraApartada: string | null;
  fijoFromUrl: string | null;
  franjaFromUrl: string | null;
  SIG_IMG: Record<string, string>;
  PROT_IMG: Record<string, string>;
  SOLES_TXT: string;
  pz: (n: number) => string;
  horaLima: (ms: number) => string;
  envioADireccion: (a: Direccion | null) => number | null;
  DIAS_SEMANA: string[];
  cust: { total_orders?: number | null } | null;
  myOrders: PedidoDelCliente[];
  listLoading: boolean;
  loadMyOrders: () => Promise<void>;
  _sndOd: string | null;
  rtStars: number;
  rtMsg: string;
  cartItemRepeatable: (it: ItemCarrito) => boolean;
  STATUSES: Record<string, { label: string; next: string | null }>;
  SIGS: { id: string; n: string }[];
  SIDES: { id: string; l: string }[];
  PROTS: { id: string; l: string }[];
};

const w = window as unknown as Viejo;

export const legado = {
  /** Solo para `llamar()` (api.ts), que le pone el tipo del contrato. No se usa directo. */
  api: <T>(accion: string, datos: Record<string, unknown>): Promise<T> => w.api(accion, datos) as Promise<T>,
  get token(): string {
    return w.token;
  },
  get pantalla(): string {
    return w.sndScreen;
  },
  /** Navega a una pantalla por el router viejo (que pinta la nueva si está migrada). */
  irA(pantalla: string): void {
    w.sndScreen = pantalla;
    w.render();
  },
  aviso: (texto: string, tipo?: string): void => w.showToast(texto, tipo),
  confirmar: (texto: string): Promise<boolean> => w.showConfirm(texto),
  // Piezas de interfaz viejas que todavía son HTML en texto. Se pintan con unsafeHTML y se
  // reemplazan cuando migren.
  htmlVacio: (titulo: string, texto: string, pose: string): string => w.VACIO(titulo, texto, '', pose),
  htmlCabecera: (titulo: string, volver: string): string => w.H(titulo, volver),
  htmlNav: (): string => w.NAV(),
  get direcciones(): Direccion[] {
    return w.myAddresses || [];
  },
  set direcciones(v: Direccion[]) {
    w.myAddresses = v;
  },
  carrito: {
    cargar(items: ItemCarrito[]): boolean {
      w.loadCart(items);
      return w.cart.length > 0 && w.sndScreen === 'o_cart';
    },
    elegirDireccion: (id: number): void => w.pickAddr(id),
    franjasLibres: (dia: DiaDelCarrito): string[] => w.schedSlots(dia),
    programar(dia: DiaDelCarrito, franja: string): void {
      w.scheduleMode = 'later';
      w.schedDay = dia;
      w.schedSlot = franja;
    },
    /** El origen del carrito: el pedido fijo del que sale, y la hora que tiene apartada. */
    marcarOrigenFijo(id: string, horaApartada: string | null): void {
      w.pendingRecurringId = id;
      w.miHoraApartada = horaApartada;
    },
    repintar: (): void => w.confirmRerender(),
  },
  enlace: {
    get fijo(): string | null {
      return w.fijoFromUrl;
    },
    get franja(): string | null {
      return w.franjaFromUrl;
    },
  },
  imagenSignature: (sigId: string): string => w.SIG_IMG[sigId] || '',
  imagenProteina: (prot: string): string => w.PROT_IMG[prot] || '',
  soles: (n: number): string => w.SOLES_TXT + w.pz(n),
  horaLima: (ms: number): string => w.horaLima(ms),
  envioA: (a: Direccion | null): number | null => w.envioADireccion(a),
  get diasSemana(): string[] {
    return w.DIAS_SEMANA;
  },
  pedidos: {
    get lista(): PedidoDelCliente[] {
      return w.myOrders || [];
    },
    get cargando(): boolean {
      return !!w.listLoading;
    },
    /** Pide los pedidos al servidor y vuelve a pintar «Tus pedidos» (loadMyOrders, 06-*). */
    cargar: (): Promise<void> => w.loadMyOrders(),
    /** Abre el detalle de un pedido (sOrdDetail, 06-*), con la calificación en blanco. */
    abrir(id: string): void {
      w._sndOd = id;
      w.rtStars = 0;
      w.rtMsg = '';
      w.sndScreen = 'p_ord_detail';
      w.render();
    },
    /** Si una línea de un pedido pasado se puede volver a pedir hoy tal cual (cartItemRepeatable,
     *  03-*: sigue en la carta, se puede pedir suelta y no es del menú secreto). Si lo es, es una
     *  línea que el módulo de dinero sabe tasar. */
    repetible: (it: ItemCarrito): it is ItemCarrito & LineaDelCarrito => w.cartItemRepeatable(it),
    estado(st: string | null): { texto: string; terminado: boolean } {
      const e = st ? w.STATUSES[st] : undefined;
      return { texto: e ? e.label : st || '', terminado: !!e && !e.next };
    },
  },
  /** Cuántos pedidos pagados lleva el cliente con cuenta (lo lleva la base); null si es invitado. */
  get pedidosDelCliente(): number | null {
    return w.cust ? w.cust.total_orders || 0 : null;
  },
  /** «The Chicago 30CM», «The Midnight», «Pollo 15CM»: el nombre de la carta, sin la segunda
   *  parte («// Italian Beef»). '' si ya no está en la carta. */
  nombreDeLinea(it: ItemCarrito): string {
    const cm = it.size === '15' || it.size === '30' ? ' ' + it.size + 'CM' : '';
    if (it.type === 'side') return (w.SIDES.find((d) => d.id === it.code) || { l: '' }).l;
    if (it.type === 'sig') {
      const s = w.SIGS.find((x) => x.id === it.sigId);
      return s ? s.n + cm : '';
    }
    const p = w.PROTS.find((x) => x.id === it.prot);
    return p ? p.l + cm : '';
  },
};
