import { test, expect } from '@playwright/test';
import { gotoApp, entrarConTelefono } from './helpers';

// «Algo salió mal» (pantalla 35, maqueta docs/maquetas/aprobadas/35-algo-salio-mal.png).
// Se entra desde el detalle de un pedido ENTREGADO, dentro de las 48 h que dicen los
// Términos. Lo que no puede pasar en silencio: que el botón aparezca pasado el plazo (lleva
// a una pantalla que dice que no), que no aparezca dentro del plazo (el cliente no tiene por
// dónde reclamar), o que se mande el reporte sin el motivo que marcó.

const HACE = (h: number) => new Date(Date.now() - h * 3600000).toISOString();
const base = {
  customer_name: 'Cliente de Prueba',
  customer_address: 'Av. Larco 100',
  summary: '1x SIGNATURE THE ORIGINAL',
  total: 22,
  payment_status: 'paid',
  payment_method: 'yape',
  status: 'ENTREGADO',
  date: '21/09/2026',
};
const RECIENTE = { ...base, id: 'ord-r', ref: 'ORD-RECI-0001', created_at: HACE(3), delivered_at: HACE(2) };
const VIEJO = { ...base, id: 'ord-v', ref: 'ORD-VIEJ-0002', created_at: HACE(60), delivered_at: HACE(49) };

async function abrirPedido(page, ref: string) {
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await entrarConTelefono(page);
  await page.locator('[onclick*="sndScreen=\'p_orders\';loadMyOrders()"]').click();
  await page.locator('text=' + ref).click();
}

const LOGIN = { customer: { phone: '900000001', name: 'Cliente de Prueba', points: 0, credit_balance: 0 }, isAdmin: false, token: 'tok' };

test('dentro de las 48 h: marca un motivo y el reporte sale con ESE motivo', async ({ page }) => {
  let enviado: any = null;
  await gotoApp(page, {
    login: LOGIN,
    'my-orders': { orders: [RECIENTE] },
    'my-order-problems': { problems: [] },
    'report-order-problem': (b: any) => { enviado = b; return { success: true, respondeAntesDe: new Date(Date.now() + 3600000).toISOString() }; },
  });
  await abrirPedido(page, RECIENTE.ref);
  await page.getByRole('button', { name: /Algo salió mal · hasta 48 h/ }).click();

  await expect(page.getByText('Dime qué pasó.')).toBeVisible();
  // Sin marcar nada no se manda: lo dice, no se queda callado.
  await page.getByRole('button', { name: 'Enviar el reclamo' }).click();
  await expect(page.getByText('Marca qué pasó.')).toBeVisible();
  expect(enviado).toBeNull();

  await page.getByRole('radio', { name: /Llegó frío/ }).click();
  await expect(page.getByRole('radio', { name: /Llegó frío/ })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: 'Enviar el reclamo' }).click();
  await expect(page.getByText('Listo. Ya lo tengo.')).toBeVisible();
  expect(enviado.ref).toBe(RECIENTE.ref);
  expect(enviado.motivo).toBe('frio');
  await expect(page.getByText(/Sando responde antes de/)).toBeVisible();
});

test('pasadas las 48 h el detalle ya no ofrece reportar', async ({ page }) => {
  await gotoApp(page, { login: LOGIN, 'my-orders': { orders: [VIEJO] } });
  await abrirPedido(page, VIEJO.ref);
  await expect(page.getByText('¡Entregado!')).toBeVisible();
  await expect(page.getByRole('button', { name: /Algo salió mal/ })).toHaveCount(0);
});

test('los Términos dicen el mismo plazo que la pantalla: 48 horas', async ({ page }) => {
  await gotoApp(page);
  const texto = await page.evaluate(() => (window as any).sPReturns());
  expect(texto).toContain('dentro de las 48 horas siguientes a la entrega');
  expect(texto).not.toContain('2 horas siguientes');
});
