import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// REPETIR PEDIDO — que "pedir lo mismo" no sea una promesa rota (2026-09-12).
//
// POR QUÉ EXISTE ESTE ARCHIVO. La tarjeta "↻ Repetir pedido" del home es la ruta más barata
// que tiene el negocio: un pedido repetido no cuesta ni un sol de adquisición, contra los
// S/17.87 del CAC pagado más bajo medido. Y hasta el 2026-09-12 metía al carrito CUALQUIER
// cosa que hubiera en el pedido viejo, sin mirar si el catálogo todavía la acepta.
//
// EL CASO NO ES HIPOTÉTICO: res (P01) y embutido (P05) salieron de ARMA EL TUYO el
// 2026-09-05 por rentabilidad y siguen en `PROTS` marcadas `sigOnly`, porque sus Signatures
// las usan. `cartItemStillExists` solo preguntaba si el id seguía en el array, así que las
// dejaba pasar. Medido antes del arreglo: el carrito quedaba con `prot:'P01'` y un precio
// de S/14.90 en pantalla, y `priceByoBuild` lanza "Proteína inválida." recién al PAGAR.
//
// Es el mismo defecto que ya obligó a poner el selector de distrito y a tachar las horas
// llenas: el servidor tenía razón desde siempre y el cliente se enteraba al final, después
// de escribir su dirección. El propio comentario del servidor ya nombraba este camino
// ("se seguía pudiendo pedir... repitiendo un pedido viejo") — lo cerró allá y no acá.
//
// MODO DE FALLO: SILENCIO en las dos direcciones. Si alguien quita el filtro, nada revienta
// hasta el checkout. Y si alguien lo "simplifica" a descartar sin avisar, tampoco revienta
// nada: el cliente simplemente recibe algo distinto de lo que pidió y se entera al morderlo.
// Por eso se fija lo que se cae Y que se diga.

const CLIENTE = { phone: '900000001', name: 'Ana', points: 0, credit_balance: 0, total_orders: 4 };

const pedido = (items: any[], summary: string) => ({
  id: 'ord-1', ref: 'REF-001', status: 'ENTREGADO', payment_status: 'paid',
  total: 22.9, created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  summary, items,
});

const BYO_RES = { type: 'byo', base: 'B01', prot: 'P01', tops: ['T01'], sauces: ['S01'], size: '15', qty: 1 };
// T02 pepinillo pasó a `sigOnly` el 2026-09-04 (lo reemplazó la lechuga en el armador). La
// proteína de este armado es perfectamente pedible: lo que el servidor rechaza es el TOPPING.
// La primera versión del filtro solo miraba la proteína y dejaba pasar este caso entero.
const BYO_CON_PEPINILLO = { type: 'byo', base: 'B01', prot: 'P02', tops: ['T01', 'T02'], sauces: ['S01'], size: '15', qty: 1 };
const BYO_POLLO = { type: 'byo', base: 'B01', prot: 'P02', tops: ['T01'], sauces: ['S01'], size: '15', qty: 1 };
const SIG_SECRETO = { type: 'sig', sigId: 'SIG05', size: '15', qty: 1 };
const SIG_NORMAL = { type: 'sig', sigId: 'SIG02', size: '15', qty: 1 };

async function entrarConUltimoPedido(page: any, items: any[], summary = '1x algo') {
  await gotoApp(page, {
    login: { customer: CLIENTE, isAdmin: false, token: 'tok' },
    'session-check': { valid: true, customer: CLIENTE },
    'my-orders': { orders: [pedido(items, summary)] },
    'addresses-list': { addresses: [] },
    'favorites-list': { favorites: [] },
  });
  await page.evaluate(() => {
    (window as any).token = 'tok';
    (window as any).cust = { phone: '900000001', name: 'Ana', total_orders: 4 };
  });
  await page.evaluate(async () => { await (window as any).loadUserExtras(); });
  await expect(page.locator('text=Repetir pedido')).toBeVisible();
}

const carrito = (page: any) => page.evaluate(() => (window as any).cart.map((c: any) => c.prot || c.sigId || c.code));

test.describe('repetir pedido', () => {
  test('un pedido sano se repite entero y llega al carrito tal cual', async ({ page }) => {
    await entrarConUltimoPedido(page, [BYO_POLLO, SIG_NORMAL], '1x Pollo + 1x The Marinara');
    await page.locator('text=Pedir lo mismo').click();
    expect(await carrito(page)).toEqual(['P02', 'SIG02']);
  });

  test('una proteína que salió de ARMA EL TUYO no entra al carrito — el servidor la rechazaría', async ({ page }) => {
    await entrarConUltimoPedido(page, [BYO_RES], '1x Arma el tuyo (Res) 15CM');
    await page.locator('text=Pedir lo mismo').click();
    expect(await carrito(page)).toEqual([]);
    // Sin nada repetible no se manda a un carrito vacío sin explicación.
    await expect(page.locator('text=ya no se puede repetir')).toBeVisible();
  });

  test('si solo parte del pedido sigue en la carta, se repite esa parte Y se dice qué falta', async ({ page }) => {
    await entrarConUltimoPedido(page, [BYO_RES, BYO_POLLO], '1x Res + 1x Pollo');
    await page.locator('text=Pedir lo mismo').click();
    expect(await carrito(page)).toEqual(['P02']);
    await expect(page.locator('text=ya no está en la carta')).toBeVisible();
  });

  test('un TOPPING que salió del armador también frena la repetición, no solo la proteína', async ({ page }) => {
    await entrarConUltimoPedido(page, [BYO_CON_PEPINILLO, BYO_POLLO], '1x Pollo con pepinillo + 1x Pollo');
    // Las dos líneas son de pollo, así que la proteína no descarta nada: si el filtro solo
    // mirara `prot`, este pedido pasaría entero y el servidor lo rechazaría al pagar.
    expect(await carrito(page)).toEqual([]);
    await page.locator('text=Pedir lo mismo').click();
    expect(await carrito(page)).toEqual(['P02']);
    await expect(page.locator('text=ya no está en la carta')).toBeVisible();
  });

  test('el menú secreto no se repite: rota cada mes bajo el mismo id, así que NO sería lo mismo', async ({ page }) => {
    await entrarConUltimoPedido(page, [SIG_SECRETO, SIG_NORMAL], '1x Secreto + 1x The Marinara');
    await page.locator('text=Pedir lo mismo').click();
    expect(await carrito(page)).toEqual(['SIG02']);
    await expect(page.locator('text=ya no está en la carta')).toBeVisible();
  });
});
