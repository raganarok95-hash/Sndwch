import { test, expect } from '@playwright/test';
import { gotoApp, entrarConTelefono } from './helpers';

// YAPE POR CAPTURA (2026-10-02): Cocina abierta lee SOLA la captura nueva de un pedido Yape sin
// confirmar y muestra lo que decidió el servidor. Modo de fallo: el silencio — si la lectura no
// se dispara, el pedido espera a que alguien lo mire, que es justo lo que se quería quitar.
// El lector (Tesseract) se reemplaza por uno falso; la decisión es del servidor (mock).
const PEDIDO = {
  id: '33333333-3333-4333-8333-333333333333', ref: 'R-3333', status: 'RECIBIDO', payment_status: 'pending',
  payment_method: 'yape', total: 27.9, delivery_fee: 5, summary: 'pedido', customer_name: 'Ana',
  customer_phone: '900000002', customer_address: 'Calle 1', created_at: new Date().toISOString(),
  receipt_path: 'r/3333.jpg', receipt_ocr: null,
};

test('la captura nueva se lee sola y la tarjeta muestra que se confirmó', async ({ page }) => {
  const ocr: any[] = [];
  await page.addInitScript(() => { (window as any).Tesseract = { recognize: async () => ({ data: { text: 'S/ 27.90 Nro. de operación 12345678 02 oct. 2026' } }) }; });
  await gotoApp(page, {
    login: { customer: { phone: '900000001', name: 'Dueño', points: 0 }, isAdmin: true, token: 't' },
    'admin-orders': { orders: [PEDIDO], truncated: false },
    'admin-receipt-url': { url: 'https://ejemplo.invalid/c.jpg' },
    'admin-receipt-ocr': (b: any) => { ocr.push(b); return { success: true, fields: {}, checks: {}, auto: { confirmar: true, confirmado: true, motivo: 'Monto exacto, operación nueva, de hoy.' }, order: { ...PEDIDO, payment_status: 'paid' } }; },
    '*': { success: true },
  });
  await entrarConTelefono(page);
  await page.waitForFunction(() => (window as any).cust);
  await page.evaluate(() => { try { localStorage.setItem('sw_abro_con', new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' })); } catch (e) {} (window as any).loadAdmin(); });
  await page.waitForFunction(() => typeof (window as any).abrirCocina === 'function');
  await page.evaluate(() => (window as any).abrirCocina());
  await expect.poll(() => ocr.length, { message: 'la captura no se leyó sola' }).toBe(1);
  expect(ocr[0].ref).toBe(PEDIDO.ref);
  await expect(page.locator(`[data-pedido="${PEDIDO.id}"] [data-captura="confirmada"]`)).toBeVisible();
});
