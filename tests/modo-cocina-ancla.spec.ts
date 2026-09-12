import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// El modo cocina se usa en un celular dedicado, con las manos ocupadas, mirando UN pedido
// mientras se arma. El poll trae pedidos nuevos cada 25 s y sortedActiveOrders() los ordena
// por prioridad, así que uno nuevo puede meterse DELANTE del que está en pantalla.
//
// Con el ancla en el ÍNDICE, eso cambiaba el pedido bajo el dedo: medido, el botón de abajo
// —mismo sitio, mismo tamaño, mismo color— pasaba de updateStatus('ROSA','EN CAMINO') a
// confirmAndAdvance('NUEVO'). Confirmar un pago Yape que nadie miró contra la cuenta es
// justo lo que el lector de comprobantes existe para NO hacer solo.
//
// MODO DE FALLO: SILENCIO. Volver a `ao[focusIdx]` no rompe nada visible ni falla ningún
// typecheck. Solo vuelve a cambiar el pedido bajo el dedo, y eso solo se nota el día que
// se confirma un pago que no entró.

const ahora = Date.now();
const ped = (id: string, status: string, min: number, extra: any = {}) => ({
  id, ref: 'SND-' + id, status, payment_status: 'paid', payment_method: 'card',
  customer_name: 'Cliente ' + id, customer_address: 'Av. Larco 1234, Trujillo',
  customer_phone: '987654321', notes: '', total: 20, date: '12/09', summary: '1 item',
  created_at: new Date(ahora - 1000 * 60 * min).toISOString(),
  items: [{ sig: 'SIG01', size: '15', qty: 1 }], ...extra,
});

// Rosa lleva 40 min y ya está en PREPARANDO. El que entra después no pagó todavía, así que
// sortedActiveOrders() lo pone primero.
const ANTES = [ped('ROSA', 'PREPARANDO', 40), ped('JORGE', 'EN CAMINO', 20)];
const NUEVO = ped('NUEVO', 'RECIBIDO', 0, { payment_status: 'pending', payment_method: 'yape' });

async function entrarACocina(page: any, pedidos: any[]) {
  await page.evaluate(async (o: any) => {
    if (typeof (window as any).loadAdminBundle === 'function') {
      try { await (window as any).loadAdminBundle(); } catch (e) { /* ya cargado */ }
    }
    (window as any).adminOrders = o;
    (window as any).enterFocusMode();
  }, pedidos);
}

const pedidoEnPantalla = (page: any) =>
  page.evaluate(() => (document.body.innerText.match(/Cliente \w+/) || [''])[0]);

const accionPrincipal = (page: any) =>
  page.evaluate(() => {
    const b = [...document.querySelectorAll('button')]
      .map((x) => x.getAttribute('onclick') || '')
      .find((s) => /updateStatus|confirmAndAdvance/.test(s));
    return b || '';
  });

test('un pedido nuevo NO cambia el que está en pantalla ni el botón de abajo', async ({ page }) => {
  await gotoApp(page);
  await entrarACocina(page, ANTES);

  expect(await pedidoEnPantalla(page)).toBe('Cliente ROSA');
  const antes = await accionPrincipal(page);
  expect(antes).toContain('ROSA');

  // Llega un pedido nuevo por el mismo camino que usa startPoll().
  await page.evaluate((n: any) => {
    (window as any).adminOrders = [n, ...(window as any).adminOrders];
    (window as any).render();
  }, NUEVO);

  // Sigue viendo a Rosa, y el botón sigue siendo el de Rosa.
  expect(await pedidoEnPantalla(page)).toBe('Cliente ROSA');
  expect(await accionPrincipal(page)).toBe(antes);
});

test('pero SÍ se entera: el pedido que se metió delante se anuncia, sin robarle la pantalla', async ({ page }) => {
  await gotoApp(page);
  await entrarACocina(page, ANTES);
  await page.evaluate((n: any) => {
    (window as any).adminOrders = [n, ...(window as any).adminOrders];
    (window as any).render();
  }, NUEVO);

  // Esconder el pedido nuevo sería peor que el salto: quien cocina no se enteraría de que
  // entró algo urgente mientras tenía las manos ocupadas.
  const aviso = page.locator('text=/pedido entró antes que este/');
  await expect(aviso).toBeVisible();
  // Y es accionable de un toque, no solo un cartel.
  await aviso.click();
  expect(await pedidoEnPantalla(page)).toBe('Cliente NUEVO');
});

test('si el pedido anclado desaparece, no salta al primero: toma el que ocupa su lugar', async ({ page }) => {
  await gotoApp(page);
  await entrarACocina(page, ANTES);
  // Avanza al segundo (JORGE) y entrégalo: quien cocina venía bajando en orden, y
  // devolverlo al principio le hace repetir una vista que ya atendió.
  await page.evaluate(() => (window as any).focusStep(1));
  expect(await pedidoEnPantalla(page)).toBe('Cliente JORGE');

  await page.evaluate(() => {
    (window as any).adminOrders = (window as any).adminOrders.filter((o: any) => o.id !== 'JORGE');
    (window as any).render();
  });
  // Queda solo ROSA, que pasa a ocupar ese lugar — no hay a dónde más caer, pero el índice
  // no puede quedar fuera de rango ni la pantalla en blanco.
  expect(await pedidoEnPantalla(page)).toBe('Cliente ROSA');
});
