import { test, expect } from '@playwright/test';
import { gotoApp, mockBackend, APP_FILE } from './helpers';

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
  // Y se da la bienvenida por vista: con Google configurado, la primera apertura se
  // interpone ANTES del home, y gotoApp() espera el home para devolver el control. Eso no
  // es un detalle del arnés — es exactamente lo que le va a pasar a todo visitante nuevo en
  // producción, y por eso la prueba de más abajo comprueba que salir de ahí cuesta un toque.
  await page.addInitScript(() => {
    try { localStorage.setItem('sw_seen_hello', '1'); } catch (e) { /* sin storage */ }
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
  // El único otro campo es opcional y lo dice.
  await expect(page.locator('#g-ref')).toHaveAttribute('placeholder', /opcional/);
});

test('se ve CON QUÉ cuenta está entrando, y no es editable', async ({ page }) => {
  await gotoApp(page);
  await entraConGoogle(page);

  // El nombre y el correo se muestran para que la persona confirme que es su cuenta. No
  // son campos: el servidor los toma del token firmado por Google y no del cuerpo de la
  // petición, así que un input editable mentiría sobre lo que se va a guardar.
  await expect(page.locator('text=' + PREFILL.name)).toBeVisible();
  await expect(page.locator('text=' + PREFILL.email)).toBeVisible();
  await expect(page.locator('input[value="' + PREFILL.name + '"]')).toHaveCount(0);
});

test('el teléfono se manda sin dni, sin bday y sin pin — el servidor los resuelve', async ({ page }) => {
  const calls = await gotoApp(page, {
    register: { customer: { phone: '987654321', name: PREFILL.name, points: 50 }, isAdmin: false, token: 'tok' },
  });
  await entraConGoogle(page);

  await page.locator('#g-phone').fill('987654321');
  await page.getByRole('button', { name: 'CREAR MI CUENTA //' }).click();

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
  await page.getByRole('button', { name: 'CREAR MI CUENTA //' }).click();

  await expect(page.locator('#g-phone-msg')).toHaveText('Ingresa un teléfono de contacto válido.');
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
// Tres sitios, elegidos por el dueño: PUNTOS sin sesión (ya existía), el checkout de
// invitado, y la primera apertura. Los tres pasan por googleCtaHTML(), que es no-op si el
// GOOGLE_CLIENT_ID no está configurado — así que sin el secret la app se ve exactamente
// como antes en vez de mostrar un hueco.

test('la primera apertura ofrece Google, pero VER LA CARTA es un botón del mismo peso', async ({ page }) => {
  // Navegación a mano y no gotoApp(): gotoApp espera el home, y el sentido de esta pantalla
  // es precisamente aparecer antes que él.
  await page.addInitScript(() => {
    const valor = 'prueba.apps.googleusercontent.com';
    Object.defineProperty(window, 'GOOGLE_CLIENT_ID', { configurable: true, get: () => valor, set: () => {} });
  });
  await mockBackend(page);
  await page.goto(APP_FILE);

  // Es una puerta antes del menú y el dueño la aceptó sabiéndolo. Lo que no puede pasar es
  // que no se pueda saltar de un toque: quien llega de un anuncio quiere ver comida.
  const verCarta = page.getByRole('button', { name: 'VER LA CARTA //' });
  await expect(verCarta).toBeVisible();
  await verCarta.click();
  await expect(verCarta).toHaveCount(0);

  // Y no vuelve a aparecer: la marca se escribe al MOSTRARLA, no al salir, así que cerrar
  // la pestaña en esa pantalla no la deja reapareciendo para siempre.
  expect(await page.evaluate(() => localStorage.getItem('sw_seen_hello'))).toBe('1');
});

test('el checkout de invitado ofrece Google ARRIBA de los campos, no después', async ({ page }) => {
  await conClientIdFalso(page);
  await gotoApp(page);
  await page.locator('[onclick*="startOrderWithSig("]').first().click();
  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.locator('[onclick^="sigId="]').first().click();
  await page.getByRole('button', { name: 'CONTINUAR //' }).click();
  await expect(page.locator('text=CONFIRMAR SÁNDWICH')).toBeVisible();

  // El botón existe para ahorrarles escribir, así que ofrecerlo después de que ya
  // escribieron nombre y correo no ahorra nada.
  const yMount = await page.locator('#google-btn-mount').evaluate((e) => e.getBoundingClientRect().top);
  const yNombre = await page.locator('#o-nom').evaluate((e) => e.getBoundingClientRect().top);
  expect(yMount).toBeLessThan(yNombre);
});
