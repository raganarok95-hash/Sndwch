import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// ENTRAR CON CORREO Y CÓDIGO — y que no quede nada vivo al salir.
//
// El login por correo se construyó el 2026-09-23 con pruebas solo del lado del servidor
// (tests-api/prueba-de-correo.test.ts). La auditoría de ese mismo día encontró tres defectos
// en el CLIENTE que ninguna prueba podía ver:
//   · el registro con correo verificado seguía pidiendo PIN, contra el «No hay contraseña»
//     que la pantalla acababa de prometer, y mostraba un campo de correo vacío que el
//     servidor ignoraba al guardar;
//   · cerrar sesión no reiniciaba el login por correo;
//   · y dejaba viva en memoria la prueba de correo verificado, que el siguiente registro en
//     el mismo equipo mandaba: la cuenta nueva se quedaba con el correo de otra persona.

const CORREO = 'ana@ejemplo.com';

async function pedirYVerificar(page: any) {
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-email').fill(CORREO);
  await page.locator('button[onclick="doPedirCodigo()"]').click();
  await page.locator('#l-code').fill('123456');
  await page.locator('button[onclick="doVerificarCodigo()"]').click();
}

test('con cuenta: correo, código, y adentro — sin PIN en ningún momento', async ({ page }) => {
  const calls = await gotoApp(page, {
    'request-login-code': { success: true, masked: 'a***@ejemplo.com' },
    'verify-login-code': { customer: { phone: '900000001', name: 'Ana', points: 0 }, isAdmin: false, token: 'tok-ana' },
  });
  await pedirYVerificar(page);
  await expect(page.locator('[onclick*="sndScreen=\'p_orders\'"]').first()).toBeVisible();
  expect(calls.find((c) => c.action === 'request-login-code')!.body.email).toBe(CORREO);
  expect(calls.find((c) => c.action === 'verify-login-code')!.body.code).toBe('123456');
});

test('sin cuenta: el registro muestra el correo verificado y no pide PIN ni correo', async ({ page }) => {
  const calls = await gotoApp(page, {
    'request-login-code': { success: true, masked: 'a***@ejemplo.com' },
    'verify-login-code': { success: true, needsRegistration: true, email: CORREO, emailProof: 'PRUEBA-DE-ANA' },
    register: { customer: { phone: '900000002', name: 'Ana', points: 0 }, isAdmin: false, token: 'tok-ana' },
  });
  await pedirYVerificar(page);

  await expect(page.getByText('Verificamos ' + CORREO)).toBeVisible();
  await expect(page.locator('#r-pin'), 'pedir PIN contradice «No hay contraseña»').toHaveCount(0);
  await expect(page.locator('#r-email'), 'un campo de correo que el servidor ignora').toHaveCount(0);

  await page.locator('#r-name').fill('Ana Prueba');
  await page.locator('#r-phone').fill('900000002');
  await page.locator('#r-dni').fill('12345678');
  await page.locator('#r-bday').fill('01/01/1995');
  await page.locator('button[onclick="doReg()"]').click();
  await expect.poll(() => calls.some((c) => c.action === 'register')).toBe(true);

  const reg = calls.find((c) => c.action === 'register')!.body;
  expect(reg.emailProof).toBe('PRUEBA-DE-ANA');
  expect(reg.pin, 'el PIN lo genera el servidor').toBe('');
  // El DNI sigue siendo obligatorio por este camino (regla permanente del proyecto).
  expect(reg.dni).toBe('12345678');
});

test('registrarse con el correo verificado gasta la prueba: no queda viva para el siguiente', async ({ page }) => {
  await gotoApp(page, {
    'request-login-code': { success: true, masked: 'a***@ejemplo.com' },
    'verify-login-code': { success: true, needsRegistration: true, email: CORREO, emailProof: 'PRUEBA-DE-ANA' },
    register: { customer: { phone: '900000002', name: 'Ana', points: 0 }, isAdmin: false, token: 'tok-ana' },
  });
  await pedirYVerificar(page);
  await page.locator('#r-name').fill('Ana Prueba');
  await page.locator('#r-phone').fill('900000002');
  await page.locator('#r-dni').fill('12345678');
  await page.locator('#r-bday').fill('01/01/1995');
  await page.locator('button[onclick="doReg()"]').click();
  await expect.poll(() => page.evaluate(() => !!(window as any).token)).toBe(true);

  // Se mira ANTES de cerrar sesión, que también la limpia: así esta prueba vigila el
  // registro y la de abajo vigila el cierre, cada una por su cuenta.
  const proof = await page.evaluate(() => (window as any).authProof);
  expect(proof, 'la prueba de correo de Ana sigue viva: el próximo registro en este equipo se la llevaría').toBe('');
});

test('cerrar sesión devuelve el login al correo, no al teléfono de la persona anterior', async ({ page }) => {
  await gotoApp(page, {
    login: { customer: { phone: '900000001', name: 'Ana', points: 0 }, isAdmin: false, token: 'tok-ana' },
  });
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('[onclick*="authPinFallback=true"]').click();
  await page.locator('#l-phone').fill('900000001');
  await page.locator('#l-pin').fill('1234');
  await page.locator('button[onclick="doLogin()"]').click();
  await expect.poll(() => page.evaluate(() => !!(window as any).token)).toBe(true);

  await page.evaluate(() => (window as any).doLogout());
  await page.locator('button[onclick*="atab=\'login\'"]').click();
  await expect(page.locator('#l-email'), 'la persona siguiente ve el formulario de teléfono de la anterior').toBeVisible();
  await expect(page.locator('#l-phone')).toHaveCount(0);
});
