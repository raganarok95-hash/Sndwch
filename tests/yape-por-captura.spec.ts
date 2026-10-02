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

// El celular del CLIENTE lee su captura apenas la sube (dueño, 2026-10-02: «sí hazlo, es
// mejor»): no depende de que el panel esté abierto. Modo de fallo: el silencio — si este paso no
// se dispara, el pedido vuelve a esperar al dueño y el cliente se queda sin respuesta.
test('el cliente sube la captura, su celular la lee y ve el pago confirmado', async ({ page }) => {
  const lecturas: any[] = [];
  await page.addInitScript(() => { (window as any).Tesseract = { recognize: async () => ({ data: { text: '¡Yapeaste!\n710.10\nNro. de celular *** *** 640\nNro. de operación 12345678' } }) }; });
  await gotoApp(page, {
    'upload-receipt': { success: true },
    'cliente-lee-captura': (b: any) => { lecturas.push(b); return { success: true, confirmado: true }; },
    '*': { success: true },
  });
  await page.evaluate(() => { const w = window as any; w._lRef = 'ORD-PRUEBA-99'; w.uploadReceiptBase64('AAAA'); });
  await expect.poll(() => lecturas.length, { message: 'el celular del cliente no leyó la captura' }).toBe(1);
  expect(lecturas[0].ref).toBe('ORD-PRUEBA-99');
  expect(lecturas[0].text).toContain('12345678');
  await expect.poll(() => page.evaluate(() => (window as any).receiptUploadState)).toBe('confirmado');
});

// Una captura pendiente leída con la versión anterior del lector se relee sola una vez con las
// reglas de hoy (2026-10-02: la prueba del dueño quedó en «revisar» por la regla vieja de la fecha).
test('una captura pendiente leída con el lector anterior se relee sola una vez', async ({ page }) => {
  const ocr: any[] = [];
  const VIEJO = { ...PEDIDO, id: '44444444-4444-4444-8444-444444444444', ref: 'R-4444', receipt_ocr: { amount: 0.1, opNumber: '13286952', dateText: null } };
  await page.addInitScript(() => { (window as any).Tesseract = { recognize: async () => ({ data: { text: 'x' } }) }; });
  await gotoApp(page, {
    login: { customer: { phone: '900000001', name: 'Dueño', points: 0 }, isAdmin: true, token: 't' },
    'admin-orders': { orders: [VIEJO], truncated: false },
    'admin-receipt-url': { url: 'https://ejemplo.invalid/c.jpg' },
    'admin-receipt-ocr': (b: any) => { ocr.push(b); return { success: true, fields: {}, checks: {}, auto: { confirmar: true, confirmado: true, motivo: 'ok' }, order: { ...VIEJO, payment_status: 'paid' } }; },
    '*': { success: true },
  });
  await entrarConTelefono(page);
  await page.waitForFunction(() => (window as any).cust);
  await page.evaluate(() => { try { localStorage.setItem('sw_abro_con', new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' })); } catch (e) {} (window as any).loadAdmin(); });
  await page.waitForFunction(() => typeof (window as any).abrirCocina === 'function');
  await page.evaluate(() => (window as any).abrirCocina());
  await expect.poll(() => ocr.length, { message: 'la captura vieja no se releyó' }).toBe(1);
  expect(ocr[0].ref).toBe('R-4444');
});
