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

async function abrirCocina(page: Page, orders: unknown[]) {
  await gotoApp(page, {
    login: { customer: { phone: '900000001', name: 'Dueño', points: 0 }, isAdmin: true, token: 't' },
    'admin-orders': { orders, truncated: false },
    '*': { success: true },
  });
  await entrarConTelefono(page);
  await page.waitForFunction(() => (window as any).cust);
  await page.evaluate(() => { const w = window as any; w.loadAdmin(); });
  await page.waitForFunction(() => typeof (window as any).abrirCocina === 'function');
  await page.evaluate(() => (window as any).abrirCocina());
}

test('el mensaje al grupo dice COBRAR solo si hay que cobrar', async ({ page }) => {
  await abrirCocina(page, [COD, YAPE]);
  for (const [o, cobra] of [[COD, true], [YAPE, false]] as const) {
    await page.evaluate(() => { const w = window as any; w.__abiertos = []; w.open = (u: string) => { w.__abiertos.push(u); return null; }; });
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
