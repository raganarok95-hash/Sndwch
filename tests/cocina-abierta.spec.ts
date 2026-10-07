import { test, expect, type Page } from '@playwright/test';
import { gotoApp, entrarConTelefono } from './helpers';

// COCINA ABIERTA (2026-10-01, docs/PANEL_NUEVO.md).
//
// Promesas, y su modo de fallo silencioso:
//   · el mensaje para el grupo de motorizados dice COBRAR solo cuando hay que cobrar
//     (contra entrega sin pagar). Si se equivoca, el motorizado cobra dos veces o no cobra:
//     plata perdida y nadie se entera hasta el reclamo;
//   · un pedido nuevo suena aunque en el mismo intervalo otro se haya entregado (antes se
//     comparaba el TOTAL de pedidos: uno sale, otro entra, el total no cambia, no suena).
// Se busca por `data-accion` / `data-pedido`, nunca por texto.

const PEDIDO = (id: string, extra: Record<string, unknown>) => ({
  id, ref: 'R-' + id.slice(0, 4), status: 'PREPARANDO', payment_status: 'paid', payment_method: 'yape',
  total: 31.5, delivery_fee: 5, summary: 'pedido de prueba', customer_name: 'Ana', customer_phone: '900000002',
  customer_address: 'Calle 1', notes: 'puerta verde', created_at: new Date().toISOString(), ...extra,
});
const COD = PEDIDO('11111111-1111-4111-8111-111111111111', { payment_method: 'cod', payment_status: 'pending' });
const YAPE = PEDIDO('22222222-2222-4222-8222-222222222222', {});

async function abrirCocina(page: Page, orders: unknown[], extra: Record<string, unknown> = {}) {
  // El espía de window.open va como propiedad de solo lectura y antes de que cargue la app:
  // el blindaje de funciones (08-router) repone en cada render lo que había al arrancar, y el
  // stub de gotoApp lo reemplazaría. Un espía puesto con una asignación desaparecía con el
  // primer refresco de la cola. Sin hoja de compartir: así sale por wa.me.
  await page.addInitScript(() => {
    const w = window as any;
    w.__abiertos = [];
    const espia = (u: string) => { w.__abiertos.push(u); return null; };
    Object.defineProperty(window, 'open', { get: () => espia, set: () => {}, configurable: true });
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  });
  await gotoApp(page, {
    login: { customer: { phone: '900000001', name: 'Dueño', points: 0 }, isAdmin: true, token: 't' },
    'admin-orders': { orders, truncated: false },
    '*': { success: true },
    ...extra,
  });
  await entrarConTelefono(page);
  await page.waitForFunction(() => (window as any).cust);
  await page.evaluate(() => { const w = window as any; w.loadAdmin(); });
  await page.waitForFunction(() => typeof (window as any).abrirCocina === 'function');
  // La hoja de porciones no es lo que se prueba acá.
  await page.evaluate(() => { try { localStorage.setItem('sw_abro_con', new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' })); } catch (e) {} (window as any).abrirCocina(); });
}

test('el mensaje al grupo dice COBRAR solo si hay que cobrar', async ({ page }) => {
  await abrirCocina(page, [COD, YAPE]);
  for (const [o, cobra] of [[COD, true], [YAPE, false]] as const) {
    await page.evaluate(() => { (window as any).__abiertos = []; });
    await page.locator(`[data-pedido="${o.id}"] [data-accion="pedir-motorizado"]`).click();
    const url = await page.evaluate(() => (window as any).__abiertos.pop());
    const texto = new URL(String(url)).searchParams.get('text') || '';
    expect(texto).toContain(o.ref);
    expect(texto).toContain(o.customer_address);
    expect(/COBRAR/.test(texto)).toBe(cobra);
    if (cobra) expect(texto).toContain((o.total as number).toFixed(2));
  }
});

test('suena y vibra cuando entra un pedido aunque otro haya salido', async ({ page }) => {
  await abrirCocina(page, [COD]);
  const avisos = await page.evaluate(() => {
    const w = window as any;
    let n = 0;
    w._pedidosVistos = null;
    w.playNotif = () => { n++; };
    w.avisarSiHayNovedad([{ id: 'a', status: 'PREPARANDO' }]);          // línea base
    w.avisarSiHayNovedad([{ id: 'b', status: 'RECIBIDO' }]);            // 'a' salió, 'b' entró
    const trasCambio = n;
    w.avisarSiHayNovedad([{ id: 'b', status: 'PREPARANDO' }]);          // solo avanzó
    return { trasCambio, alFinal: n };
  });
  expect(avisos).toEqual({ trasCambio: 1, alFinal: 1 });
});

// VIAJE AGRUPADO (2026-10-07). Dos pedidos a la misma zona salen en UN mensaje. Modo de fallo
// silencioso: que juntar mezcle los cobros — el COBRAR del contra entrega quedando en el pedido
// ya pagado (el motorizado cobra dos veces) o perdiéndose (no cobra nada).
test('dos pedidos a la misma zona van en un mensaje, cada uno con su propio cobro', async ({ page }) => {
  await abrirCocina(page, [COD, YAPE], {
    'admin-orders': { orders: [COD, YAPE], truncated: false, addressFlags: { duplicates: [], ambiguous: [], nearby: [{ zone: 'Centro', refs: [COD.ref, YAPE.ref] }] } },
  });
  await page.locator(`[data-pedido="${YAPE.id}"] [data-accion="pedir-motorizado"]`).click();
  await expect.poll(() => page.evaluate(() => (window as any).__abiertos.length)).toBe(1);
  const texto = new URL(String(await page.evaluate(() => (window as any).__abiertos.pop()))).searchParams.get('text') || '';
  const bloques = texto.split('— — —');
  expect(bloques.length).toBe(2);
  const deCod = bloques.find((b) => b.includes(COD.ref)) || '';
  const deYape = bloques.find((b) => b.includes(YAPE.ref)) || '';
  expect(deCod).toContain('COBRAR ' + 'S/' + (COD.total as number).toFixed(2));
  expect(/COBRAR/.test(deYape)).toBe(false);
});

// CIERRE DEL DÍA (2026-10-07). Con la tienda cerrada, «Cerrarlos» cierra de un toque lo que
// sigue en camino. Modo de fallo silencioso: cerrar ENTREGADO un contra entrega registra su
// cobro y suma puntos — en lote, quedaría cobrada plata que nadie contó.
test('al cerrar, el lote cierra solo los pagados y nunca un contra entrega', async ({ page }) => {
  const enCaminoCod = { ...COD, status: 'EN CAMINO' };
  const enCaminoYape = { ...YAPE, status: 'EN CAMINO' };
  const cerrados: string[] = [];
  await abrirCocina(page, [enCaminoCod, enCaminoYape], {
    'admin-update-status': (b: any) => { cerrados.push(b.orderId); return { order: {} }; },
  });
  // Tienda cerrada todo el día: así «al cerrar» no depende de la hora en que corra la prueba.
  await page.evaluate(() => { const w = window as any; for (let d = 0; d < 7; d++) w.STORE_HOURS[d] = null; w.render(); });
  await page.locator('[data-accion="cerrar-en-camino"]').click();
  await expect.poll(() => cerrados.length).toBe(1);
  expect(cerrados).toEqual([YAPE.id]);
});
