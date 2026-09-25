import { test, expect } from '@playwright/test';
import { cartaDeLaApp, gotoApp, type Carta } from './helpers';

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
// dejaba pasar. Medido antes del arreglo: el carrito quedaba con la res como proteína y un precio
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

// Los pedidos se arman con la carta que la app tiene cargada (cartaDeLaApp), nunca con códigos
// de producto escritos: la carta cambia y lo que se prueba es la REGLA —lo que salió de la
// carta no entra—, no un producto en particular.
const armado = (c: Carta, prot: string, tops: string[]) =>
  ({ type: 'byo', base: c.pan(), prot, tops, sauces: [c.salsa()], size: '15', qty: 1 });
// Una proteína que solo existe dentro de un Signature: el servidor rechaza armarla.
const armadoConProteinaExclusiva = (c: Carta) => armado(c, c.protExclusivas[0]!, [c.top()]);
// La proteína es perfectamente pedible: lo que el servidor rechaza es el VEGETAL exclusivo. La
// primera versión del filtro solo miraba la proteína y dejaba pasar este caso entero.
const armadoConVegetalExclusivo = (c: Carta) => armado(c, c.proteina(), [c.top(), c.topsExclusivos[0]!]);
const armadoPedible = (c: Carta) => armado(c, c.proteina(), [c.top()]);
const signaturePedible = (c: Carta) => ({ type: 'sig', sigId: c.signature(), size: '15', qty: 1 });
const menuSecreto = (c: Carta) => ({ type: 'sig', sigId: c.secreto!, size: '15', qty: 1 });

async function entrarConUltimoPedido(page: any, hacerItems: (c: Carta) => any[], summary = '1x algo'): Promise<Carta> {
  // `my-orders` se responde recién cuando la app lo pide (loadUserExtras, abajo), y para
  // entonces la carta ya está leída: el pedido sale de la carta real de la app.
  let items: any[] = [];
  await gotoApp(page, {
    login: { customer: CLIENTE, isAdmin: false, token: 'tok' },
    'session-check': { valid: true, customer: CLIENTE },
    'my-orders': () => ({ orders: [pedido(items, summary)] }),
    'addresses-list': { addresses: [] },
    'favorites-list': { favorites: [] },
  });
  const carta = await cartaDeLaApp(page);
  items = hacerItems(carta);
  await page.evaluate(() => {
    (window as any).token = 'tok';
    (window as any).cust = { phone: '900000001', name: 'Ana', total_orders: 4 };
  });
  await page.evaluate(async () => { await (window as any).loadUserExtras(); });
  return carta;
}

// ⚠ LA ENTRADA A «PEDIR LO MISMO» NO EXISTE HOY (2026-09-24). Se perdió en el rediseño del
// 2026-09-17, que partió el inicio en los dos mundos de los hermanos y no trasladó la tarjeta
// del último pedido. Volver a ponerla es la tarea #69 («Pedir lo mismo» arriba de Tus
// pedidos, pantalla 33). Hasta entonces:
//   · la prueba de la ENTRADA queda roja, en tests/ROJAS_CONOCIDAS.txt, a la espera de #69;
//   · las de la LÓGICA —qué entra al carrito y qué se avisa— ejercitan `loadCart`, la misma
//     función que usa hoy «Pedirlo ahora» del pedido fijo. Así siguen protegiendo algo vivo
//     en vez de quedar rojas por una pantalla que falta.
async function repetir(page: any) {
  await page.evaluate(() => {
    const w = window as any;
    w.loadCart(w.lastPaidOrder().items);
  });
}

const carrito = (page: any) => page.evaluate(() => (window as any).cart.map((c: any) => c.prot || c.sigId || c.code));

test('el inicio ofrece «Pedir lo mismo» con el último pedido (se construye en la tarea #69)', async ({ page }) => {
  await entrarConUltimoPedido(page, (c) => [armadoPedible(c)]);
  await expect(page.getByRole('button', { name: /Pedir lo mismo/ })).toBeVisible();
});

test.describe('repetir pedido', () => {
  test('un pedido sano se repite entero y llega al carrito tal cual', async ({ page }) => {
    const c = await entrarConUltimoPedido(page, (c) => [armadoPedible(c), signaturePedible(c)]);
    await repetir(page);
    expect(await carrito(page)).toEqual([c.proteina(), c.signature()]);
  });

  test('una proteína que solo existe dentro de un Signature no entra al carrito — el servidor la rechazaría', async ({ page }) => {
    await entrarConUltimoPedido(page, (c) => [armadoConProteinaExclusiva(c)]);
    await repetir(page);
    expect(await carrito(page)).toEqual([]);
    // Sin nada repetible no se manda a un carrito vacío sin explicación.
    await expect(page.locator('text=ya no se puede repetir')).toBeVisible();
  });

  test('si solo parte del pedido sigue en la carta, se repite esa parte Y se dice qué falta', async ({ page }) => {
    const c = await entrarConUltimoPedido(page, (c) => [armadoConProteinaExclusiva(c), armadoPedible(c)]);
    await repetir(page);
    expect(await carrito(page)).toEqual([c.proteina()]);
    await expect(page.locator('text=ya no está en la carta')).toBeVisible();
  });

  test('un VEGETAL exclusivo de Signature también frena la repetición, no solo la proteína', async ({ page }) => {
    // Las dos líneas llevan una proteína pedible, así que la proteína no descarta nada: si el
    // filtro solo mirara `prot`, este pedido pasaría entero y el servidor lo rechazaría al pagar.
    const c = await entrarConUltimoPedido(page, (c) => [armadoConVegetalExclusivo(c), armadoPedible(c)]);
    expect(await carrito(page)).toEqual([]);
    await repetir(page);
    expect(await carrito(page)).toEqual([c.proteina()]);
    await expect(page.locator('text=ya no está en la carta')).toBeVisible();
  });

  test('el menú secreto no se repite: rota cada mes bajo el mismo id, así que NO sería lo mismo', async ({ page }) => {
    const c = await entrarConUltimoPedido(page, (c) => [menuSecreto(c), signaturePedible(c)]);
    await repetir(page);
    expect(await carrito(page)).toEqual([c.signature()]);
    await expect(page.locator('text=ya no está en la carta')).toBeVisible();
  });
});
