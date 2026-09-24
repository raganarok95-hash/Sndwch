// EL DINERO DEL CLIENTE ES EL DEL SERVIDOR (2026-09-24).
//
// El cliente viejo (src/app/03-*) ya no calcula precios: sus funciones de siempre
// (`itemUnitPrice`, `cartFinalTotal`, `rewardWaiverAmount`…) llaman acá, y esto llama al MISMO
// módulo con el que cobra el servidor (supabase/functions/_shared/dinero.ts). Lo único propio
// del cliente es de dónde saca los precios: del catálogo que ya cargó (`PROTS`, `SIGS`, `SIDES`,
// que get-catalog actualiza con los de la base).
import {
  lineaDeLaRecompensa,
  precioUnitario,
  REGLAS,
  resolverCarrito,
  tasarLinea,
  type Desglose,
  type LineaDelCarrito,
  type OpcionesDelCarrito,
  type Precios,
  type Recompensa,
  type Tasada,
} from '../../supabase/functions/_shared/dinero.ts';

type ProtViejo = { id: string; p15: number; p30: number; pDbl: number; pDbl30: number };
type SigViejo = { id: string; prot: string; p15: number; p30: number; sauces?: string[] };
type BebidaVieja = { id: string; p: number };
const w = window as unknown as { PROTS?: ProtViejo[]; SIGS?: SigViejo[]; SIDES?: BebidaVieja[] };

function precios(): Precios {
  const prot: Precios['prot'] = {};
  for (const p of w.PROTS || []) prot[p.id] = { p15: p.p15, p30: p.p30, pDbl: p.pDbl, pDbl30: p.pDbl30 };
  const sig: Precios['sig'] = {};
  for (const s of w.SIGS || []) sig[s.id] = { prot: s.prot, p15: s.p15, p30: s.p30, salsas: (s.sauces || []).length };
  const bebida: Precios['bebida'] = {};
  for (const d of w.SIDES || []) bebida[d.id] = d.p;
  return { prot, sig, bebida };
}

export const dinero = {
  reglas: REGLAS,
  desglose: (items: LineaDelCarrito[], op: OpcionesDelCarrito): Desglose => resolverCarrito(items, op, precios()),
  unitario: (it: LineaDelCarrito): number => precioUnitario(it, precios()),
  tasar: (it: LineaDelCarrito): Tasada | null => tasarLinea(it, precios()),
  lineaDeLaRecompensa: (items: LineaDelCarrito[], r: Recompensa): number =>
    lineaDeLaRecompensa(items.map((it) => tasarLinea(it, precios())), r),
};
