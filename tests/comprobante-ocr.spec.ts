import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// #28 — La lectura del comprobante, del lado del panel.
//
// El parser está probado contra el servidor en tests-api/comprobante-ocr. Acá se fija lo
// único que decide si esto ayuda o hace daño: **que en ningún estado parezca que confirma
// el pago**. Una captura se edita en dos minutos, así que el veredicto verde tiene que
// seguir diciendo que confirme contra su cuenta, y el estado "no se pudo leer" tiene que
// verse — si se callara, la ausencia de aviso parecería aprobación.
//
// El motor de OCR (Tesseract.js, desde CDN) NO se carga en los tests: helpers.ts aborta los
// scripts de terceros a propósito. Eso hace que estas pruebas ejerciten justamente el camino
// que más importa proteger — el de "el lector no está disponible" — y por eso el veredicto
// se inyecta por el mock del servidor en los demás casos.

const ADMIN = {
  login: { customer: { phone: '900000099', name: 'Dueño', points: 0, credit_balance: 0, total_orders: 0 }, isAdmin: true, token: 'tok-admin' },
};

const PEDIDO_CON_COMPROBANTE = {
  id: 'ord-1',
  ref: 'ORD-1',
  status: 'RECIBIDO',
  payment_status: 'pending',
  payment_method: 'yape',
  customer_name: 'Ana',
  customer_address: 'Av. España 123, ref colegio',
  contact_phone: '987654321',
  total: 26.9,
  delivery_fee: 6,
  items: [],
  created_at: '2026-09-10T18:00:00Z',
  receipt_path: 'ORD-1.jpg',
};

async function abrirCola(page: any, extra: Record<string, unknown> = {}) {
  const calls = await gotoApp(page, {
    ...ADMIN,
    'admin-orders': { orders: [PEDIDO_CON_COMPROBANTE], truncated: false },
    'admin-receipt-url': { url: 'about:blank' },
    ...extra,
  });
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000099');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();
  await page.locator('[onclick*="admin_home"]').first().click();
  return calls;
}

test('sin el lector disponible, el comprobante se sigue abriendo igual que siempre', async ({ page }) => {
  // Es el camino que de verdad hay que proteger: el OCR es un extra y no puede convertirse
  // en un requisito para ver la imagen que ya se veía antes.
  const calls = await abrirCola(page);
  await page.locator('[onclick*="viewReceipt"]').first().click();
  expect(calls.filter((c) => c.action === 'admin-receipt-url')).toHaveLength(1);
  // Y el fallo se DICE, en vez de quedar en silencio pareciendo aprobación.
  await expect(page.locator('text=/No se pudo leer el comprobante/')).toBeVisible();
  await expect(page.locator('text=/Revísalo a ojo, como siempre/')).toBeVisible();
});

test('el veredicto verde NUNCA dice que el pago está confirmado', async ({ page }) => {
  // Es la línea más importante de todo el ítem: leer una captura no prueba nada, porque una
  // captura se edita. Si este texto desaparece, la ayuda se vuelve una trampa.
  await abrirCola(page);
  await page.evaluate(() => {
    (window as any).receiptOcrState['ORD-1'] = {
      fields: { amount: 26.9, opNumber: '01234567', dateText: '10/09/2026' },
      checks: { verdict: 'ok', amountRead: 26.9, expected: 26.9, amountMatches: true, duplicateOpRefs: [] },
    };
    (window as any).render();
  });
  await expect(page.locator('text=/coincide con el pedido/')).toBeVisible();
  await expect(page.locator('text=/Igual confirma contra tu cuenta/')).toBeVisible();
  await expect(page.locator('text=/una captura se puede editar/')).toBeVisible();
});

test('un monto que no cuadra muestra los dos números', async ({ page }) => {
  // "No cuadra" sin decir cuánto obliga a abrir la imagen igual, que es el trabajo que esto
  // venía a ahorrar.
  await abrirCola(page);
  await page.evaluate(() => {
    (window as any).receiptOcrState['ORD-1'] = {
      fields: { amount: 20, opNumber: null, dateText: null },
      checks: { verdict: 'revisar', amountRead: 20, expected: 26.9, amountMatches: false, duplicateOpRefs: [] },
    };
    (window as any).render();
  });
  await expect(page.locator('text=/La captura dice S\\/20\\.00 y el pedido es S\\/26\\.90/')).toBeVisible();
});

test('la misma operación en otro pedido se avisa nombrando cuál', async ({ page }) => {
  // Es lo que el hash de la imagen (#29) no puede ver: recapturar la pantalla cambia el
  // hash, no el número de operación.
  await abrirCola(page);
  await page.evaluate(() => {
    (window as any).receiptOcrState['ORD-1'] = {
      fields: { amount: 26.9, opNumber: '01234567', dateText: null },
      checks: { verdict: 'revisar', amountRead: 26.9, expected: 26.9, amountMatches: true, duplicateOpRefs: ['ORD-7'] },
    };
    (window as any).render();
  });
  await expect(page.locator('text=/ya respalda ORD-7/')).toBeVisible();
  await expect(page.locator('text=/no puede pagar dos pedidos/')).toBeVisible();
});

test('"no se reconoció el monto" se muestra y aclara que no equivale a estar bien', async ({ page }) => {
  await abrirCola(page);
  await page.evaluate(() => {
    (window as any).receiptOcrState['ORD-1'] = {
      fields: { amount: null, opNumber: null, dateText: null },
      checks: { verdict: 'sin_lectura', amountRead: null, expected: 26.9, amountMatches: null, duplicateOpRefs: [] },
    };
    (window as any).render();
  });
  await expect(page.locator('text=/No se reconoció el monto/')).toBeVisible();
  await expect(page.locator('text=/no significa que esté bien/')).toBeVisible();
});

test('un pedido sin comprobante no muestra ningún bloque de lectura', async ({ page }) => {
  await gotoApp(page, {
    ...ADMIN,
    'admin-orders': { orders: [{ ...PEDIDO_CON_COMPROBANTE, receipt_path: null }], truncated: false },
  });
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000099');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();
  await page.locator('[onclick*="admin_home"]').first().click();
  await expect(page.locator('[onclick*="viewReceipt"]')).toHaveCount(0);
  await expect(page.locator('text=/Leyendo el comprobante/')).toHaveCount(0);
});
