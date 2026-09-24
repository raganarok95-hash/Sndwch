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

export type Id = string;

export type DireccionGuardada = {
  id: number;
  label: string;
  address: string;
  reference?: string | null;
  lat: number | null;
  lon: number | null;
};

/** Un ítem del carrito tal como lo guarda el código viejo. Se tipa de verdad en el paso 2. */
export type ItemCarrito = {
  type?: string;
  sigId?: string;
  prot?: string;
  code?: string;
  size?: string;
  qty: number;
  [k: string]: unknown;
};

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
  myAddresses: DireccionGuardada[];
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
  envioADireccion: (a: DireccionGuardada | null) => number | null;
  DIAS_SEMANA: string[];
};

const w = window as unknown as Viejo;

export const legado = {
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
  get direcciones(): DireccionGuardada[] {
    return w.myAddresses || [];
  },
  set direcciones(v: DireccionGuardada[]) {
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
  envioA: (a: DireccionGuardada | null): number | null => w.envioADireccion(a),
  get diasSemana(): string[] {
    return w.DIAS_SEMANA;
  },
};
