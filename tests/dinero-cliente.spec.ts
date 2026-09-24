import { test, expect, type Page } from '@playwright/test';
import { gotoApp } from './helpers';
import { resolverCarrito, type LineaDelCarrito, type Precios, type Recompensa } from '../supabase/functions/_shared/dinero.ts';

// EL TOTAL QUE VE EL CLIENTE ES EL QUE COBRA EL SERVIDOR (2026-09-24).
//
// El servidor cobra con `resolverCarrito` (supabase/functions/_shared/dinero.ts); se comprobó
// que da, céntimo por céntimo, lo mismo que el `deriveCart` anterior en 8 064 carritos. Esta
// prueba le pide el total al CLIENTE —`cartFinalTotal()`, lo que se muestra antes de pagar— y
// lo compara contra esa referencia, con los precios que el propio cliente tiene cargados.
//
// POR QUÉ EXISTE. Hasta hoy el cliente tenía su propia copia del cálculo, y con el pan focaccia
// (B03) se separaba del servidor en tres sitios: R06 («15CM gratis»), R03 («sube a 30CM») y el
// sándwich gratis del organizador. El cliente mostraba S/0.50 más y el servidor rechazaba el
// pago por «el total no coincide». Ninguna prueba lo veía porque ninguna comparaba los dos.

async function preciosDelCliente(page: Page): Promise<Precios> {
  return page.evaluate(() => {
    const w = window as any;
    const prot: Precios['prot'] = {};
    for (const p of w.PROTS) prot[p.id] = { p15: p.p15, p30: p.p30, pDbl: p.pDbl, pDbl30: p.pDbl30 };
    const sig: Precios['sig'] = {};
    for (const s of w.SIGS) sig[s.id] = { prot: s.prot, p15: s.p15, p30: s.p30, salsas: (s.sauces || []).length };
    const bebida: Precios['bebida'] = {};
    for (const d of w.SIDES) bebida[d.id] = d.p;
    return { prot, sig, bebida };
  });
}

async function totalDelCliente(page: Page, items: LineaDelCarrito[], recompensa: Recompensa | null, grupo: boolean) {
  return page.evaluate(([items, recompensa, grupo]) => {
    const w = window as any;
    w.cart = items;
    w.appliedReward = recompensa;
    w.appliedPromo = null;
    w.pendingGroupCode = grupo ? 'GRUPO1' : null;
    return w.cartFinalTotal();
  }, [items, recompensa, grupo] as const);
}

const byo = (base: string, size: '15' | '30', extra: Partial<LineaDelCarrito> = {}): LineaDelCarrito =>
  ({ type: 'byo', base, prot: 'P02', tops: [], cheese: null, sauces: ['S01'], size, qty: 1, ...extra } as LineaDelCarrito);
const bebida: LineaDelCarrito = { type: 'side', code: 'D07', qty: 1 };

const CASOS: { nombre: string; items: LineaDelCarrito[]; r: Recompensa | null; grupo?: boolean }[] = [
  { nombre: 'focaccia 15CM con «15CM gratis» (R06)', items: [byo('B03', '15')], r: 'R06' },
  { nombre: 'focaccia 15CM con «sube a 30CM» (R03)', items: [byo('B03', '15')], r: 'R03' },
  {
    nombre: 'grupo de 5 donde el más barato es de focaccia: el organizador se lo lleva gratis',
    items: [byo('B03', '15'), { ...byo('B01', '30'), qty: 4 } as LineaDelCarrito],
    r: null,
    grupo: true,
  },
  { nombre: 'pan clásico con combo', items: [byo('B01', '15'), bebida], r: null },
  { nombre: 'focaccia 30CM doble proteína + salsa extra de 3 salsas con «4ta salsa» (R02)', items: [byo('B03', '30', { doubleProt: true, extraSauce: true, sauces: ['S01', 'S03', 'S04'] })], r: 'R02' },
  { nombre: 'Signature 15CM con doble proteína (R04) y dos bebidas', items: [{ type: 'sig', sigId: 'SIG01', size: '15', doubleProt: true, qty: 1 }, { ...bebida, qty: 2 }], r: 'R04' },
  { nombre: 'bebida gratis (R05) con un sándwich: el combo no regala la otra mitad', items: [byo('B01', '15'), bebida], r: 'R05' },
  { nombre: 'tres iguales: sin decimales infinitos', items: [{ type: 'sig', sigId: 'SIG01', size: '15', qty: 3 }], r: null },
];

test('el total que ve el cliente es, céntimo por céntimo, el que cobra el servidor', async ({ page }) => {
  await gotoApp(page, {});
  const precios = await preciosDelCliente(page);
  const distintos: string[] = [];
  for (const c of CASOS) {
    const servidor = resolverCarrito(c.items, { recompensa: c.r, organizador: !!c.grupo }, precios).total;
    const cliente = await totalDelCliente(page, c.items, c.r, !!c.grupo);
    if (Math.round(cliente * 100) !== Math.round(servidor * 100)) distintos.push(`${c.nombre}: el cliente muestra ${cliente}, el servidor cobra ${servidor}`);
  }
  expect(distintos).toEqual([]);
});
