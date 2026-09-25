import { test, expect } from '@playwright/test';
import { gotoApp, mockBackend, APP_FILE, OPEN_ALL_DAY_HOURS as HORARIO_ABIERTO } from './helpers';

// "Continuar con Google" tiene que crear la cuenta en segundos (decisión del dueño,
// 2026-09-12). Antes verificaba la identidad y después mandaba al formulario COMPLETO:
// nombre, teléfono, PIN, DNI, fecha de nacimiento y correo. Ahorraba dos campos de seis y
// seguía siendo un registro.
//
// Ahora queda UN campo. El teléfono no se puede evitar y no es una decisión de producto:
// es la primary key de `customers`, con seis tablas apuntándole por foreign key, y es lo
// único con lo que se ubica a alguien para entregarle el pedido. Google no lo devuelve en
// ningún scope de Sign-In.
//
// MODO DE FALLO: SILENCIO. Si alguien devuelve onGoogleCredential a `atab='reg'`, no falla
// ningún typecheck ni revienta nada — la app solo vuelve a pedir seis campos y la barrera
// de registro regresa sin que nadie se entere.

const PREFILL = { name: 'Rosa Villanueva', email: 'rosa@example.com' };

// El bundle arranca con GOOGLE_CLIENT_ID en el marcador 'REEMPLAZA_...' y googleConfigured()
// devuelve false, así que todo lo de Google no se dibuja — que es lo correcto en producción
// sin el secret, pero deja sin verificar justo lo que se acaba de construir. Esto le pone un
// id de mentira ANTES de que el bundle corra. No llama a Google: el script de Google no
// carga en un file:// sin red, y mountGoogleButton() ya sale solo si google.accounts no
// existe. Lo que se verifica es el hueco y la copia alrededor, que es lo que rompe un
// refactor.
async function conClientIdFalso(page: any) {
  // Un accessor definido ANTES de que corra el bundle. Asignar el valor más tarde no sirve:
  // `var GOOGLE_CLIENT_ID = '...'` se evalúa al parsear el script y la comprobación de la
  // primera apertura ocurre en el mismo arranque, así que cualquier escritura posterior
  // llega tarde. El setter se traga la asignación del marcador y el getter sigue
  // devolviendo el id de prueba.
  await page.addInitScript(() => {
    const valor = 'prueba.apps.googleusercontent.com';
    Object.defineProperty(window, 'GOOGLE_CLIENT_ID', {
      configurable: true,
      get: () => valor,
      set: () => { /* el bundle escribe el marcador REEMPLAZA_...; se ignora */ },
    });
  });
}

async function entraConGoogle(page: any) {
  await page.evaluate((p: any) => {
    (window as any)._googleIdToken = 'token-de-prueba';
    (window as any)._googleLinkedEmail = p.email;
    (window as any)._lastGuestName = p.name;
    (window as any)._lastGuestEmail = p.email;
    (window as any).go('p_gauth');
  }, PREFILL);
}

test('tras Google queda UN solo campo obligatorio: el teléfono', async ({ page }) => {
  await gotoApp(page);
  await entraConGoogle(page);

  await expect(page.locator('#g-phone')).toBeVisible();
  // Nada de DNI, PIN ni fecha de nacimiento por este camino.
  await expect(page.locator('#r-dni')).toHaveCount(0);
  await expect(page.locator('#r-pin')).toHaveCount(0);
  await expect(page.locator('#r-bday')).toHaveCount(0);
  // El código de quien invitó es opcional: no se muestra como campo hasta que se pide.
  await expect(page.locator('#g-ref')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Te invitó alguien/ })).toBeVisible();
});

test('se ve CON QUÉ cuenta está entrando, y no es editable', async ({ page }) => {
  await gotoApp(page);
  await entraConGoogle(page);

  // Entrar la saluda por su nombre («Hola, Rosa», como la maqueta) para que confirme que es
  // su cuenta. No es un campo: el servidor toma nombre y correo del token firmado por Google
  // y no del cuerpo de la petición, así que un input editable mentiría sobre lo que se guarda.
  await expect(page.locator('.en .esc .tx em')).toHaveText('Hola, ' + PREFILL.name.split(' ')[0]);
  await expect(page.locator('input[value="' + PREFILL.name + '"]')).toHaveCount(0);
});

test('el teléfono se manda sin dni, sin bday y sin pin — el servidor los resuelve', async ({ page }) => {
  const calls = await gotoApp(page, {
    register: { customer: { phone: '987654321', name: PREFILL.name, points: 50 }, isAdmin: false, token: 'tok' },
  });
  await entraConGoogle(page);

  await page.locator('#g-phone').fill('987654321');
  await page.locator('.en-go .oro').click();

  await expect.poll(() => calls.filter((c) => c.action === 'register').length).toBe(1);
  const b = calls.find((c) => c.action === 'register')!.body;
  expect(b.phone).toBe('987654321');
  expect(b.googleIdToken).toBe('token-de-prueba');
  // Lo que NO viaja. El nombre tampoco: mandarlo dejaría registrarse con el token de otra
  // persona poniéndole el nombre que uno quisiera.
  expect(b.dni).toBeUndefined();
  expect(b.bday).toBeUndefined();
  expect(b.pin).toBeUndefined();
  expect(b.name).toBeUndefined();
});

test('un teléfono corto se avisa en el campo, sin viaje de red', async ({ page }) => {
  const calls = await gotoApp(page);
  await entraConGoogle(page);

  await page.locator('#g-phone').fill('98');
  await page.locator('.en-go .oro').click();

  await expect(page.locator('#gauth-err')).toHaveText('Ingresa un teléfono válido.');
  expect(calls.filter((c) => c.action === 'register')).toHaveLength(0);
});

test('hay salida si el celular es prestado', async ({ page }) => {
  await gotoApp(page);
  await entraConGoogle(page);

  // Sin esta salida, quien tome el dispositivo después queda atrapado en la cuenta de
  // Google de otra persona.
  await page.getByRole('button', { name: /No soy yo/ }).click();
  await expect(page.locator('#g-phone')).toHaveCount(0);
  expect(await page.evaluate(() => (window as any)._googleIdToken)).toBeFalsy();
});

// ── DÓNDE APARECE EL BOTÓN ─────────────────────────────────────────────────────────────
// Desde el 2026-09-25 (dueño): en Entrar y en el aviso de puntos de la 06A, DESPUÉS de pagar.
// Ya no hay bienvenida al abrir ni botón en el checkout: antes de pagar no se pide ninguna
// cuenta. Las dos pruebas de abajo lo verifican CON Google configurado, que es cuando el botón
// podría colarse.

test('el client id se guarda para que la SIGUIENTE visita no dependa de la red', async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.removeItem('sw_gcid'); } catch (e) { /* sin storage */ }
  });
  await mockBackend(page, {
    'get-store-hours': { hours: HORARIO_ABIERTO, businessLaunched: true, googleClientId: 'prueba.apps.googleusercontent.com' },
  });
  await page.goto(APP_FILE);
  await page.waitForTimeout(800);
  // Es un valor PÚBLICO, no un secreto: viaja en el HTML de cualquier sitio con Sign-In.
  expect(await page.evaluate(() => localStorage.getItem('sw_gcid'))).toContain('apps.googleusercontent.com');
});

test('con Google configurado, la app igual abre en la puerta y el checkout no ofrece cuenta', async ({ page }) => {
  await conClientIdFalso(page);
  await gotoApp(page);
  await page.locator('[onclick*="startOrderWithSig("]').first().click();
  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.locator('[onclick^="sigId="]').first().click();
  await page.getByRole('button', { name: 'CONTINUAR //' }).click();
  await expect(page.locator('#o-nom')).toBeVisible();
  await expect(page.locator('#google-btn-mount')).toHaveCount(0);
});

test('con Google configurado, Entrar y el aviso de la 06A tienen su hueco para el botón', async ({ page }) => {
  await conClientIdFalso(page);
  await gotoApp(page);
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await expect(page.locator('.en #google-btn-mount')).toHaveCount(1);
  await page.evaluate(() => {
    const w = window as any;
    w._lRef = 'ORD-PRUEBA-1'; w._lTot = 30; w._lPoints = 25; w._lPendingPayment = false;
    w._lastGuestName = 'Rosa'; w._lastGuestPhone = '987654321'; w.go('o_sent');
  });
  await expect(page.locator('.m06 .guardar #google-btn-mount')).toHaveCount(1);
});
