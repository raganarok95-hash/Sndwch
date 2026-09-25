import { test, expect, type Page } from '@playwright/test';
import { gotoApp } from './helpers';
import { resolverCarrito, type LineaDelCarrito, type Precios, type Recompensa } from '../supabase/functions/_shared/dinero.ts';
import { recompensa, unPanConRecargo, unPanSinRecargo, unSignature, unaBebida, unaProteinaDelArmador, unaSalsaDelArmador } from './carta';

// Productos de la carta, preguntados a la carta: la regla no depende de qué haya este mes.
const PROT = unaProteinaDelArmador();
const SALSA_A = unaSalsaDelArmador(0);
const SALSA_B = unaSalsaDelArmador(1);
const SALSA_C = unaSalsaDelArmador(2);
const UNA_BEBIDA = unaBebida();
const CON_RECARGO = unPanConRecargo();
const SIN_RECARGO = unPanSinRecargo();
const UN_SIGNATURE = unSignature();
const R_SANDWICH = recompensa('sandwich');
const R_SUBIR30 = recompensa('subir30');
const R_SALSA = recompensa('salsa');
const R_DOBLE = recompensa('doble');
const R_BEBIDA = recompensa('bebida');

// EL TOTAL QUE VE EL CLIENTE ES EL QUE COBRA EL SERVIDOR (2026-09-24).
//
// El servidor cobra con `resolverCarrito` (supabase/functions/_shared/dinero.ts); se comprobó
// que da, céntimo por céntimo, lo mismo que el `deriveCart` anterior en 8 064 carritos. Esta
// prueba le pide el total al CLIENTE —`cartFinalTotal()`, lo que se muestra antes de pagar— y
// lo compara contra esa referencia, con los precios que el propio cliente tiene cargados.
//
// POR QUÉ EXISTE. Hasta hoy el cliente tenía su propia copia del cálculo, y con el pan focaccia
// se separaba del servidor en tres sitios: R06 («15CM gratis»), R03 («sube a 30CM») y el
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
  ({ type: 'byo', base, prot: PROT, tops: [], cheese: null, sauces: [SALSA_A], size, qty: 1, ...extra } as LineaDelCarrito);
const bebida: LineaDelCarrito = { type: 'side', code: UNA_BEBIDA, qty: 1 };

const CASOS: { nombre: string; items: LineaDelCarrito[]; r: Recompensa | null; grupo?: boolean }[] = [
  { nombre: 'focaccia 15CM con «15CM gratis»', items: [byo(CON_RECARGO, '15')], r: R_SANDWICH },
  { nombre: 'focaccia 15CM con «sube a 30CM»', items: [byo(CON_RECARGO, '15')], r: R_SUBIR30 },
  {
    nombre: 'grupo de 5 donde el más barato es de focaccia: el organizador se lo lleva gratis',
    items: [byo(CON_RECARGO, '15'), { ...byo(SIN_RECARGO, '30'), qty: 4 } as LineaDelCarrito],
    r: null,
    grupo: true,
  },
  { nombre: 'pan clásico con combo', items: [byo(SIN_RECARGO, '15'), bebida], r: null },
  { nombre: 'focaccia 30CM doble proteína + salsa extra de 3 salsas con «4ta salsa»', items: [byo(CON_RECARGO, '30', { doubleProt: true, extraSauce: true, sauces: [SALSA_A, SALSA_B, SALSA_C] })], r: R_SALSA },
  { nombre: 'Signature 15CM con doble proteína y dos bebidas', items: [{ type: 'sig', sigId: UN_SIGNATURE, size: '15', doubleProt: true, qty: 1 }, { ...bebida, qty: 2 }], r: R_DOBLE },
  { nombre: 'bebida gratis con un sándwich: el combo no regala la otra mitad', items: [byo(SIN_RECARGO, '15'), bebida], r: R_BEBIDA },
  { nombre: 'tres iguales: sin decimales infinitos', items: [{ type: 'sig', sigId: UN_SIGNATURE, size: '15', qty: 3 }], r: null },
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
