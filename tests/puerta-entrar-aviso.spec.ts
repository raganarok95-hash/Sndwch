import { test, expect, type Page } from '@playwright/test';
import { gotoApp, mockBackend } from './helpers';

// LA PUERTA, ENTRAR Y EL AVISO DE PUNTOS (maquetas aprobadas el 2026-09-25).
//
// Lo que no puede pasar en silencio:
//   · que la app vuelva a saltarse la puerta porque recuerda un lado (duró del 17 al 25-09);
//   · que el pie de la puerta diga un envío o una hora escritos a mano;
//   · que antes de pagar se le pida una cuenta a nadie;
//   · que el aviso prometa unos puntos distintos de los que el pedido da, o que al crear la
//     cuenta desde él el pedido no viaje para vincularse (el cliente se quedaría sin sus puntos);
//   · que quien YA tenía cuenta entre desde el aviso y el pedido no se le vincule.
// Los montos y los productos se leen de la app: nada de esto nombra un sándwich.

const ORDEN = (body: any) => ({
  success: true,
  order: { id: 'ord-1', ref: body.ref, status: 'RECIBIDO', payment_status: 'pending', payment_method: 'yape', total: body.total },
  customer: null,
});

async function pagarComoInvitado(page: Page) {
  await page.locator('[onclick*="startOrderWithSig("]').first().click();
  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.locator('[onclick^="sigId="]').first().click();
  await page.getByRole('button', { name: 'CONTINUAR //' }).click();
  await page.locator('#o-nom').fill('Cliente Invitado');
  await page.locator('#o-phone').fill('987654321');
  await page.locator('#o-addr').fill('Av. España 123, Trujillo');
  await page.locator('#o-district').selectOption('trujillo');
  await page.locator('[onclick*="selectPayMethod(\'yape\')"]').click();
  await page.getByRole('button', { name: 'YA REALICÉ EL PAGO //' }).click();
  await page.getByRole('button', { name: 'CONFIRMAR //' }).click();
  await expect(page.locator('.m06 .ok', { hasText: 'Pedido recibido' })).toBeVisible({ timeout: 10000 });
}

test('la app abre en la puerta aunque la vez pasada se haya elegido un lado, y sin barra', async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.setItem('sw_lado', 'sig'); } catch (e) { /* sin storage */ } });
  await mockBackend(page, {});
  await page.goto('file://' + process.cwd() + '/index.html');
  await expect(page.locator('.pta')).toBeVisible();
  await expect(page.locator('.bottom-nav')).toHaveCount(0);
  // La puerta cubre la pantalla entera.
  const alto = await page.evaluate(() => (document.querySelector('.pta') as HTMLElement).getBoundingClientRect().height);
  expect(alto).toBeGreaterThanOrEqual(await page.evaluate(() => window.innerHeight));
});

test('el pie de la puerta dice el envío mínimo que tiene el código, no uno escrito', async ({ page }) => {
  await mockBackend(page, {});
  await page.goto('file://' + process.cwd() + '/index.html');
  await expect(page.locator('.pta .pie em')).toContainText('delivery desde S/');
  // Se mueve el envío mínimo en caliente: si el pie lo tuviera escrito, no cambiaría.
  const nuevo = await page.evaluate(() => { const w = window as any; w.DELIVERY_MIN_FEE = w.DELIVERY_MIN_FEE + 3; w.render(); return w.DELIVERY_MIN_FEE; });
  await expect(page.locator('.pta .pie em')).toContainText('delivery desde S/' + nuevo);
});

test('la esquina: sin sesión abre Entrar; con sesión dice el nombre y los puntos', async ({ page }) => {
  await mockBackend(page, {});
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.locator('.pta .yo').click();
  await expect(page.locator('.en')).toBeVisible();
  await page.locator('.en .sal').click();
  await expect(page.locator('.pta')).toBeVisible();
  await page.evaluate(() => { const w = window as any; w.cust = { name: 'Ana Pérez', phone: '900000001', points: 137 }; w.render(); });
  await expect(page.locator('.pta .yo')).toContainText('Ana');
  await expect(page.locator('.pta .yo')).toContainText('137 pts');
});

test('antes de pagar no se ofrece ninguna cuenta', async ({ page }) => {
  await gotoApp(page, { 'place-order': ORDEN });
  await page.locator('[onclick*="startOrderWithSig("]').first().click();
  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.locator('[onclick^="sigId="]').first().click();
  await page.getByRole('button', { name: 'CONTINUAR //' }).click();
  await expect(page.locator('#o-nom')).toBeVisible();
  await expect(page.locator('#google-btn-mount')).toHaveCount(0);
  await expect(page.locator('text=Crea tu cuenta')).toHaveCount(0);
});

test('el aviso ofrece los puntos del pedido y, con correo, crea la cuenta llevando el pedido', async ({ page }) => {
  const calls = await gotoApp(page, {
    'place-order': ORDEN,
    'request-login-code': () => ({ success: true, masked: 'an•••@correo.com' }),
    'verify-login-code': () => ({ needsRegistration: true, emailProof: 'prueba-firmada', email: 'ana@correo.com' }),
    register: (b: any) => ({ customer: { name: b.name, phone: b.phone, points: 99, total_orders: 1 }, isAdmin: false, token: 'tok' }),
  });
  await pagarComoInvitado(page);
  const pts = await page.evaluate(() => (window as any)._lPoints);
  expect(pts).toBeGreaterThan(0);
  await expect(page.locator('.m06 .dr.espera')).toContainText(`+${pts} puntos`);

  await page.getByRole('button', { name: /Correo|correo/ }).click();
  await expect(page.locator('.m06.sube')).toBeVisible();
  await page.locator('#av-email').fill('ana@correo.com');
  await page.locator('#av-dni').fill('12345678');
  await page.locator('#av-bday').fill('05/05/1995');
  await page.locator('.m06-go .oro').click();
  await page.locator('#av-code').fill('123456');
  await page.locator('.m06-go .oro').click();

  await expect.poll(() => calls.some((c) => c.action === 'register'), { message: 'no se creó la cuenta' }).toBe(true);
  const reg = calls.find((c) => c.action === 'register')!;
  const ref = await page.evaluate(() => (window as any)._lRef);
  expect(reg.body.claimOrderRef).toBe(ref);
  expect(reg.body.name).toBe('Cliente Invitado');
  expect(reg.body.phone).toBe('987654321');
  expect(reg.body.dni).toBe('12345678');
  expect(reg.body.emailProof).toBe('prueba-firmada');
  // Ya con cuenta, el aviso desaparece y la losa vuelve a ser la de la maqueta.
  await expect(page.locator('.m06 .dr.espera')).toHaveCount(0);
  await expect(page.locator('.m06:not(.sube)')).toBeVisible();
});

test('quien ya tenía cuenta entra desde el aviso y se le vincula ESTE pedido', async ({ page }) => {
  const calls = await gotoApp(page, {
    'place-order': ORDEN,
    'request-login-code': () => ({ success: true, masked: 'an•••@correo.com' }),
    'verify-login-code': () => ({ customer: { name: 'Ana', phone: '987654321', points: 10, total_orders: 4 }, isAdmin: false, token: 'tok' }),
    'reclamar-pedido': () => ({ acreditado: true, customer: { name: 'Ana', phone: '987654321', points: 60, total_orders: 5 } }),
  });
  await pagarComoInvitado(page);
  await page.getByRole('button', { name: /Correo|correo/ }).click();
  await page.locator('#av-email').fill('ana@correo.com');
  await page.locator('#av-dni').fill('12345678');
  await page.locator('#av-bday').fill('05/05/1995');
  await page.locator('.m06-go .oro').click();
  await page.locator('#av-code').fill('123456');
  await page.locator('.m06-go .oro').click();

  await expect.poll(() => calls.some((c) => c.action === 'reclamar-pedido'), { message: 'no se pidió vincular el pedido' }).toBe(true);
  const rec = calls.find((c) => c.action === 'reclamar-pedido');
  expect(rec!.body.ref).toBe(await page.evaluate(() => (window as any)._lRef));
  expect(rec!.body.token).toBe('tok');
  expect(calls.find((c) => c.action === 'register')).toBeFalsy();
});

// Lo que se ESCRIBE también tiene que leerse. La prueba de contraste mira textos pintados, no el
// valor de un input, y una regla global (`input{color:#EFEDE4 !important}`, pensada para fondos
// oscuros) dejaba lo escrito crema sobre el papel crema de Entrar y de la losa: invisible.
test('lo que se escribe en Entrar y en la losa se lee', async ({ page }) => {
  await mockBackend(page, {});
  await page.goto('file://' + process.cwd() + '/index.html');
  const ratios = await page.evaluate(() => {
    const w = window as any;
    const lum = (c: string) => {
      const m = (c.match(/[\d.]+/g) || ['0', '0', '0']).slice(0, 3).map(Number).map((v) => {
        v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2];
    };
    const ratio = (id: string, fondoSel: string) => {
      const a = lum(getComputedStyle(document.getElementById(id)!).color);
      const b = lum(getComputedStyle(document.querySelector(fondoSel)!).backgroundColor);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    };
    w.sndScreen = 'p_auth'; w.render();
    const entrar = ratio('l-email', '.en');
    w._lRef = 'ORD-PRUEBA-1'; w._lTot = 30; w._lPoints = 25; w._lPendingPayment = false;
    w.avisoPaso = 'correo'; w.sndScreen = 'o_sent'; w.render();
    const losa = ratio('av-email', '.m06 .losa');
    return { entrar, losa };
  });
  expect(ratios.entrar).toBeGreaterThanOrEqual(4.5);
  expect(ratios.losa).toBeGreaterThanOrEqual(4.5);
});
