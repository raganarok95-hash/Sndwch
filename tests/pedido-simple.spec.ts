import { test, expect } from '@playwright/test';
import { gotoApp, mockBackend, stubWindowOpen, pedirUnSignature, ponerRecibe, ponerDireccion, subirCapturaAlPagar } from './helpers';

// EL PEDIDO SIMPLE (dueño, 2026-11-02: «Sí a todo»; docs/maquetas/aprobadas/pedido-simple-*.png).
// Promesa: elegir la captura en la 31 crea el pedido, la sube con SU referencia y la lee sola; la
// pantalla dice «en la cocina» solo si el servidor confirmó el pago.
// ⚠ MODO DE FALLO: SILENCIO. Si la captura no viaja con el pedido, el pedido queda pendiente sin
// que nadie lo note y se cancela solo; si se dice «en la cocina» sin pago, el cliente espera algo
// que nadie está cocinando.

async function hastaLa31(page: any, confirmado: boolean, motivo: any = null) {
  await page.addInitScript(() => { (window as any).Tesseract = { recognize: async () => ({ data: { text: 'Yapeaste S/ 27.90' } }) }; });
  const calls = await gotoApp(page, {
    'place-order': (body: any) => ({ success: true, order: { id: '55555555-5555-4555-8555-555555555555', ref: body.ref, status: 'RECIBIDO', payment_status: 'pending', payment_method: 'yape', total: body.total } }),
    'upload-receipt': { success: true },
    'cliente-lee-captura': { success: true, confirmado, motivo },
    '*': { success: true },
  });
  await pedirUnSignature(page, { size: '15' });
  await ponerDireccion(page);
  await ponerRecibe(page);
  await page.locator('.m30-go .oro').click();
  await page.locator('.m31.y').waitFor();
  return calls;
}

test('subir la captura en la 31 crea el pedido, la sube con su referencia y, si cuadra, dice «en la cocina»', async ({ page }) => {
  const calls = await hastaLa31(page, true);
  await subirCapturaAlPagar(page);
  await expect(page.locator('.m06 [data-estado-pago="en-la-cocina"]')).toBeVisible();
  const po = calls.find((c) => c.action === 'place-order');
  expect(po, 'la captura no creó el pedido').toBeTruthy();
  const up = calls.find((c) => c.action === 'upload-receipt');
  expect(up, 'la captura no se subió').toBeTruthy();
  expect(up!.body.ref).toBe(po!.body.ref);
  expect(calls.find((c) => c.action === 'cliente-lee-captura')!.body.ref).toBe(po!.body.ref);
});

test('si la captura no cuadra, no dice «en la cocina»: queda en revisión', async ({ page }) => {
  await hastaLa31(page, false);
  await subirCapturaAlPagar(page);
  await expect(page.locator('.m06 [data-estado-pago="revisando"]')).toBeVisible();
  await expect(page.locator('.m06 [data-estado-pago="en-la-cocina"]')).toHaveCount(0);
});

// Promesa (dueño, 2026-11-02: yapeó S/23.90 por un pedido de S/24.90 y la app solo decía «la
// revisamos»): si la captura no cuadra por algo que el cliente puede corregir, se le dice qué y puede
// subir la correcta ahí mismo. Fallo silencioso: el pedido espera horas y se cancela solo.
test('si la captura no cuadra por el monto, lo dice y deja subir otra', async ({ page }) => {
  const calls = await hastaLa31(page, false, { codigo: 'monto', leido: 23.9, pedido: 24.9 });
  await subirCapturaAlPagar(page);
  await expect(page.locator('.m06 [data-estado-pago="captura-no-cuadra"]')).toBeVisible();
  await expect(page.locator('.m06 [data-motivo-captura="monto"]')).toBeVisible();
  const antes = calls.filter((c) => c.action === 'upload-receipt').length;
  const { CAPTURA_PNG } = await import('./helpers');
  await page.locator('[data-accion="subir-otra-captura"] input').setInputFiles({ name: 'otra.png', mimeType: 'image/png', buffer: CAPTURA_PNG });
  await expect.poll(() => calls.filter((c) => c.action === 'upload-receipt').length).toBe(antes + 1);
});

// Promesa (dueño, 2026-11-02: «si la captura no la lee debe darle la opción de enviar pedido y captura
// por whatsapp»): cuando la captura no se confirma, el cliente puede mandar su pedido por WhatsApp al
// número del negocio, con el enlace a ESE pedido. Fallo silencioso: el cliente pagó, no sabe qué hacer y
// el pedido se cancela solo.
test('si la captura no se confirma, deja mandar el pedido por WhatsApp con el enlace a ese pedido', async ({ page }) => {
  // Espía con defineProperty: el stub de gotoApp y el blindaje del router reemplazarían una asignación.
  await page.addInitScript(() => {
    const w = window as any; w.__abiertos = [];
    const espia = (u: string) => { w.__abiertos.push(u); return null; };
    Object.defineProperty(window, 'open', { get: () => espia, set: () => {}, configurable: true });
  });
  const calls = await hastaLa31(page, false, { codigo: 'ilegible' });
  await subirCapturaAlPagar(page);
  await page.locator('[data-accion="mandar-por-whatsapp"]').click();
  const ref = calls.find((c) => c.action === 'place-order')!.body.ref;
  const abiertos: string[] = await page.evaluate(() => (window as any).__abiertos);
  const wa = abiertos.find((u) => u.startsWith('https://wa.me/'));
  expect(wa, 'no abrió WhatsApp').toBeTruthy();
  expect(wa).toContain('wa.me/51930957640');
  expect(new URL(wa!).searchParams.get('text')).toContain('?pedido=' + encodeURIComponent(ref));
});

// Promesa: si el dueño aprueba el pago a mano (panel o WhatsApp), la pantalla del cliente pasa sola a
// «en la cocina». Fallo silencioso: el cliente ve «la estamos revisando» con su pedido ya cocinándose,
// y escribe o lo cancela.
test('si el pago se aprueba a mano, la pantalla del cliente se entera sola', async ({ page }) => {
  await page.clock.install();
  let pagado = false;
  const calls = await hastaLa31(page, false, { codigo: 'ilegible' });
  await page.route('**/functions/v1/api', async (route) => {
    const b = route.request().postDataJSON();
    if (b && b.action === 'my-orders') {
      const ref = calls.find((c) => c.action === 'place-order')!.body.ref;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ orders: [{ id: '55555555-5555-4555-8555-555555555555', ref, status: pagado ? 'PREPARANDO' : 'RECIBIDO', payment_status: pagado ? 'paid' : 'pending', payment_method: 'yape' }] }) });
    }
    return route.fallback();
  });
  await subirCapturaAlPagar(page);
  await expect(page.locator('.m06 [data-estado-pago="captura-no-cuadra"]')).toBeVisible();
  await page.clock.runFor(16000);
  await expect(page.locator('.m06 [data-estado-pago="captura-no-cuadra"]')).toBeVisible();
  pagado = true;
  await page.clock.runFor(16000);
  await expect(page.locator('.m06 [data-estado-pago="en-la-cocina"]')).toBeVisible();
});

// TU PEDIDO, EN VIVO (dueño, 2026-11-02: «Dale, hazlo como propones»; aprobadas/pedido-en-vivo.png).
// Promesa: la pantalla del pedido avanza sola por los cuatro pasos y la barra de abajo es lo que toca
// hacer ahora; en camino, «Ya me llegó» cierra el pedido. Fallo silencioso: el cliente ve un estado
// viejo, no sabe que ya salió y no puede decir que llegó.
test('la pantalla del pedido avanza sola hasta «Ya me llegó»', async ({ page }) => {
  await page.clock.install();
  let st = 'PREPARANDO';
  const calls = await hastaLa31(page, true);
  await page.route('**/functions/v1/api', async (route) => {
    const b = route.request().postDataJSON();
    if (b && b.action === 'my-orders') {
      const ref = calls.find((c) => c.action === 'place-order')!.body.ref;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ orders: [{ id: '55555555-5555-4555-8555-555555555555', ref, status: st, payment_status: 'paid', payment_method: 'yape' }] }) });
    }
    return route.fallback();
  });
  await subirCapturaAlPagar(page);
  await expect(page.locator('.m06 .pasos[data-etapa="cocina"]')).toBeVisible();
  st = 'EN CAMINO';
  await page.clock.runFor(16000);
  await expect(page.locator('.m06 .pasos[data-etapa="camino"]')).toBeVisible();
  await page.locator('[data-accion="ya-me-llego"]').click();
  await expect.poll(() => calls.filter((c) => c.action === 'confirm-my-delivery').length).toBe(1);
  await expect(page.locator('.m06 .pasos[data-etapa="llego"]')).toBeVisible();
  await expect(page.locator('.m06 .califica')).toBeVisible();
  await page.locator('[data-accion="pedir-otra-vez"]').click();
  await expect.poll(() => page.evaluate(() => (window as any).cart.length)).toBe(1);
});

// Promesa (2026-11-02, «¿Qué más podemos mejorar?»): si el cliente cierra o recarga la app con un pedido
// en curso, la puerta le ofrece volver a su seguimiento. Fallo silencioso: sale a Yape, vuelve, y no
// encuentra su pedido; lo vuelve a pedir o escribe angustiado.
test('con un pedido en curso, al volver a abrir la app la puerta lleva a su seguimiento', async ({ page }) => {
  const calls = await hastaLa31(page, true);
  await page.route('**/functions/v1/api', async (route) => {
    const b = route.request().postDataJSON();
    if (b && b.action === 'my-orders') {
      const ref = calls.find((c) => c.action === 'place-order')!.body.ref;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ orders: [{ id: '55555555-5555-4555-8555-555555555555', ref, status: 'EN CAMINO', payment_status: 'paid', payment_method: 'yape' }] }) });
    }
    return route.fallback();
  });
  await subirCapturaAlPagar(page);
  await expect(page.locator('.m06 .pasos')).toBeVisible();
  await page.reload();
  await page.locator('[data-accion="volver-al-pedido"]').click();
  await expect(page.locator('.m06 .pasos[data-etapa="camino"]')).toBeVisible();
  await expect(page.locator('[data-accion="ya-me-llego"]')).toBeVisible();
});

// Promesa: mientras la cocina no empezó, el cliente cancela desde el mismo seguimiento.
// Fallo silencioso: no encuentra cómo cancelar, el pedido se cocina y se pierde la venta y el insumo.
test('mientras la cocina no empieza, se cancela desde el seguimiento', async ({ page }) => {
  const calls = await hastaLa31(page, false, { codigo: 'ilegible' });
  await subirCapturaAlPagar(page);
  await page.locator('[data-accion="cancelar-pedido"]').click();
  await page.locator('.ov-barra .si').click();
  await expect.poll(() => calls.filter((c) => c.action === 'cancel-my-order').length).toBe(1);
  await expect(page.locator('.m06 [data-estado-pago="cancelado"]')).toBeVisible();
});

test('un toque: el botón de 30CM agrega el de 30 sin pasar por la ficha', async ({ page }) => {
  await gotoApp(page, { '*': { success: true } });
  await page.locator('.m15 .plato').first().locator('[data-accion="agregar-30"]').click();
  await expect(page.locator('.f01')).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).cart.map((it: any) => it.size))).toEqual(['30']);
});

// Promesa: «Avísame» de la puerta antes de abrir anota el celular. Fallo silencioso: el cliente
// cree que le van a escribir y nadie lo tiene.
test('antes de abrir, «Avísame» anota el celular en la lista de espera', async ({ page }) => {
  const calls = await mockBackend(page, { 'get-store-hours': { hours: {}, businessLaunched: false }, 'waitlist-join': { success: true } } as any);
  await stubWindowOpen(page);
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.locator('[data-accion="avisame-al-abrir"]').click();
  await page.locator('#ui-prompt-input').fill('987654321');
  await page.locator('#ui-prompt-input').press('Enter');
  await expect.poll(() => calls.find((c: any) => c.action === 'waitlist-join')?.body.phone).toBe('987654321');
  await expect(page.locator('[data-accion="avisame-al-abrir"]')).toHaveCount(0);
});
