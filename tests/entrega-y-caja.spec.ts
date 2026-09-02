import { test, expect } from '@playwright/test';
import { gotoApp, APP_FILE, mockBackend } from './helpers';

// #19 (confirmación de entrega por link), #40 (cierre de caja) y #20 (auto-cierre de la
// calificación), del lado del cliente.
//
// El cálculo del cierre de caja está probado contra el servidor en tests-api/cierre-caja.
// Acá se fija lo que decide si sirven:
//   · el link del motorizado tiene que cerrar el pedido SOLO, sin pedirle un toque más a
//     alguien que está en la puerta con las manos ocupadas,
//   · el cierre de caja tiene que mostrar arriba lo que de verdad le queda al dueño, no el
//     bruto — poner el bruto sería repetir la mentira que la pantalla existe para deshacer,
//   · la tarjeta de calificar tiene que dejar de aparecer, pero solo para quien NO calificó.

const ADMIN = {
  login: { customer: { phone: '900000099', name: 'Dueño', points: 0, credit_balance: 0, total_orders: 0 }, isAdmin: true, token: 'tok-admin' },
};

// ── #19 ────────────────────────────────────────────────────────────────────────────────

test('el link del motorizado confirma la entrega solo, sin pedir un toque más', async ({ page }) => {
  const calls = await mockBackend(page, {
    'confirm-delivery': { success: true, ref: 'ORD-123', alreadyDelivered: false },
  });
  await page.goto(APP_FILE + '?entrega=' + 'a'.repeat(32));
  await expect(page.locator('text=Entrega confirmada')).toBeVisible();
  await expect(page.locator('text=/ORD-123/')).toBeVisible();

  const enviadas = calls.filter((c) => c.action === 'confirm-delivery');
  expect(enviadas).toHaveLength(1);
  expect(enviadas[0].body.deliveryToken).toBe('a'.repeat(32));
});

test('un link ya usado lo dice claro, en vez de parecer un error', async ({ page }) => {
  // Pasa de verdad: el motorizado toca el link dos veces, o el dueño ya cerró el pedido a
  // mano. Mostrar un error rojo lo mandaría a llamar por teléfono sin necesidad.
  await mockBackend(page, {
    'confirm-delivery': { success: true, ref: 'ORD-123', alreadyDelivered: true },
  });
  await page.goto(APP_FILE + '?entrega=' + 'b'.repeat(32));
  await expect(page.locator('text=Ya estaba confirmado')).toBeVisible();
  await expect(page.locator('text=/no hace falta hacer nada más/')).toBeVisible();
});

test('un link inválido dice qué hacer, no solo que falló', async ({ page }) => {
  // Un "algo salió mal" deja al motorizado parado en la puerta sin saber a quién escribir.
  await mockBackend(page, {
    'confirm-delivery': () => { throw new Error('Este link ya se usó o no es válido.'); },
  });
  await page.goto(APP_FILE + '?entrega=' + 'c'.repeat(32));
  await expect(page.locator('text=No se pudo confirmar')).toBeVisible();
  await expect(page.locator('text=/Avisa por WhatsApp/')).toBeVisible();
});

test('la pantalla del motorizado no muestra la navegación de la app', async ({ page }) => {
  // Quien abre este link no es un cliente: ofrecerle "Pedido // Puntos" lo invita a
  // perderse en una app que no es suya.
  await mockBackend(page, { 'confirm-delivery': { success: true, ref: 'ORD-9', alreadyDelivered: false } });
  await page.goto(APP_FILE + '?entrega=' + 'd'.repeat(32));
  await expect(page.locator('text=Entrega confirmada')).toBeVisible();
  await expect(page.locator('.bottom-nav')).toHaveCount(0);
});

// ── #40 ────────────────────────────────────────────────────────────────────────────────

const CAJA = {
  orders: 3,
  gross: 100,
  deliveryPassThrough: 18,
  cardFees: 2.2,
  creditUsed: 30,
  cashIn: 67.8,
  businessRevenue: 49.8,
  culqiFeeRate: 0.055,
  byMethod: [
    { method: 'card', label: 'Tarjeta (Culqi)', orders: 1, gross: 40, net: 34 },
    { method: 'credit', label: 'Crédito interno', orders: 1, gross: 30, net: 24 },
  ],
  pendingConfirmation: { orders: 2, amount: 55 },
};

async function entrarAlCierre(page: any, datos: unknown) {
  await gotoApp(page, { ...ADMIN, 'admin-cash-close': datos });
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000099');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();
  await page.locator('[onclick*="admin_home"]').first().click();
  await page.locator('[onclick*="loadCashClose()"]').first().click();
}

test('arriba va lo que de verdad le queda al dueño, no el bruto', async ({ page }) => {
  await entrarAlCierre(page, CAJA);
  await expect(page.locator('text=/S\\/49\\.80/')).toBeVisible();
  await expect(page.locator('text=/TUYO, DESPUÉS DEL REPARTO Y LA COMISIÓN/')).toBeVisible();
});

test('el desglose explica POR QUÉ el bruto no es lo que queda', async ({ page }) => {
  // Sin las tres restas explicadas, el número grande parece arbitrario y no se le cree.
  await entrarAlCierre(page, CAJA);
  await expect(page.locator('text=/Pagado con crédito interno/')).toBeVisible();
  await expect(page.locator('text=/Hoy no llegó nada/')).toBeVisible();
  await expect(page.locator('text=/Comisión de Culqi/')).toBeVisible();
  await expect(page.locator('text=/Reparto \\(va al motorizado\\)/')).toBeVisible();
  await expect(page.locator('text=/al motorizado se le paga igual/')).toBeVisible();
});

test('lo sin confirmar se muestra aparte y dice que NO está sumado', async ({ page }) => {
  await entrarAlCierre(page, CAJA);
  await expect(page.locator('text=SIN CONFIRMAR //')).toBeVisible();
  await expect(page.locator('text=/No están sumados arriba/')).toBeVisible();
});

test('un día sin nada sin confirmar no muestra la franja naranja', async ({ page }) => {
  await entrarAlCierre(page, { ...CAJA, pendingConfirmation: { orders: 0, amount: 0 } });
  await expect(page.locator('text=SIN CONFIRMAR //')).toHaveCount(0);
});

// ── #20 ────────────────────────────────────────────────────────────────────────────────

const PEDIDO_ENTREGADO = (dias: number) => ({
  id: 'ord-' + dias,
  ref: 'ORD-' + dias,
  status: 'ENTREGADO',
  payment_status: 'paid',
  payment_method: 'yape',
  total: 26.9,
  delivery_fee: 6,
  items: [],
  created_at: new Date(Date.now() - dias * 86400000).toISOString(),
  delivered_at: new Date(Date.now() - dias * 86400000).toISOString(),
});

async function verMisPedidos(page: any, pedidos: unknown[]) {
  await gotoApp(page, {
    login: { customer: { phone: '900000001', name: 'Ana', points: 0, credit_balance: 0, total_orders: 3 }, isAdmin: false, token: 'tok-ana' },
    'my-orders': { orders: pedidos },
  });
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000001');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();
  await page.locator('[onclick*="p_orders"]').first().click();
}

test('un pedido reciente sí pide calificación', async ({ page }) => {
  await verMisPedidos(page, [PEDIDO_ENTREGADO(1)]);
  await page.locator('text=ORD-1').first().click();
  await expect(page.locator('text=/¿Cómo estuvo tu pedido\\?/')).toBeVisible();
});

test('un pedido viejo deja de pedirla, en vez de arrastrar la tarjeta para siempre', async ({ page }) => {
  // A los 14 días el cliente ya no se acuerda de ese sándwich, y la tarjeta le quita fuerza
  // a la del pedido reciente, que es la única que se va a responder.
  await verMisPedidos(page, [PEDIDO_ENTREGADO(30)]);
  await page.locator('text=ORD-30').first().click();
  await expect(page.locator('text=/¿Cómo estuvo tu pedido\\?/')).toHaveCount(0);
});
